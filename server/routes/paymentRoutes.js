import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import Payment from '../models/Payment.js';
import LeaseRequest from '../models/LeaseRequest.js';
import { notifyRentPayment } from '../utils/notifications.js';
import { generatePaymentReceipt } from '../utils/receiptGenerator.js';
import { 
  validateKhaltiConfig, 
  getKhaltiPublicConfig,
  initiateKhaltiPayment, 
  verifyKhaltiPayment 
} from '../utils/khalti.js';
import { 
  validateEsewaConfig, 
  getEsewaPublicConfig,
  initiateEsewaPayment, 
  verifyEsewaPayment 
} from '../utils/esewa.js';

// Get payment gateway config
router.get('/config', (req, res) => {
  res.json({ 
    success: true, 
    data: {
      khalti: getKhaltiPublicConfig(),
      esewa: getEsewaPublicConfig()
    }
  });
});

// Initiate eSewa payment (server-side signed payload)
router.post('/esewa/initiate', protect, async (req, res) => {
  try {
    const { amount, productIdentity, successUrl, failureUrl } = req.body;

    if (!amount || !productIdentity) {
      return res.status(400).json({
        success: false,
        message: 'Amount and product identity are required'
      });
    }

    const validation = validateEsewaConfig();
    if (!validation.valid) {
      return res.status(500).json({
        success: false,
        message: validation.message
      });
    }

    const finalSuccessUrl = successUrl || `${process.env.CLIENT_URL}/dashboard/pay-deposit/${productIdentity}/esewa-success`;
    const finalFailureUrl = failureUrl || `${process.env.CLIENT_URL}/dashboard/pay-deposit/${productIdentity}/esewa-failure`;

    const paymentData = await initiateEsewaPayment({
      amount,
      productIdentity,
      successUrl: finalSuccessUrl,
      failureUrl: finalFailureUrl
    });

    return res.json({
      success: true,
      message: 'eSewa payload generated successfully',
      data: paymentData
    });
  } catch (error) {
    console.error('eSewa initiation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate eSewa payment',
      error: error.message
    });
  }
});

// Initiate Khalti payment (server-side)
router.post('/khalti/initiate', protect, async (req, res) => {
  try {
    const { amount, productIdentity, productName, productUrl, returnUrl } = req.body;
    
    if (!amount || !productIdentity || !productName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount, product identity, and product name are required' 
      });
    }

    const validation = validateKhaltiConfig();
    if (!validation.valid) {
      return res.status(500).json({
        success: false,
        message: validation.message
      });
    }

    const finalReturnUrl = returnUrl || `${process.env.CLIENT_URL}/dashboard/pay-deposit/${productIdentity}`;

    const khaltiData = await initiateKhaltiPayment({
      amount,
      productIdentity,
      productName,
      productUrl,
      returnUrl: finalReturnUrl,
      customerInfo: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phoneNumber || '9800000000'
      }
    });

    console.log('✅ Khalti payment initiated, returning data:', khaltiData);

    return res.json({ 
      success: true, 
      message: 'Payment initiated successfully',
      data: khaltiData
    });
  } catch (error) {
    console.error('Khalti initiation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to initiate Khalti payment',
      error: error.message
    });
  }
});

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
    const { pidx, amount } = req.body;
    
    if (!pidx) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment index (pidx) is required' 
      });
    }

    const validation = validateKhaltiConfig();
    if (!validation.valid) {
      return res.status(500).json({
        success: false,
        message: validation.message
      });
    }

    const khaltiData = await verifyKhaltiPayment(pidx);

    console.log('Khalti verification result:', {
      verified: khaltiData.verified,
      status: khaltiData.status,
      full_response: khaltiData
    });

    if (khaltiData.verified) {
      console.log('✅ Payment verified - proceeding with lease creation');
      return res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        data: khaltiData
      });
    } else {
      // Payment not yet completed, but API call succeeded
      console.warn('⏳ Payment status is:', khaltiData.status);
      return res.status(202).json({ 
        success: false, 
        message: `Payment status: ${khaltiData.status}. Please wait for payment confirmation.`,
        status: khaltiData.status,
        data: khaltiData
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
    const { transaction_uuid, total_amount, product_code, transaction_code } = req.body;
    
    if (!transaction_uuid || !total_amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'transaction_uuid and total_amount are required'
      });
    }

    const validation = validateEsewaConfig();
    if (!validation.valid) {
      return res.status(500).json({
        success: false,
        message: validation.message
      });
    }

    const esewaData = await verifyEsewaPayment({
      transactionUuid: transaction_uuid,
      totalAmount: total_amount,
      productCode: product_code,
      transactionCode: transaction_code
    });

    if (esewaData.verified) {
      return res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        data: esewaData
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed',
        error: esewaData
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

// Download payment receipt
router.get('/:id/receipt', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('property', 'title images address')
      .populate('payer', 'name email avatar')
      .populate('receiver', 'name email avatar')
      .populate('lease', 'startDate endDate monthlyRent');
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Verify user has access to this payment
    if (req.user.role !== 'admin' && 
        payment.payer._id.toString() !== req.user._id.toString() &&
        payment.receiver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get lease request details for receipt
    const leaseRequest = await LeaseRequest.findOne({
      property: payment.property._id,
      $or: [
        { tenant: payment.payer._id },
        { host: payment.receiver._id }
      ]
    }).populate('property', 'title address');

    // Generate receipt HTML
    const receiptHtml = generatePaymentReceipt(payment, leaseRequest);

    // Set headers for download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="payment-receipt-${payment._id}.html"`);
    res.send(receiptHtml);
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to generate receipt' });
  }
});

export default router;
