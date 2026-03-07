import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import Maintenance from '../models/Maintenance.js';
import Property from '../models/Property.js';
import Lease from '../models/Lease.js';
import { notifyMaintenanceRequest, notifyMaintenanceResolved, notifyMaintenanceUpdate } from '../utils/notifications.js';

// Get all maintenance requests for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'tenant') {
      // Tenants see requests they reported
      query = { reportedBy: req.user._id };
    } else if (req.user.role === 'host') {
      // Hosts see requests for their properties
      const hostProperties = await Property.find({ host: req.user._id }).select('_id');
      const propertyIds = hostProperties.map(p => p._id);
      query = { property: { $in: propertyIds } };
    } else if (req.user.role === 'admin') {
      // Admins see all requests
      query = {};
    }
    
    const requests = await Maintenance.find(query)
      .populate('property', 'title images address')
      .populate('reportedBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch maintenance requests' });
  }
});

// Create maintenance request
router.post('/', protect, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, category, priority, property } = req.body;
    
    // Verify the user has access to this property (tenant with active lease)
    const lease = await Lease.findOne({
      property: property,
      tenant: req.user._id,
      status: 'active'
    });
    
    if (!lease && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only submit maintenance requests for properties you are renting' 
      });
    }
    
    // Handle uploaded images
    const images = req.files ? req.files.map(file => ({
      url: file.path,
      public_id: file.filename
    })) : [];
    
    const maintenance = await Maintenance.create({
      property,
      lease: lease?._id,
      reportedBy: req.user._id,
      title,
      description,
      category,
      priority,
      images
    });
    
    const populated = await Maintenance.findById(maintenance._id)
      .populate('property', 'title images address')
      .populate('reportedBy', 'name email avatar');
    
    // Get property host and notify them
    const propertyData = await Property.findById(property).populate('host', 'name');
    if (propertyData?.host) {
      const io = req.app.get('io');
      await notifyMaintenanceRequest(io, {
        hostId: propertyData.host._id,
        tenantId: req.user._id,
        tenantName: req.user.name,
        title,
        propertyTitle: propertyData.title,
        maintenanceId: maintenance._id,
        propertyId: property,
        priority
      });
    }
    
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({ success: false, message: 'Failed to create maintenance request' });
  }
});

// Get single maintenance request
router.get('/:id', protect, async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('property', 'title images address')
      .populate('reportedBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar');
    
    if (!maintenance) {
      return res.status(404).json({ success: false, message: 'Maintenance request not found' });
    }
    
    res.json({ success: true, data: maintenance });
  } catch (error) {
    console.error('Error fetching maintenance request:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch maintenance request' });
  }
});

// Update maintenance request (for hosts to update status)
router.put('/:id', protect, upload.array('resolutionImages', 5), async (req, res) => {
  try {
    const { status, assignedTo, resolutionNotes, notes, estimatedCost, actualCost } = req.body;
    
    const maintenance = await Maintenance.findById(req.params.id);
    
    if (!maintenance) {
      return res.status(404).json({ success: false, message: 'Maintenance request not found' });
    }
    
    // Update fields
    if (status) {
      maintenance.status = status;
      if (status === 'in-progress' && !maintenance.startedAt) {
        maintenance.startedAt = new Date();
      }
      if (status === 'resolved') {
        maintenance.resolvedAt = new Date();
      }
    }
    if (assignedTo) maintenance.assignedTo = assignedTo;
    if (resolutionNotes) maintenance.resolutionNotes = resolutionNotes;
    if (notes) maintenance.notes = notes;
    if (estimatedCost) maintenance.estimatedCost = estimatedCost;
    if (actualCost) maintenance.actualCost = actualCost;
    
    // Handle resolution images
    if (req.files && req.files.length > 0) {
      const resolutionImages = req.files.map(file => ({
        url: file.path,
        public_id: file.filename
      }));
      maintenance.resolutionImages = [...(maintenance.resolutionImages || []), ...resolutionImages];
    }
    
    await maintenance.save();
    
    const updated = await Maintenance.findById(maintenance._id)
      .populate('property', 'title images address')
      .populate('reportedBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar');
    
    // Notify the tenant about the status update
    const io = req.app.get('io');
    if (status === 'resolved') {
      await notifyMaintenanceResolved(io, {
        tenantId: updated.reportedBy._id,
        hostId: req.user._id,
        hostName: req.user.name,
        title: updated.title,
        propertyTitle: updated.property.title,
        maintenanceId: maintenance._id,
        propertyId: updated.property._id
      });
    } else if (status) {
      await notifyMaintenanceUpdate(io, {
        tenantId: updated.reportedBy._id,
        hostId: req.user._id,
        hostName: req.user.name,
        title: updated.title,
        status,
        propertyTitle: updated.property.title,
        maintenanceId: maintenance._id,
        propertyId: updated.property._id
      });
    }
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    res.status(500).json({ success: false, message: 'Failed to update maintenance request' });
  }
});

router.get('/property/:propertyId', protect, async (req, res) => {
  try {
    const requests = await Maintenance.find({ property: req.params.propertyId })
      .populate('reportedBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch maintenance requests' });
  }
});

export default router;
