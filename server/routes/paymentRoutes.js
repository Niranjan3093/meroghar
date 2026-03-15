import express from 'express';
import crypto from 'crypto';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import Payment from '../models/Payment.js';
import LeaseRequest from '../models/LeaseRequest.js';
import { notifyRentPayment } from '../utils/notifications.js';
import { generatePaymentReceipt } from '../utils/receiptGenerator.js';

const ESEWA_BASE_URL = process.env.ESEWA_BASE_URL || 'https://epay.esewa.com.np';
const ESEWA_FORM_URL = process.env.ESEWA_FORM_URL || `${ESEWA_BASE_URL}/api/epay/main/v2/form`;
const ESEWA_STATUS_URL = process.env.ESEWA_STATUS_URL || `${ESEWA_BASE_URL}/api/epay/transaction/status/`;

// Get payment gateway config
router.get('/config', (req, res) => {
  res.json({ 
    success: true, 
    data: {
      khalti: {
        enabled: !!process.env.KHALTI_SECRET_KEY
      },
      esewa: {
        merchantId: process.env.ESEWA_MERCHANT_ID || process.env.ESEWA_PRODUCT_CODE || '',
        enabled: !!(process.env.ESEWA_SECRET_KEY && (process.env.ESEWA_MERCHANT_ID || process.env.ESEWA_PRODUCT_CODE))
      }
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

    const productCode = process.env.ESEWA_PRODUCT_CODE || process.env.ESEWA_MERCHANT_ID;
    const secretKey = process.env.ESEWA_SECRET_KEY;

    if (!productCode || !secretKey) {
      return res.status(500).json({
        success: false,
        message: 'eSewa is not configured on server'
      });
    }

    const totalAmount = Number(amount);
    const transactionUuid = `LEASE-${productIdentity}-${Date.now()}`;
    const finalSuccessUrl = successUrl || `${process.env.CLIENT_URL}/dashboard/pay-deposit/${productIdentity}/esewa-success`;
    const finalFailureUrl = failureUrl || `${process.env.CLIENT_URL}/dashboard/pay-deposit/${productIdentity}/esewa-failure`;
    const signedFieldNames = 'total_amount,transaction_uuid,product_code';
    const messageToSign = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(messageToSign)
      .digest('base64');

    return res.json({
      success: true,
      message: 'eSewa payload generated successfully',
      data: {
        url: ESEWA_FORM_URL,
        fields: {
          amount: totalAmount,
          tax_amount: 0,
          total_amount: totalAmount,
          transaction_uuid: transactionUuid,
          product_code: productCode,
          product_service_charge: 0,
          product_delivery_charge: 0,
          success_url: finalSuccessUrl,
          failure_url: finalFailureUrl,
          signed_field_names: signedFieldNames,
          signature
        }
      }
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

    // Use provided return URL or fall back to CLIENT_URL
    const finalReturnUrl = returnUrl || `${process.env.CLIENT_URL}/dashboard/pay-deposit/${productIdentity}`;

    console.log(`🔗 Khalti Payment Initiation:`);
    console.log(`   - Amount: NPR ${amount}`);
    console.log(`   - Product ID: ${productIdentity}`);
    console.log(`   - Return URL: ${finalReturnUrl}`);

    // Initiate payment with Khalti API
    const khaltiResponse = await fetch(process.env.KHALTI_INIT_URL || 'https://dev.khalti.com/api/v2/epayment/initiate/', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        return_url: finalReturnUrl,
        website_url: productUrl || process.env.CLIENT_URL || 'http://localhost:3000',
        amount: amount * 100, // Convert to paisa
        purchase_order_id: productIdentity,
        purchase_order_name: productName,
        customer_info: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phoneNumber || '9800000000'
        }
      })
    });

    const khaltiData = await khaltiResponse.json();

    if (khaltiResponse.ok && khaltiData.payment_url) {
      // Payment initiated successfully
      return res.json({ 
        success: true, 
        message: 'Payment initiated successfully',
        data: khaltiData
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment initiation failed',
        error: khaltiData
      });
    }
  } catch (error) {
    console.error('Khalti initiation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to initiate Khalti payment',
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

    // Verify payment with Khalti API
    const khaltiResponse = await fetch(process.env.KHALTI_VERIFY_URL || 'https://dev.khalti.com/api/v2/epayment/lookup/', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pidx })
    });

    const khaltiData = await khaltiResponse.json();

    if (khaltiResponse.ok && khaltiData.status === 'Completed') {
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
    const { transaction_uuid, total_amount, product_code, transaction_code } = req.body;
    
    if (!transaction_uuid || !total_amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'transaction_uuid and total_amount are required'
      });
    }

    const configuredProductCode = process.env.ESEWA_PRODUCT_CODE || process.env.ESEWA_MERCHANT_ID;
    if (!configuredProductCode || !process.env.ESEWA_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'eSewa is not configured on server'
      });
    }

    if (product_code && product_code !== configuredProductCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product code'
      });
    }

    // Verify payment with eSewa status API
    const params = new URLSearchParams({
      product_code: configuredProductCode,
      total_amount: String(total_amount),
      transaction_uuid: String(transaction_uuid)
    });

    const esewaResponse = await fetch(`${ESEWA_STATUS_URL}?${params}`, {
      method: 'GET'
    });

    const responseData = await esewaResponse.json();

    if (esewaResponse.ok && responseData.status === 'COMPLETE') {
      if (transaction_code && responseData.transaction_code && responseData.transaction_code !== transaction_code) {
        return res.status(400).json({
          success: false,
          message: 'Transaction code mismatch',
          error: responseData
        });
      }

      return res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        data: responseData
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed',
        error: responseData
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
