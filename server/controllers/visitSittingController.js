import VisitSitting from '../models/VisitSitting.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import { notifyHostVisitRequest, notifyTenantVisitApproval } from '../utils/notifications.js';

// Helper function to populate visit sitting with related data
const populateVisitSitting = async (visitSitting, type = 'full') => {
  let populateConfig;
  
  switch (type) {
    case 'full':
      populateConfig = [
        { path: 'property', select: 'title images address rent' },
        { path: 'host', select: 'name email avatar phone' },
        { path: 'tenant', select: 'name email avatar phone' }
      ];
      break;
    case 'host-list':
      populateConfig = [
        { path: 'property', select: 'title images address' },
        { path: 'tenant', select: 'name email avatar phone' }
      ];
      break;
    case 'tenant-list':
      populateConfig = [
        { path: 'property', select: 'title images address rent host' },
        { path: 'host', select: 'name email avatar phone' }
      ];
      break;
    default:
      populateConfig = [
        { path: 'property', select: 'title images address' },
        { path: 'host', select: 'name email avatar' },
        { path: 'tenant', select: 'name email avatar phone' }
      ];
  }
  
  return await visitSitting.populate(populateConfig);
};

// @desc    Create a visit sitting request
// @route   POST /api/visit-sittings
// @access  Private (Tenant)
export const createVisitSitting = async (req, res, next) => {
  try {
    const { propertyId, visitDate, visitTime, message } = req.body;
    const tenantId = req.user._id;

    // Validate inputs
    if (!propertyId || !visitDate || !visitTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide property ID, visit date, and visit time'
      });
    }

    // Only tenants can book visits
    if (req.user.role !== 'tenant') {
      return res.status(403).json({
        success: false,
        message: 'Only tenants can book visits'
      });
    }

    // Get property and verify it exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Cannot book visit for own property
    if (property.host.toString() === tenantId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book a visit for your own property'
      });
    }

    // Parse and validate visit date
    const visitDateObj = new Date(visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if date is in the past
    if (visitDateObj < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book visits for past dates'
      });
    }

    // Check if date is more than 3 weeks (21 days) in the future
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 21);
    if (visitDateObj > maxDate) {
      return res.status(400).json({
        success: false,
        message: 'You can only book visits up to 3 weeks in advance'
      });
    }

    // Check if tenant already has a booking for this date
    const existingBooking = await VisitSitting.findOne({
      tenant: tenantId,
      visitDate: {
        $gte: new Date(visitDateObj.getFullYear(), visitDateObj.getMonth(), visitDateObj.getDate()),
        $lt: new Date(visitDateObj.getFullYear(), visitDateObj.getMonth(), visitDateObj.getDate() + 1)
      },
      status: { $in: ['pending', 'approved'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have a booking for this date. Please choose another date.'
      });
    }

    // Check if this property already has a booking for this date (pending or approved)
    const propertyBooking = await VisitSitting.findOne({
      property: propertyId,
      visitDate: {
        $gte: new Date(visitDateObj.getFullYear(), visitDateObj.getMonth(), visitDateObj.getDate()),
        $lt: new Date(visitDateObj.getFullYear(), visitDateObj.getMonth(), visitDateObj.getDate() + 1)
      },
      status: { $in: ['pending', 'approved'] }
    });

    if (propertyBooking) {
      return res.status(400).json({
        success: false,
        message: 'This date is already booked for this property. Please choose another date.'
      });
    }

    // Create visit sitting
    const visitSitting = await VisitSitting.create({
      property: propertyId,
      host: property.host,
      tenant: tenantId,
      visitDate: visitDateObj,
      visitTime,
      message
    });

    // Populate before sending response
    await populateVisitSitting(visitSitting, 'full');

    // Notify host about visit request
    try {
      const io = req.app.get('io');
      await notifyHostVisitRequest(io, {
        hostId: property.host,
        tenantName: req.user.name,
        propertyTitle: property.title,
        visitDate: visitDateObj,
        visitTime,
        visitSittingId: visitSitting._id
      });
    } catch (notifError) {
      console.error('Failed to notify host:', notifError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Visit sitting request created successfully',
      data: visitSitting
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available dates for a property
// @route   GET /api/visit-sittings/property/:propertyId/available-dates
// @access  Public
export const getAvailableDates = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { month, year } = req.query;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Get start and end of requested month
    const startDate = new Date(year || new Date().getFullYear(), month || new Date().getMonth(), 1);
    const endDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) + 1, 0);

    // Get all approved and pending bookings for this property in the month
    const bookedDates = await VisitSitting.find({
      property: propertyId,
      status: { $in: ['pending', 'approved'] },
      visitDate: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // Extract booked dates
    const bookedDateSet = new Set();
    bookedDates.forEach(booking => {
      const date = new Date(booking.visitDate);
      bookedDateSet.add(date.toISOString().split('T')[0]);
    });

    // Generate all dates in month
    const allDates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= endDate.getDate(); i++) {
      const date = new Date(year || new Date().getFullYear(), month || new Date().getMonth(), i);
      const dateString = date.toISOString().split('T')[0];

      // Only include future dates
      if (date >= today) {
        allDates.push({
          date: dateString,
          isAvailable: !bookedDateSet.has(dateString)
        });
      }
    }

    res.json({
      success: true,
      data: allDates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get visit sitting requests for host
// @route   GET /api/visit-sittings/host/requests
// @access  Private (Host)
export const getHostVisitRequests = async (req, res, next) => {
  try {
    if (req.user.role !== 'host' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only hosts can view visit requests'
      });
    }

    const { status, propertyId } = req.query;
    let query = { host: req.user._id };

    if (status) {
      query.status = status;
    }

    if (propertyId) {
      query.property = propertyId;
    }

    const requests = await VisitSitting.find(query)
      .populate('property', 'title images address')
      .populate('tenant', 'name email avatar phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get visit sitting requests for tenant
// @route   GET /api/visit-sittings/tenant/requests
// @access  Private (Tenant)
export const getTenantVisitRequests = async (req, res, next) => {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({
        success: false,
        message: 'Only tenants can view their visit requests'
      });
    }

    const { status } = req.query;
    let query = { tenant: req.user._id };

    if (status) {
      query.status = status;
    }

    const requests = await VisitSitting.find(query)
      .populate('property', 'title images address rent host')
      .populate('host', 'name email avatar phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve visit sitting request
// @route   PUT /api/visit-sittings/:id/approve
// @access  Private (Host)
export const approveVisitSitting = async (req, res, next) => {
  try {
    let visitSitting = await VisitSitting.findById(req.params.id);

    if (!visitSitting) {
      return res.status(404).json({
        success: false,
        message: 'Visit sitting not found'
      });
    }

    // Authorization: only host can approve
    if (visitSitting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this visit sitting'
      });
    }

    if (visitSitting.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending visit sittings can be approved'
      });
    }

    // Check if another visit is already approved for this date
    const existingApproved = await VisitSitting.findOne({
      property: visitSitting.property,
      visitDate: {
        $gte: new Date(visitSitting.visitDate.getFullYear(), visitSitting.visitDate.getMonth(), visitSitting.visitDate.getDate()),
        $lt: new Date(visitSitting.visitDate.getFullYear(), visitSitting.visitDate.getMonth(), visitSitting.visitDate.getDate() + 1)
      },
      status: 'approved',
      _id: { $ne: visitSitting._id }
    });

    if (existingApproved) {
      return res.status(400).json({
        success: false,
        message: 'Another visit is already approved for this date'
      });
    }

    visitSitting.status = 'approved';
    visitSitting.approvedAt = new Date();
    await visitSitting.save();

    // Populate before sending response
    await populateVisitSitting(visitSitting);

    // Notify tenant about approval
    try {
      const io = req.app.get('io');
      await notifyTenantVisitApproval(io, {
        tenantId: visitSitting.tenant._id,
        hostName: req.user.name,
        propertyTitle: visitSitting.property.title,
        visitDate: visitSitting.visitDate,
        visitTime: visitSitting.visitTime
      });
    } catch (notifError) {
      console.error('Failed to notify tenant:', notifError.message);
    }

    res.json({
      success: true,
      message: 'Visit sitting approved successfully',
      data: visitSitting
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject visit sitting request
// @route   PUT /api/visit-sittings/:id/reject
// @access  Private (Host)
export const rejectVisitSitting = async (req, res, next) => {
  try {
    const { reason } = req.body;

    let visitSitting = await VisitSitting.findById(req.params.id);

    if (!visitSitting) {
      return res.status(404).json({
        success: false,
        message: 'Visit sitting not found'
      });
    }

    // Authorization: only host can reject
    if (visitSitting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this visit sitting'
      });
    }

    if (visitSitting.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending visit sittings can be rejected'
      });
    }

    visitSitting.status = 'rejected';
    visitSitting.rejectedAt = new Date();
    visitSitting.rejectionReason = reason || 'No reason provided';
    await visitSitting.save();

    // Populate before sending response
    await populateVisitSitting(visitSitting);

    res.json({
      success: true,
      message: 'Visit sitting rejected successfully',
      data: visitSitting
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel visit sitting request
// @route   PUT /api/visit-sittings/:id/cancel
// @access  Private (Tenant)
export const cancelVisitSitting = async (req, res, next) => {
  try {
    let visitSitting = await VisitSitting.findById(req.params.id);

    if (!visitSitting) {
      return res.status(404).json({
        success: false,
        message: 'Visit sitting not found'
      });
    }

    // Authorization: only tenant can cancel their own requests
    if (visitSitting.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this visit sitting'
      });
    }

    if (visitSitting.status === 'completed' || visitSitting.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed or already cancelled visit sitting'
      });
    }

    visitSitting.status = 'cancelled';
    await visitSitting.save();

    // Populate before sending response
    await populateVisitSitting(visitSitting);

    res.json({
      success: true,
      message: 'Visit sitting cancelled successfully',
      data: visitSitting
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single visit sitting
// @route   GET /api/visit-sittings/:id
// @access  Private
export const getVisitSitting = async (req, res, next) => {
  try {
    const visitSitting = await VisitSitting.findById(req.params.id)
      .populate('property', 'title images address rent')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone');

    if (!visitSitting) {
      return res.status(404).json({
        success: false,
        message: 'Visit sitting not found'
      });
    }

    res.json({
      success: true,
      data: visitSitting
    });
  } catch (error) {
    next(error);
  }
};
