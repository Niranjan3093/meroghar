import { useState, useEffect } from 'react';
import { visitSittingAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-toastify';
import { FiCalendar, FiClock, FiMessageSquare, FiCheck, FiX } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';

function BookVisit({ propertyId, hostName, hostId }) {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('09:00');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [bookedDates, setBookedDates] = useState(new Set());
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [calendarDates, setCalendarDates] = useState([]);
  const [remainingBookingsToday, setRemainingBookingsToday] = useState(1);

  useEffect(() => {
    if (showForm) {
      fetchAvailableDates();
    }
  }, [propertyId, selectedMonth, showForm]);

  useEffect(() => {
    if (user && propertyId) {
      checkTenantBookingStatus();
    }
  }, [user, propertyId]);

  const fetchAvailableDates = async () => {
    try {
      const response = await visitSittingAPI.getAvailableDates(propertyId, {
        month: selectedMonth.getMonth(),
        year: selectedMonth.getFullYear()
      });
      setAvailableDates(response.data.data);
      
      // Extract booked dates for quick lookup
      const booked = new Set();
      response.data.data.forEach(item => {
        if (!item.isAvailable) {
          booked.add(item.date);
        }
      });
      setBookedDates(booked);

      // Generate calendar for the month
      generateCalendarDates(response.data.data);
    } catch (error) {
      console.error('Failed to fetch available dates:', error);
      toast.error('Failed to load available dates');
    }
  };

  const generateCalendarDates = (dates) => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Max date is 3 weeks from today
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 21);

    const calendar = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0); // Normalize to midnight
    
    // Create a map of booked dates for faster lookup
    const bookedDatesMap = new Set();
    dates.forEach(d => {
      if (!d.isAvailable) {
        bookedDatesMap.add(d.date);
      }
    });

    // Convert to string for reliable date-only comparison
    const todayString = today.toISOString().split('T')[0];
    const maxDateString = maxDate.toISOString().split('T')[0];

    while (calendar.length < 42) {
      const dateString = current.toISOString().split('T')[0];
      const isPast = dateString < todayString;
      const isBeyondLimit = dateString > maxDateString;
      const isBooked = bookedDatesMap.has(dateString);
      
      calendar.push({
        date: new Date(current),
        dateString,
        isCurrentMonth: current.getMonth() === month,
        isAvailable: !isBooked,
        isPast,
        isBeyondLimit
      });
      current.setDate(current.getDate() + 1);
    }
    
    setCalendarDates(calendar);
  };

  const checkTenantBookingStatus = async () => {
    try {
      const response = await visitSittingAPI.getTenantRequests({ status: 'pending,approved' });
      const bookings = response.data.data;
      
      // Check if tenant has booking for today
      const today = new Date().toISOString().split('T')[0];
      const todayBooking = bookings.some(b => {
        const bookDate = new Date(b.visitDate).toISOString().split('T')[0];
        return bookDate === today;
      });

      setRemainingBookingsToday(todayBooking ? 0 : 1);
    } catch (error) {
      console.error('Failed to check booking status:', error);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to book a visit');
      setShowForm(false);
      return;
    }

    if (user._id === hostId) {
      toast.error('You cannot book a visit for your own property');
      return;
    }

    if (!visitDate || !visitTime) {
      toast.error('Please select a date and time');
      return;
    }

    if (remainingBookingsToday === 0) {
      toast.error('You already have a booking for this date. Please choose another date.');
      return;
    }

    // Validate 3-week booking window on client side
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 21);

    // Use string comparison for consistent date-only comparison
    const todayString = today.toISOString().split('T')[0];
    const maxDateString = maxDate.toISOString().split('T')[0];

    if (visitDate < todayString || visitDate > maxDateString) {
      toast.error('You can only book visits up to 3 weeks in advance');
      return;
    }

    try {
      setLoading(true);
      await visitSittingAPI.create({
        propertyId,
        visitDate,
        visitTime,
        message
      });

      toast.success('Visit booking request sent! Host will review it soon.');
      setVisitDate('');
      setVisitTime('09:00');
      setMessage('');
      setShowForm(false);
      
      // Refresh booking status
      checkTenantBookingStatus();
    } catch (error) {
      console.error('Failed to book visit:', error);
      const errorMessage = error.response?.data?.message || 'Failed to book visit';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (item) => {
    if (item.isAvailable) {
      setVisitDate(item.dateString);
    }
  };

  const handleMonthChange = (direction) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    
    // Allow navigation between current month and month containing the max booking date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Max date is 3 weeks from today
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 21);
    const maxMonthEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
    
    // Check if new month is within valid range (from current month to month containing max date)
    const newMonthStart = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
    
    // Allow if new month starts on or after current month and starts before or on max date
    if (newMonthStart >= currentMonthStart && newMonthStart <= maxMonthEnd) {
      setSelectedMonth(newMonth);
    }
  };

  const isDateDisabled = (date) => {
    return date.isPast || !date.isAvailable || date.isBeyondLimit;
  };

  return (
    <div>
      
      {!showForm ? (
        <div className="flex items-center gap-4">
          {remainingBookingsToday > 0 ? (
            <>
              <p className="text-gray-600">
                <span className="font-semibold text-green-600">{remainingBookingsToday}</span> booking slot available today
              </p>
              <p className="text-xs text-gray-500">(Book visits up to 3 weeks in advance)</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary flex items-center gap-2"
              >
                <FiCalendar size={18} />
                Book a Visit
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <FiX size={20} />
              <p>You've already booked a visit for today. Choose another date or contact the host.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-semibold text-gray-900">Select Visit Date & Time</h4>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmitBooking} className="space-y-6">
            {/* Calendar Section */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <button
                  type="button"
                  onClick={() => handleMonthChange(-1)}
                  className="text-gray-600 hover:text-gray-900 text-xl"
                >
                  ←
                </button>
                <h5 className="text-lg font-semibold text-gray-900">
                  {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h5>
                <button
                  type="button"
                  onClick={() => handleMonthChange(1)}
                  className="text-gray-600 hover:text-gray-900 text-xl"
                >
                  →
                </button>
              </div>

              {/* Booking Window Info */}
              <div className="bg-blue-50 border border-blue-200 p-2 rounded mb-4 text-xs text-blue-700">
                📅 You can book visits up to 3 weeks from today
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                {calendarDates.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDateSelect(item)}
                    disabled={isDateDisabled(item)}
                    className={`
                      p-2 rounded text-sm font-medium transition-colors
                      ${!item.isCurrentMonth ? 'text-gray-300 bg-gray-50' : ''}
                      ${item.isPast ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : ''}
                      ${item.isBeyondLimit ? 'text-orange-400 bg-orange-50 cursor-not-allowed' : ''}
                      ${isDateDisabled(item) && !item.isPast && !item.isBeyondLimit ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : ''}
                      ${!isDateDisabled(item) && item.dateString === visitDate ? 'bg-primary-600 text-white' : ''}
                      ${!isDateDisabled(item) && item.dateString !== visitDate ? 'bg-white text-gray-900 border border-gray-200 hover:border-primary-300 cursor-pointer' : ''}
                    `}
                    title={item.isPast ? 'Past date' : item.isBeyondLimit ? 'Beyond 3-week booking window' : item.isAvailable ? 'Available' : 'Already booked'}
                  >
                    {item.date.getDate()}
                  </button>
                ))}
              </div>

              {remainingBookingsToday === 0 && (
                <p className="text-sm text-red-600 mt-4 text-center">
                  You already have a booking for today. Select another date.
                </p>
              )}
            </div>

            {/* Time Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                <FiClock className="inline mr-2" size={16} />
                Preferred Time
              </label>
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="09:00"
                max="17:00"
              />
            </div>

            {/* Message Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                <FiMessageSquare className="inline mr-2" size={16} />
                Message to Host (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add any special requests or questions..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* Selected Date Summary */}
            {visitDate && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-900">
                  <FiCheck className="inline mr-2" size={16} />
                  Selected: {new Date(visitDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })} at {visitTime}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !visitDate || remainingBookingsToday === 0}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    Booking...
                  </>
                ) : (
                  <>
                    <FiCheck size={18} />
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default BookVisit;
