import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { messagesAPI, leaseRequestsAPI } from '../../utils/api'
import { toast } from 'react-toastify'
import UserAvatar from '../../components/UserAvatar'
import io from 'socket.io-client'
import { 
  FiSend, FiSearch, FiMoreVertical, FiPaperclip, 
  FiPhone, FiVideo, FiCheck, FiCheckCircle, FiImage, 
  FiUser, FiFlag, FiSlash, FiTrash2, FiX, FiHome,
  FiCalendar, FiDollarSign, FiClock, FiAlertCircle,
  FiArrowLeft, FiInfo, FiFileText, FiEdit, FiShare2
} from 'react-icons/fi'

function Messages() {
  const { user, token } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [socket, setSocket] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [typingUsers, setTypingUsers] = useState({})
  const [showReportModal, setShowReportModal] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [showLeaseRequestModal, setShowLeaseRequestModal] = useState(false)
  const [leaseRequests, setLeaseRequests] = useState([])
  const [reportData, setReportData] = useState({ type: '', description: '' })
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState([])
  const [userSearchLoading, setUserSearchLoading] = useState(false)
  const userSearchTimeoutRef = useRef(null)
  const [leaseRequestData, setLeaseRequestData] = useState({
    proposedMoveIn: '',
    proposedDuration: 'yearly',
    message: ''
  })
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const optionsMenuRef = useRef(null)

  // Initialize socket connection
  useEffect(() => {
    if (user && token) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token }
      })

      newSocket.on('connect', () => {
        console.log('Socket connected')
        newSocket.emit('join', user._id || user.id)
      })

      newSocket.on('online-users', (users) => {
        setOnlineUsers(new Set(users))
      })

      newSocket.on('user-online', (userId) => {
        setOnlineUsers(prev => new Set([...prev, userId]))
      })

      newSocket.on('user-offline', (userId) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
      })

      newSocket.on('new-message', (message) => {
        // Skip if message is from current user (already added optimistically)
        const senderId = message.sender?._id || message.sender
        if (senderId === (user._id || user.id)) return
        
        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev
          return [...prev, message]
        })
        
        setConversations(prev => prev.map(conv => {
          if (conv._id === message.conversation) {
            return { ...conv, lastMessage: message, updatedAt: new Date() }
          }
          return conv
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
      })

      newSocket.on('messages-read', ({ conversationId, userId }) => {
        if (userId !== (user._id || user.id)) {
          setMessages(prev => prev.map(msg => ({
            ...msg,
            isRead: msg.conversation === conversationId ? true : msg.isRead
          })))
        }
      })

      newSocket.on('user-typing', ({ userId, userName, conversationId }) => {
        setTypingUsers(prev => ({ ...prev, [conversationId]: { userId, userName } }))
      })

      newSocket.on('user-stop-typing', ({ conversationId }) => {
        setTypingUsers(prev => {
          const newTyping = { ...prev }
          delete newTyping[conversationId]
          return newTyping
        })
      })

      newSocket.on('lease-request-update', (data) => {
        toast.info(`Lease request ${data.status}: ${data.message}`)
        fetchLeaseRequests()
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    }
  }, [user, token])

  // Load conversations
  useEffect(() => {
    if (token) {
      fetchConversations()
      fetchLeaseRequests()
    }
  }, [token])

  // Handle URL params for new conversation
  useEffect(() => {
    const propertyId = searchParams.get('property')
    const hostId = searchParams.get('host')
    
    if (propertyId && hostId && token) {
      createOrFindConversation(propertyId, hostId)
    }
  }, [searchParams, token])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptionsMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await messagesAPI.getConversations()
      setConversations(response.data.data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaseRequests = async () => {
    try {
      const response = await leaseRequestsAPI.getMyRequests()
      setLeaseRequests(response.data.data || [])
    } catch (error) {
      console.error('Error fetching lease requests:', error)
    }
  }

  const createOrFindConversation = async (propertyId, hostId) => {
    try {
      const response = await messagesAPI.createConversation(hostId, propertyId)
      const conversation = response.data.data
      
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversation._id)
        if (exists) return prev
        return [conversation, ...prev]
      })
      
      setSelectedConversation(conversation)
      loadMessages(conversation._id)
      
      navigate('/dashboard/messages', { replace: true })
    } catch (error) {
      console.error('Error creating conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  const loadMessages = async (conversationId) => {
    try {
      setMessagesLoading(true)
      const response = await messagesAPI.getMessages(conversationId)
      setMessages(response.data.data || [])
      
      if (socket) {
        socket.emit('join-conversation', conversationId)
      }
      
      await messagesAPI.markAsRead(conversationId)
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || sending) return

    try {
      setSending(true)
      const response = await messagesAPI.sendMessage(
        selectedConversation._id,
        newMessage.trim()
      )
      
      const message = response.data.data
      // Add message to local state immediately for optimistic UI
      setMessages(prev => {
        // Prevent duplicate if socket event already added it
        if (prev.some(m => m._id === message._id)) return prev
        return [...prev, message]
      })
      setNewMessage('')
      
      // Only emit stop-typing, NOT send-message (API already broadcasts via socket)
      if (socket) {
        socket.emit('stop-typing', {
          conversationId: selectedConversation._id,
          userId: user._id || user.id
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleTyping = useCallback(() => {
    if (!socket || !selectedConversation) return
    
    socket.emit('typing', {
      conversationId: selectedConversation._id,
      userId: user._id || user.id,
      userName: user.name
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', {
        conversationId: selectedConversation._id,
        userId: user._id || user.id
      })
    }, 2000)
  }, [socket, selectedConversation, user])

  const handleSelectConversation = (conversation) => {
    if (socket && selectedConversation) {
      socket.emit('leave-conversation', selectedConversation._id)
    }
    setSelectedConversation(conversation)
    loadMessages(conversation._id)
  }

  const handleBlockUser = async () => {
    if (!selectedConversation) return
    
    const otherUser = getOtherParticipant(selectedConversation)
    
    if (window.confirm(`Are you sure you want to block ${otherUser.name}?`)) {
      try {
        await messagesAPI.blockUser(selectedConversation._id)
        toast.success('User blocked successfully')
        setShowOptionsMenu(false)
        fetchConversations()
      } catch (error) {
        toast.error('Failed to block user')
      }
    }
  }

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return
    
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await messagesAPI.deleteConversation(selectedConversation._id)
        toast.success('Conversation deleted')
        setSelectedConversation(null)
        setMessages([])
        fetchConversations()
        setShowOptionsMenu(false)
      } catch (error) {
        toast.error('Failed to delete conversation')
      }
    }
  }

  const handleShareProperty = async () => {
    if (!selectedConversation?.property) {
      toast.error('No property to share')
      return
    }

    const property = selectedConversation.property
    const propertyUrl = `${window.location.origin}/properties/${property._id}`
    const shareData = {
      title: property.title,
      text: `Check out this property: ${property.title} - NPR ${property.rent?.toLocaleString()}/month`,
      url: propertyUrl
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        toast.success('Property shared successfully!')
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(propertyUrl)
        toast.success('Property link copied to clipboard!')
      }
      setShowOptionsMenu(false)
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error)
        // Try clipboard as fallback
        try {
          await navigator.clipboard.writeText(propertyUrl)
          toast.success('Property link copied to clipboard!')
          setShowOptionsMenu(false)
        } catch (clipboardError) {
          toast.error('Failed to share property')
        }
      }
    }
  }

  const handleReportUser = async (e) => {
    e.preventDefault()
    if (!reportData.type) {
      toast.error('Please select a report type')
      return
    }

    try {
      await messagesAPI.reportUser(selectedConversation._id, reportData)
      toast.success('Report submitted successfully')
      setShowReportModal(false)
      setReportData({ type: '', description: '' })
    } catch (error) {
      toast.error('Failed to submit report')
    }
  }

  const handleLeaseRequest = async (e) => {
    e.preventDefault()
    if (!selectedConversation?.property?._id) {
      toast.error('No property associated with this conversation')
      return
    }

    try {
      await leaseRequestsAPI.createRequest({
        propertyId: selectedConversation.property._id,
        conversationId: selectedConversation._id,
        ...leaseRequestData
      })
      toast.success('Lease request submitted successfully!')
      setShowLeaseRequestModal(false)
      setLeaseRequestData({ proposedMoveIn: '', proposedDuration: 'yearly', message: '' })
      fetchLeaseRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit lease request')
    }
  }

  const getOtherParticipant = (conversation) => {
    if (!conversation?.participants) return null
    const myId = user?._id || user?.id
    return conversation.participants.find(p => p._id !== myId) || conversation.participants[0]
  }

  const isUserOnline = (userId) => onlineUsers.has(userId)

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const hasExistingLeaseRequest = () => {
    if (!selectedConversation?.property?._id) return false
    return leaseRequests.some(
      req => req.property?._id === selectedConversation.property._id && 
             ['pending', 'approved', 'payment-pending'].includes(req.status)
    )
  }

  // User search for new chat
  const handleUserSearch = (query) => {
    setUserSearchQuery(query)
    
    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current)
    }

    if (query.trim().length < 2) {
      setUserSearchResults([])
      return
    }

    userSearchTimeoutRef.current = setTimeout(async () => {
      setUserSearchLoading(true)
      try {
        const response = await messagesAPI.searchUsers(query.trim())
        setUserSearchResults(response.data.data || [])
      } catch (error) {
        console.error('Error searching users:', error)
        toast.error('Failed to search users')
      } finally {
        setUserSearchLoading(false)
      }
    }, 300)
  }

  const handleStartConversation = async (targetUser) => {
    try {
      const response = await messagesAPI.createConversation(targetUser._id)
      const conversation = response.data.data
      
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversation._id)
        if (exists) return prev
        return [conversation, ...prev]
      })

      setSelectedConversation(conversation)
      loadMessages(conversation._id)
      setShowNewChatModal(false)
      setUserSearchQuery('')
      setUserSearchResults([])
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const otherUser = getOtherParticipant(conv)
    const searchLower = searchQuery.toLowerCase()
    return (
      otherUser?.name?.toLowerCase().includes(searchLower) ||
      conv.property?.title?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="h-[calc(100vh-80px)] flex bg-gray-100 min-h-0">
      {/* Conversations List */}
      <div className={`w-full md:w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">Messages</h1>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="flex items-center gap-2 px-2 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-xs font-medium"
            >
              <FiEdit className="w-3 h-3" />
              New Chat
            </button>
          </div>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FiUser className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No conversations yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Start a conversation by contacting a property host
              </p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const otherUser = getOtherParticipant(conv)
              const isOnline = isUserOnline(otherUser?._id)
              const isSelected = selectedConversation?._id === conv._id
              const unreadCount = conv.unreadCount || 0
              
              return (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-3 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 flex-shrink-0 ${
                    isSelected ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <div className="relative flex-shrink-0">
                      <UserAvatar name={otherUser?.name} avatar={otherUser?.avatar} size="md" />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {otherUser?.name || 'Unknown User'}
                        </h3>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.property && (
                        <p className="text-xs text-primary-600 truncate flex items-center gap-1 mt-0.5">
                          <FiHome className="w-3 h-3" />
                          {conv.property.title}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <p className="text-xs text-gray-600 truncate">
                          {typingUsers[conv._id] ? (
                            <span className="text-primary-600 italic">typing...</span>
                          ) : (
                            conv.lastMessage?.content || 'No messages yet'
                          )}
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-primary-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg text-sm"
                  >
                    <FiArrowLeft />
                  </button>
                  <div className="relative">
                    <UserAvatar name={getOtherParticipant(selectedConversation)?.name} avatar={getOtherParticipant(selectedConversation)?.avatar} size="sm" />
                    {isUserOnline(getOtherParticipant(selectedConversation)?._id) && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">
                      {getOtherParticipant(selectedConversation)?.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {isUserOnline(getOtherParticipant(selectedConversation)?._id) ? (
                        <span className="text-green-600">Online</span>
                      ) : (
                        'Offline'
                      )}
                      {selectedConversation.property && (
                        <> • {selectedConversation.property.title}</>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Lease Request Button */}
                  {user?.role === 'tenant' && selectedConversation.property && !hasExistingLeaseRequest() && (
                    <button
                      onClick={() => setShowLeaseRequestModal(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                    >
                      <FiFileText />
                      Request Lease
                    </button>
                  )}
                  
                  {/* Options Menu */}
                  <div className="relative" ref={optionsMenuRef}>
                    <button
                      onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      <FiMoreVertical />
                    </button>
                    
                    {showOptionsMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        {selectedConversation.property && (
                          <>
                            <button
                              onClick={() => {
                                navigate(`/properties/${selectedConversation.property._id}`)
                                setShowOptionsMenu(false)
                              }}
                              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <FiHome className="w-4 h-4" />
                              View Property
                            </button>
                            <button
                              onClick={handleShareProperty}
                              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <FiShare2 className="w-4 h-4" />
                              Share Property
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setShowReportModal(true)
                            setShowOptionsMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <FiFlag className="w-4 h-4" />
                          Report User
                        </button>
                        <button
                          onClick={handleBlockUser}
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <FiSlash className="w-4 h-4" />
                          Block User
                        </button>
                        <button
                          onClick={handleDeleteConversation}
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Property Info Bar */}
            {selectedConversation.property && (
              <div className="px-4 py-2 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <FiHome className="text-primary-600" />
                  <span className="font-medium text-primary-900">{selectedConversation.property.title}</span>
                  <span className="text-primary-600">•</span>
                  <span className="text-primary-700">
                    Rs. {selectedConversation.property.rent?.toLocaleString()}/month
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/properties/${selectedConversation.property._id}`)}
                  className="text-primary-600 hover:text-primary-800 text-sm flex items-center gap-1"
                >
                  <FiInfo className="w-4 h-4" />
                  Details
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FiUser className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-lg font-medium">Start the conversation</p>
                  <p className="text-sm">Send a message to begin chatting</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const senderId = message.sender?._id || message.sender
                  const userId = user?._id || user?.id
                  const isOwn = senderId === userId
                  const showDate = index === 0 || 
                    formatDate(messages[index - 1]?.createdAt) !== formatDate(message.createdAt)

                  return (
                    <div key={message._id}>
                      {showDate && (
                        <div className="flex items-center justify-center my-4">
                          <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {!isOwn && (
                          <div className="flex-shrink-0 mr-2">
                            <UserAvatar name={message.sender?.name} avatar={message.sender?.avatar} size="sm" />
                          </div>
                        )}
                        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          {!isOwn && message.sender?.name && (
                            <p className="text-xs text-gray-500 mb-1 ml-1">{message.sender.name}</p>
                          )}
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isOwn
                                ? 'bg-primary-600 text-white rounded-br-md'
                                : 'bg-white text-gray-900 shadow-sm rounded-bl-md'
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.createdAt)}
                            </span>
                            {isOwn && (
                              message.isRead ? (
                                <FiCheckCircle className="w-3 h-3 text-primary-600" />
                              ) : (
                                <FiCheck className="w-3 h-3 text-gray-400" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              
              {/* Typing Indicator */}
              {typingUsers[selectedConversation._id] && (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                  <span className="text-sm">{typingUsers[selectedConversation._id].userName} is typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <FiPaperclip />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <FiSend className={sending ? 'animate-pulse' : ''} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="w-12 h-12 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Messages</h2>
              <p className="text-gray-500 max-w-sm">
                Select a conversation to view messages or contact a property host to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report User</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleReportUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for reporting
                </label>
                <select
                  value={reportData.type}
                  onChange={(e) => setReportData({ ...reportData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="scam">Scam / Fraud</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="fake-listing">Fake Listing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={reportData.description}
                  onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Provide more information about the issue..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lease Request Modal */}
      {showLeaseRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Request Lease</h3>
              <button
                onClick={() => setShowLeaseRequestModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX />
              </button>
            </div>
            
            {selectedConversation?.property && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-medium text-gray-900">{selectedConversation.property.title}</p>
                <p className="text-sm text-gray-600">
                  Rs. {selectedConversation.property.rent?.toLocaleString()}/month
                </p>
              </div>
            )}
            
            <form onSubmit={handleLeaseRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiCalendar className="inline mr-1" />
                  Proposed Move-in Date
                </label>
                <input
                  type="date"
                  value={leaseRequestData.proposedMoveIn}
                  onChange={(e) => setLeaseRequestData({ ...leaseRequestData, proposedMoveIn: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiClock className="inline mr-1" />
                  Lease Duration
                </label>
                <select
                  value={leaseRequestData.proposedDuration}
                  onChange={(e) => setLeaseRequestData({ ...leaseRequestData, proposedDuration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="monthly">Monthly</option>
                  <option value="3-months">3 Months</option>
                  <option value="6-months">6 Months</option>
                  <option value="yearly">Yearly (12 months)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Host (optional)
                </label>
                <textarea
                  value={leaseRequestData.message}
                  onChange={(e) => setLeaseRequestData({ ...leaseRequestData, message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Introduce yourself and why you're interested..."
                />
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-sm text-yellow-800 flex items-start gap-2">
                  <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Once approved, you'll be asked to pay the security deposit to confirm your lease.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLeaseRequestModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
              <button
                onClick={() => {
                  setShowNewChatModal(false)
                  setUserSearchQuery('')
                  setUserSearchResults([])
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto">
              {userSearchLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : userSearchQuery.trim().length < 2 ? (
                <div className="text-center py-12 px-4">
                  <FiSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Search for users</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Type a name or email address to find people
                  </p>
                </div>
              ) : userSearchResults.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <FiUser className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No users found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try a different name or email address
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {userSearchResults.map((searchUser) => (
                    <button
                      key={searchUser._id}
                      onClick={() => handleStartConversation(searchUser)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                    >
                      <UserAvatar name={searchUser.name} avatar={searchUser.avatar} size="lg" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{searchUser.name}</p>
                        <p className="text-sm text-gray-500 truncate">{searchUser.email}</p>
                      </div>
                      <span className="text-xs text-gray-400 capitalize px-2 py-1 bg-gray-100 rounded-full">
                        {searchUser.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages
