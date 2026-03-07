import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import Payment from '../models/Payment.js';
import { notifyRentPayment } from '../utils/notifications.js';

// Get all payments for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'tenant') {
      // Tenants see payments they made
      query = { payer: req.user._id };
    } else if (req.user.role === 'host') {
      // Hosts see payments they received
      query = { receiver: req.user._id };
    } else if (req.user.role === 'admin') {
      // Admins see all payments
      query = {};
    }
    
    const payments = await Payment.find(query)
      .populate('property', 'title images address')
      .populate('payer', 'name email avatar')
      .populate('receiver', 'name email avatar')
      .populate('lease', 'startDate endDate monthlyRent')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

// Get single payment
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('property', 'title images address')
      .populate('payer', 'name email avatar')
      .populate('receiver', 'name email avatar')
      .populate('lease', 'startDate endDate monthlyRent');
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    res.json({ success: true, data: payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment' });
  }
});

// Create payment
router.post('/', protect, async (req, res) => {
  try {
    const payment = await Payment.create({
      ...req.body,
      payer: req.user._id
    });
    
    const populated = await Payment.findById(payment._id)
      .populate('property', 'title images address')
      .populate('payer', 'name email avatar')
      .populate('receiver', 'name email avatar');
    
    // Notify host about the payment
    if (populated.status === 'completed' && populated.receiver) {
      const io = req.app.get('io');
      await notifyRentPayment(io, {
        hostId: populated.receiver._id,
        tenantId: req.user._id,
        tenantName: req.user.name,
        amount: populated.amount,
        propertyTitle: populated.property?.title || 'Property',
        paymentId: payment._id,
        propertyId: populated.property?._id
      });
    }
    
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment' });
  }
});

// Verify Khalti payment
router.post('/khalti/verify', protect, async (req, res) => {
  try {
    const { token, amount } = req.body;
    
    if (!token || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and amount are required' 
      });
    }

    // Verify payment with Khalti API
    const khaltiResponse = await fetch('https://khalti.com/api/v2/payment/verify/', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token, amount: amount * 100 }) // Khalti expects amount in paisa
    });

    const khaltiData = await khaltiResponse.json();

    if (khaltiResponse.ok && khaltiData.idx) {
      // Payment verified successfully
      return res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        data: khaltiData
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed',
        error: khaltiData
      });
    }
  } catch (error) {
    console.error('Khalti verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to verify Khalti payment',
      error: error.message
    });
  }
});

// Verify eSewa payment
router.post('/esewa/verify', protect, async (req, res) => {
  try {
    const { oid, amt, refId } = req.body;
    
    if (!oid || !amt || !refId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID, amount, and reference ID are required' 
      });
    }

    // Verify payment with eSewa API
    const esewaVerifyUrl = `https://eSewa.com.np/epay/transrec`;
    const params = new URLSearchParams({
      amt: amt,
      rid: refId,
      pid: oid,
      scd: process.env.ESEWA_MERCHANT_ID
    });

    const esewaResponse = await fetch(`${esewaVerifyUrl}?${params}`, {
      method: 'GET'
    });

    const responseText = await esewaResponse.text();

    // eSewa returns XML or "Success" text
    if (responseText.includes('Success') || esewaResponse.ok) {
      return res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        data: { oid, amt, refId }
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed',
        error: responseText
      });
    }
  } catch (error) {
    console.error('eSewa verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to verify eSewa payment',
      error: error.message
    });
  }
});

export default router;
