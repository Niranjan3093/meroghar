import Property from '../models/Property.js';
import User from '../models/User.js';
import Lease from '../models/Lease.js';
import { notifyPropertyApproved, notifyPropertyRejected, sendAdminWarning } from '../utils/notifications.js';

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    // Get user counts by role
    const totalUsers = await User.countDocuments();
    const hostCount = await User.countDocuments({ role: 'host' });
    const tenantCount = await User.countDocuments({ role: 'tenant' });
    const adminCount = await User.countDocuments({ role: 'admin' });

    // Get property statistics
    const totalProperties = await Property.countDocuments();
    const pendingProperties = await Property.countDocuments({ 
      verificationStatus: 'pending' 
    });
    const activeProperties = await Property.countDocuments({ 
      status: 'active', 
      verificationStatus: 'verified' 
    });
    const rejectedProperties = await Property.countDocuments({ 
      status: 'rejected' 
    });

    // Get lease statistics
    const activeLeases = await Lease.countDocuments({ 
      status: 'active' 
    });
    const expiredLeases = await Lease.countDocuments({ 
      status: 'expired' 
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          hosts: hostCount,
          tenants: tenantCount,
          admins: adminCount
        },
        properties: {
          total: totalProperties,
          pending: pendingProperties,
          active: activeProperties,
          rejected: rejectedProperties
        },
        leases: {
          active: activeLeases,
          expired: expiredLeases
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending properties for verification
// @route   GET /api/admin/properties/pending
// @access  Private/Admin
export const getPendingProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ 
      verificationStatus: 'pending' 
    })
      .populate('host', 'name email phone avatar rating')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve property
// @route   PUT /api/admin/properties/:id/approve
// @access  Private/Admin
export const approveProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    if (property.verificationStatus !== 'pending') {
      res.status(400);
      throw new Error('Property is not in pending status');
    }

    property.verificationStatus = 'verified';
    property.status = 'active';
    await property.save();

    // Notify the host
    const io = req.app.get('io');
    await notifyPropertyApproved(io, {
      hostId: property.host,
      propertyTitle: property.title,
      propertyId: property._id
    });

    res.json({
      success: true,
      message: 'Property approved successfully',
      data: property
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject property
// @route   PUT /api/admin/properties/:id/reject
// @access  Private/Admin
export const rejectProperty = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      res.status(400);
      throw new Error('Please provide a rejection reason');
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    if (property.verificationStatus !== 'pending') {
      res.status(400);
      throw new Error('Property is not in pending status');
    }

    property.verificationStatus = 'rejected';
    property.status = 'rejected';
    property.rejectionReason = reason;
    await property.save();

    // Notify the host
    const io = req.app.get('io');
    await notifyPropertyRejected(io, {
      hostId: property.host,
      propertyTitle: property.title,
      propertyId: property._id,
      reason
    });

    res.json({
      success: true,
      message: 'Property rejected',
      data: property
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with optional filters
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Filter by banned status
    if (req.query.isBanned !== undefined) {
      query.isBanned = req.query.isBanned === 'true';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ban a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
export const banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      res.status(400);
      throw new Error('Please provide a ban reason');
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      res.status(403);
      throw new Error('Cannot ban an admin user');
    }

    if (user.isBanned) {
      res.status(400);
      throw new Error('User is already banned');
    }

    user.isBanned = true;
    user.banReason = reason;
    user.isActive = false;
    await user.save();

    // Send warning notification to the user
    const io = req.app.get('io');
    await sendAdminWarning(io, {
      userId: user._id,
      adminId: req.user._id,
      title: 'Account Banned',
      message: `Your account has been banned. Reason: ${reason}`
    });

    res.json({
      success: true,
      message: 'User banned successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unban a user
// @route   PUT /api/admin/users/:id/unban
// @access  Private/Admin
export const unbanUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!user.isBanned) {
      res.status(400);
      throw new Error('User is not banned');
    }

    user.isBanned = false;
    user.banReason = null;
    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'User unbanned successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all properties (admin view - all statuses)
// @route   GET /api/admin/properties
// @access  Private/Admin
export const getAllProperties = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by verification status
    if (req.query.verificationStatus) {
      query.verificationStatus = req.query.verificationStatus;
    }

    const properties = await Property.find(query)
      .populate('host', 'name email avatar rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Property.countDocuments(query);

    res.json({
      success: true,
      data: properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user details with properties and leases
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('properties');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Get user's active leases (as host or tenant)
    const activeLeases = await Lease.find({
      $or: [{ host: user._id }, { tenant: user._id }],
      status: { $in: ['active', 'pending'] }
    })
      .populate('property', 'title images address')
      .populate('host', 'name email avatar')
      .populate('tenant', 'name email avatar');

    // Get user's properties if they are a host
    let properties = [];
    if (user.role === 'host') {
      properties = await Property.find({ host: user._id })
        .select('title images address status verificationStatus monthlyRent createdAt');
    }

    res.json({
      success: true,
      data: {
        user,
        properties,
        leases: activeLeases
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single property details
// @route   GET /api/admin/properties/:id
// @access  Private/Admin
export const getPropertyDetails = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('host', 'name email phone avatar rating createdAt');

    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    // Get active leases for this property
    const leases = await Lease.find({ property: property._id })
      .populate('tenant', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        property,
        leases
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all leases (admin view)
// @route   GET /api/admin/leases
// @access  Private/Admin
export const getAllLeases = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const leases = await Lease.find(query)
      .populate('property', 'title images address')
      .populate('host', 'name email avatar')
      .populate('tenant', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Lease.countDocuments(query);

    res.json({
      success: true,
      data: leases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};