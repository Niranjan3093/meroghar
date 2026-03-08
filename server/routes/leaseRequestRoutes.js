import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import LeaseRequest from '../models/LeaseRequest.js';
import Lease from '../models/Lease.js';
import Payment from '../models/Payment.js';
import Property from '../models/Property.js';
import { Message, Conversation } from '../models/Message.js';
import { notifyLeaseRequest, notifyLeaseRequestResponse } from '../utils/notifications.js';

// Get all lease requests for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'tenant') {
      query = { tenant: req.user._id };
    } else if (req.user.role === 'host') {
      query = { host: req.user._id };
    } else if (req.user.role === 'admin') {
      query = {};
    }

    const requests = await LeaseRequest.find(query)
      .populate('property', 'title images address rent securityDeposit')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone')
      .populate('conversation')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching lease requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lease requests' });
  }
});

// Get single lease request
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await LeaseRequest.findById(req.params.id)
      .populate('property', 'title images address rent securityDeposit leaseDuration')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone')
      .populate('conversation')
      .populate('securityDepositPayment');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Lease request not found' });
    }

    // Verify user has access
    if (req.user.role !== 'admin' && 
        request.host._id.toString() !== req.user._id.toString() &&
        request.tenant._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Error fetching lease request:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lease request' });
  }
});

// Create lease request (tenant submits)
router.post('/', protect, async (req, res) => {
  try {
    const { propertyId, message, proposedMoveIn, proposedDuration, conversationId } = req.body;

    // Get property details
    const property = await Property.findById(propertyId).populate('host');
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Check if property is available
    if (property.status !== 'active' || property.verificationStatus !== 'verified') {
      return res.status(400).json({ success: false, message: 'Property is not available for rent' });
    }

    // Check if tenant already has a pending request for this property
    const existingRequest = await LeaseRequest.findOne({
      property: propertyId,
      tenant: req.user._id,
      status: { $in: ['pending', 'approved', 'payment-pending'] }
    });

    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active request for this property' 
      });
    }

    // Create the lease request
    const leaseRequest = await LeaseRequest.create({
      property: propertyId,
      host: property.host._id,
      tenant: req.user._id,
      conversation: conversationId,
      message,
      proposedMoveIn: new Date(proposedMoveIn),
      proposedDuration: proposedDuration || property.leaseDuration,
      monthlyRent: property.rent,
      securityDeposit: property.securityDeposit
    });

    // Create system message in conversation
    if (conversationId) {
      await Message.create({
        conversation: conversationId,
        sender: req.user._id,
        content: `🏠 Lease Request Submitted\n\nI've submitted a lease request for this property.\n• Move-in Date: ${new Date(proposedMoveIn).toLocaleDateString()}\n• Duration: ${proposedDuration}\n• Monthly Rent: NPR ${property.rent.toLocaleString()}\n• Security Deposit: NPR ${property.securityDeposit.toLocaleString()}`,
        messageType: 'system'
      });
    }

    const populated = await LeaseRequest.findById(leaseRequest._id)
      .populate('property', 'title images address rent securityDeposit')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone');

    // Emit notification
    const io = req.app.get('io');
    
    // Create persistent notification
    await notifyLeaseRequest(io, {
      hostId: property.host._id,
      tenantId: req.user._id,
      tenantName: req.user.name,
      propertyTitle: property.title,
      propertyId: property._id,
      leaseRequestId: leaseRequest._id
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Error creating lease request:', error);
    res.status(500).json({ success: false, message: 'Failed to create lease request' });
  }
});

// Host approves lease request
router.put('/:id/approve', protect, async (req, res) => {
  try {
    const { message } = req.body;
    
    const leaseRequest = await LeaseRequest.findById(req.params.id)
      .populate('property')
      .populate('tenant', 'name');

    if (!leaseRequest) {
      return res.status(404).json({ success: false, message: 'Lease request not found' });
    }

    // Verify host ownership
    if (leaseRequest.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can approve this request' });
    }

    if (leaseRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request has already been processed' });
    }

    // Update request status to approved (waiting for payment)
    leaseRequest.status = 'approved';
    leaseRequest.hostResponse = {
      message: message || 'Your lease request has been approved! Please pay the security deposit to confirm.',
      respondedAt: new Date()
    };
    await leaseRequest.save();

    // Send system message
    if (leaseRequest.conversation) {
      await Message.create({
        conversation: leaseRequest.conversation,
        sender: req.user._id,
        content: `✅ Lease Request Approved!\n\n${message || 'I have approved your lease request.'}\n\nPlease pay the security deposit of NPR ${leaseRequest.securityDeposit.toLocaleString()} to confirm your booking.`,
        messageType: 'system'
      });
    }

    const populated = await LeaseRequest.findById(leaseRequest._id)
      .populate('property', 'title images address rent securityDeposit')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone');

    // Create persistent notification
    const io = req.app.get('io');
    await notifyLeaseRequestResponse(io, {
      tenantId: leaseRequest.tenant._id,
      hostId: req.user._id,
      hostName: req.user.name,
      propertyTitle: leaseRequest.property.title,
      propertyId: leaseRequest.property._id,
      leaseRequestId: leaseRequest._id,
      approved: true
    });

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Error approving lease request:', error);
    res.status(500).json({ success: false, message: 'Failed to approve lease request' });
  }
});

// Host rejects lease request
router.put('/:id/reject', protect, async (req, res) => {
  try {
    const { message } = req.body;
    
    const leaseRequest = await LeaseRequest.findById(req.params.id)
      .populate('tenant', 'name');

    if (!leaseRequest) {
      return res.status(404).json({ success: false, message: 'Lease request not found' });
    }

    // Verify host ownership
    if (leaseRequest.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can reject this request' });
    }

    if (leaseRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request has already been processed' });
    }

    leaseRequest.status = 'rejected';
    leaseRequest.hostResponse = {
      message: message || 'Sorry, your lease request has been declined.',
      respondedAt: new Date()
    };
    await leaseRequest.save();

    // Send system message
    if (leaseRequest.conversation) {
      await Message.create({
        conversation: leaseRequest.conversation,
        sender: req.user._id,
        content: `❌ Lease Request Declined\n\n${message || 'Sorry, I am unable to accept your lease request at this time.'}`,
        messageType: 'system'
      });
    }

    const populated = await LeaseRequest.findById(leaseRequest._id)
      .populate('property', 'title images address rent securityDeposit')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone');

    // Create persistent notification
    const io = req.app.get('io');
    await notifyLeaseRequestResponse(io, {
      tenantId: leaseRequest.tenant._id,
      hostId: req.user._id,
      hostName: req.user.name,
      propertyTitle: populated.property.title,
      propertyId: populated.property._id,
      leaseRequestId: leaseRequest._id,
      approved: false
    });

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Error rejecting lease request:', error);
    res.status(500).json({ success: false, message: 'Failed to reject lease request' });
  }
});

// Tenant pays security deposit
router.post('/:id/pay-deposit', protect, async (req, res) => {
  try {
    const { paymentMethod, transactionId, paymentGatewayResponse } = req.body;
    
    const leaseRequest = await LeaseRequest.findById(req.params.id)
      .populate('property')
      .populate('host', 'name');

    if (!leaseRequest) {
      return res.status(404).json({ success: false, message: 'Lease request not found' });
    }

    // Verify tenant ownership
    if (leaseRequest.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the tenant can pay for this request' });
    }

    if (leaseRequest.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Lease request is not approved' });
    }

    // Create payment record
    const payment = await Payment.create({
      lease: null, // Will be linked after lease creation
      property: leaseRequest.property._id,
      payer: req.user._id,
      receiver: leaseRequest.host._id,
      amount: leaseRequest.securityDeposit,
      paymentType: 'security-deposit',
      paymentMethod,
      status: 'completed',
      transactionId,
      paymentGatewayResponse,
      paymentFor: {
        description: `Security deposit for ${leaseRequest.property.title}`
      },
      paidAt: new Date()
    });

    // Update lease request
    leaseRequest.securityDepositPayment = payment._id;
    leaseRequest.securityDepositPaid = true;
    leaseRequest.securityDepositPaidAt = new Date();
    leaseRequest.status = 'payment-pending'; // Admin/host can finalize
    await leaseRequest.save();

    // Calculate lease dates
    const startDate = new Date(leaseRequest.proposedMoveIn);
    let endDate = new Date(startDate);
    
    switch (leaseRequest.proposedDuration) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case '3-months':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case '6-months':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    // Create lease
    const lease = await Lease.create({
      property: leaseRequest.property._id,
      host: leaseRequest.host._id,
      tenant: req.user._id,
      startDate,
      endDate,
      monthlyRent: leaseRequest.monthlyRent,
      securityDeposit: leaseRequest.securityDeposit,
      status: 'pending', // Will be active after both sign
      payments: [payment._id]
    });

    // Update payment with lease ID
    payment.lease = lease._id;
    await payment.save();

    // Update lease request
    leaseRequest.lease = lease._id;
    leaseRequest.status = 'completed';
    await leaseRequest.save();

    console.log(`✅ Lease Request ${leaseRequest._id} status updated to 'completed'`);
    console.log(`✅ Security Deposit Paid: ${leaseRequest.securityDepositPaid}`);
    console.log(`✅ Lease Created: ${lease._id}`);

    // Update property status
    await Property.findByIdAndUpdate(leaseRequest.property._id, {
      status: 'rented',
      currentLease: lease._id
    });

    // Send system message
    if (leaseRequest.conversation) {
      await Message.create({
        conversation: leaseRequest.conversation,
        sender: req.user._id,
        content: `💰 Security Deposit Paid!\n\nI have paid the security deposit of NPR ${leaseRequest.securityDeposit.toLocaleString()}.\n\nTransaction ID: ${transactionId}\n\n🎉 Lease Created!\nMove-in Date: ${startDate.toLocaleDateString()}\nLease End: ${endDate.toLocaleDateString()}`,
        messageType: 'system'
      });
    }

    const populated = await LeaseRequest.findById(leaseRequest._id)
      .populate('property', 'title images address rent securityDeposit')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone')
      .populate('lease');

    console.log(`📋 Populated Response - Status: ${populated.status}, Paid: ${populated.securityDepositPaid}`);

    // Emit notification
    const io = req.app.get('io');
    if (io) {
      io.to(leaseRequest.host._id.toString()).emit('notification', {
        type: 'deposit-paid',
        message: `Security deposit received from ${req.user.name}!`,
        data: populated
      });
    }

    res.json({ 
      success: true, 
      data: populated,
      lease,
      payment,
      message: 'Security deposit paid successfully! Lease has been created.' 
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
});

// Cancel lease request
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const leaseRequest = await LeaseRequest.findById(req.params.id);

    if (!leaseRequest) {
      return res.status(404).json({ success: false, message: 'Lease request not found' });
    }

    // Verify user is tenant or host
    if (leaseRequest.tenant.toString() !== req.user._id.toString() &&
        leaseRequest.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!['pending', 'approved'].includes(leaseRequest.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this request' });
    }

    leaseRequest.status = 'cancelled';
    leaseRequest.cancelledBy = req.user._id;
    leaseRequest.cancellationReason = reason;
    leaseRequest.cancelledAt = new Date();
    await leaseRequest.save();

    // Send system message
    if (leaseRequest.conversation) {
      await Message.create({
        conversation: leaseRequest.conversation,
        sender: req.user._id,
        content: `🚫 Lease Request Cancelled\n\n${reason || 'The lease request has been cancelled.'}`,
        messageType: 'system'
      });
    }

    const populated = await LeaseRequest.findById(leaseRequest._id)
      .populate('property', 'title images address rent securityDeposit')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone');

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Error cancelling lease request:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel lease request' });
  }
});

export default router;
