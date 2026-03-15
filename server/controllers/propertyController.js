import Property from '../models/Property.js';
import { notifyPendingProperty } from '../utils/notifications.js';

const isValidLatitude = (value) => Number.isFinite(value) && value >= -90 && value <= 90;
const isValidLongitude = (value) => Number.isFinite(value) && value >= -180 && value <= 180;

const parseLocationFromBody = (body) => {
  if (body?.location?.coordinates && Array.isArray(body.location.coordinates)) {
    const [longitude, latitude] = body.location.coordinates.map((value) => Number(value));
    if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
      return {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }
    return null;
  }

  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
    return {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
  }

  return null;
};

// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
export const getProperties = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Only show verified and active properties to public/tenants
    const query = { 
      status: 'active',
      verificationStatus: 'verified'
    };

    // Filter by property type
    if (req.query.propertyType) {
      query.propertyType = req.query.propertyType;
    }

    // Filter by price range
    if (req.query.minRent || req.query.maxRent) {
      query.rent = {};
      if (req.query.minRent) query.rent.$gte = parseInt(req.query.minRent);
      if (req.query.maxRent) query.rent.$lte = parseInt(req.query.maxRent);
    }

    // Filter by city
    if (req.query.city) {
      query['address.city'] = new RegExp(req.query.city, 'i');
    }

    // Filter by amenities
    if (req.query.amenities) {
      const amenities = req.query.amenities.split(',');
      query.amenities = { $all: amenities };
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

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
export const getProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('host', 'name email phone avatar rating numReviews')
      .populate('currentLease');

    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    // Increment views
    property.views += 1;
    await property.save();

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create property
// @route   POST /api/properties
// @access  Private/Host
export const createProperty = async (req, res, next) => {
  try {
    req.body.host = req.user.id;

    const parsedLocation = parseLocationFromBody(req.body);
    if (!parsedLocation) {
      res.status(400);
      throw new Error('Please mark the property location on the map');
    }
    req.body.location = parsedLocation;

    const property = await Property.create(req.body);

    // Add property to host's properties array
    req.user.properties.push(property._id);
    await req.user.save();

    // Notify admins about new property for approval
    try {
      const io = req.app.get('io');
      await notifyPendingProperty(io, {
        hostId: req.user._id,
        hostName: req.user.name,
        propertyTitle: property.title,
        propertyId: property._id
      });
    } catch (notifError) {
      console.error('Failed to notify admins:', notifError.message);
    }

    res.status(201).json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private/Host
export const updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    // Check ownership
    if (property.host.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update this property');
    }

    // Only allow editing if property is pending or rejected (not yet approved)
    if (req.user.role !== 'admin') {
      if (property.verificationStatus === 'verified') {
        res.status(400);
        throw new Error('Cannot edit an approved property');
      }

      // If rejected, check edit count (max 3 resubmissions)
      if (property.verificationStatus === 'rejected') {
        if (property.rejectionEditCount >= 3) {
          res.status(400);
          throw new Error('You have reached the maximum number of resubmissions (3) for this property');
        }
        // Resubmit for review: reset status back to pending and increment edit count
        req.body.verificationStatus = 'pending';
        req.body.status = 'pending';
        req.body.rejectionEditCount = (property.rejectionEditCount || 0) + 1;
        req.body.rejectionReason = null;
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'location') ||
        Object.prototype.hasOwnProperty.call(req.body, 'latitude') ||
        Object.prototype.hasOwnProperty.call(req.body, 'longitude')) {
      const parsedLocation = parseLocationFromBody(req.body);
      if (!parsedLocation) {
        res.status(400);
        throw new Error('Property location is required and cannot be removed');
      }
      req.body.location = parsedLocation;
      delete req.body.latitude;
      delete req.body.longitude;
    }

    property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Notify admins about resubmitted property
    if (req.body.verificationStatus === 'pending' && req.user.role !== 'admin') {
      try {
        const io = req.app.get('io');
        await notifyPendingProperty(io, {
          hostId: req.user._id,
          hostName: req.user.name,
          propertyTitle: property.title,
          propertyId: property._id
        });
      } catch (notifError) {
        console.error('Failed to notify admins:', notifError.message);
      }
    }

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private/Host
export const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    // Check ownership
    if (property.host.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this property');
    }

    await property.deleteOne();

    res.json({
      success: true,
      message: 'Property removed'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload property images
// @route   POST /api/properties/:id/images
// @access  Private/Host
export const uploadPropertyImages = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    // Check ownership
    if (property.host.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized');
    }

    // req.files contains uploaded images (handled by multer/cloudinary)
    const images = req.files.map(file => ({
      url: file.path,
      public_id: file.filename
    }));

    property.images.push(...images);
    await property.save();

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get properties nearby
// @route   GET /api/properties/nearby
// @access  Public
export const getPropertiesNearby = async (req, res, next) => {
  try {
    const { lng, lat, radius = 10 } = req.query;

    if (!lng || !lat) {
      res.status(400);
      throw new Error('Please provide longitude and latitude');
    }

    const properties = await Property.getPropertiesInRadius(
      [parseFloat(lng), parseFloat(lat)],
      parseFloat(radius)
    );

    res.json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search properties
// @route   GET /api/properties/search
// @access  Public
export const searchProperties = async (req, res, next) => {
  try {
    const { q } = req.query;

    const properties = await Property.find({
      $or: [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { 'address.city': new RegExp(q, 'i') },
        { 'address.state': new RegExp(q, 'i') }
      ],
      status: 'active'
    }).populate('host', 'name avatar rating');

    res.json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get host's own properties (all statuses)
// @route   GET /api/properties/host/my-properties
// @access  Private/Host
export const getHostProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ 
      host: req.user.id 
    })
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
