/**
 * eSewa Payment Gateway Utility
 * Handles all eSewa-related API calls and configurations
 */

import crypto from 'crypto';

const ESEWA_CONFIG = {
  merchantId: process.env.ESEWA_MERCHANT_ID,
  productCode: process.env.ESEWA_PRODUCT_CODE,
  secretKey: process.env.ESEWA_SECRET_KEY,
  baseUrl: process.env.ESEWA_BASE_URL || 'https://rc-epay.esewa.com.np',
  formUrl: process.env.ESEWA_FORM_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  statusUrl: process.env.ESEWA_STATUS_URL || 'https://rc-epay.esewa.com.np/api/epay/transaction/status/'
};

/**
 * Validate eSewa configuration
 * @returns {Object} { valid: boolean, message: string }
 */
export const validateEsewaConfig = () => {
  if (!ESEWA_CONFIG.secretKey) {
    return { valid: false, message: 'ESEWA_SECRET_KEY is not configured' };
  }
  if (!ESEWA_CONFIG.productCode && !ESEWA_CONFIG.merchantId) {
    return { valid: false, message: 'ESEWA_PRODUCT_CODE or ESEWA_MERCHANT_ID must be configured' };
  }
  return { valid: true, message: 'eSewa configuration is valid' };
};

/**
 * Get eSewa configuration for frontend
 * @returns {Object} Public configuration that can be sent to frontend
 */
export const getEsewaPublicConfig = () => {
  return {
    merchantId: ESEWA_CONFIG.merchantId,
    productCode: ESEWA_CONFIG.productCode,
    enabled: !!ESEWA_CONFIG.secretKey && !!(ESEWA_CONFIG.productCode || ESEWA_CONFIG.merchantId),
    environment: process.env.NODE_ENV === 'production' ? 'live' : 'test'
  };
};

/**
 * Generate HMAC SHA256 signature for eSewa
 * @param {string} messageToSign - Message to sign
 * @returns {string} Base64 encoded signature
 */
export const generateEsewaSignature = (messageToSign) => {
  return crypto
    .createHmac('sha256', ESEWA_CONFIG.secretKey)
    .update(messageToSign)
    .digest('base64');
};

/**
 * Initiate eSewa payment
 * @param {Object} paymentData - Payment details
 * @param {number} paymentData.amount - Amount in NPR
 * @param {string} paymentData.productIdentity - Unique product/order ID
 * @param {string} paymentData.successUrl - Success callback URL
 * @param {string} paymentData.failureUrl - Failure callback URL
 * @returns {Promise<Object>} Payment form and signature
 */
export const initiateEsewaPayment = async (paymentData) => {
  const validation = validateEsewaConfig();
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const {
    amount,
    productIdentity,
    successUrl,
    failureUrl
  } = paymentData;

  // Validate required fields
  if (!amount) throw new Error('Amount is required');
  if (!productIdentity) throw new Error('Product identity is required');
  if (!successUrl) throw new Error('Success URL is required');

  try {
    const totalAmount = Number(amount);
    const transactionUuid = `LEASE-${productIdentity}-${Date.now()}`;
    const productCode = ESEWA_CONFIG.productCode || ESEWA_CONFIG.merchantId;

    console.log('🔗 eSewa Payment Initiation:');
    console.log(`   - Amount: NPR ${totalAmount}`);
    console.log(`   - Product ID: ${productIdentity}`);
    console.log(`   - Transaction UUID: ${transactionUuid}`);

    // Create message to sign
    const signedFieldNames = 'total_amount,transaction_uuid,product_code';
    const messageToSign = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;

    // Generate signature
    const signature = generateEsewaSignature(messageToSign);

    console.log('✅ eSewa signature generated');

    return {
      url: ESEWA_CONFIG.formUrl,
      fields: {
        amount: totalAmount,
        tax_amount: 0,
        total_amount: totalAmount,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        product_service_charge: 0,
        product_delivery_charge: 0,
        success_url: successUrl,
        failure_url: failureUrl,
        signed_field_names: signedFieldNames,
        signature
      }
    };
  } catch (error) {
    console.error('🚨 eSewa initiation error:', error);
    throw error;
  }
};

/**
 * Verify eSewa payment
 * @param {Object} verifyData - Payment verification data
 * @param {string} verifyData.transactionUuid - Transaction UUID from eSewa
 * @param {number} verifyData.totalAmount - Total amount from eSewa
 * @param {string} verifyData.productCode - Product code (optional, uses config by default)
 * @param {string} verifyData.transactionCode - Transaction code (optional)
 * @returns {Promise<Object>} Verification response
 */
export const verifyEsewaPayment = async (verifyData) => {
  const validation = validateEsewaConfig();
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const {
    transactionUuid,
    totalAmount,
    productCode,
    transactionCode
  } = verifyData;

  if (!transactionUuid || !totalAmount) {
    throw new Error('Transaction UUID and total amount are required');
  }

  try {
    console.log(`🔍 eSewa Payment Verification:`);
    console.log(`   - UUID: ${transactionUuid}`);
    console.log(`   - Amount: NPR ${totalAmount}`);

    const configuredProductCode = ESEWA_CONFIG.productCode || ESEWA_CONFIG.merchantId;

    // Verify product code matches
    if (productCode && productCode !== configuredProductCode) {
      throw new Error('Invalid product code');
    }

    // Build query parameters
    const params = new URLSearchParams({
      product_code: configuredProductCode,
      total_amount: String(totalAmount),
      transaction_uuid: String(transactionUuid)
    });

    // Call eSewa status API
    const response = await fetch(`${ESEWA_CONFIG.statusUrl}?${params}`, {
      method: 'GET'
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('eSewa verification error:', data);
      throw new Error(data.message || 'Failed to verify eSewa payment');
    }

    // Check if payment is complete
    if (data.status === 'COMPLETE') {
      // Optionally verify transaction code
      if (transactionCode && data.transaction_code && data.transaction_code !== transactionCode) {
        console.warn('Transaction code mismatch');
        // Depending on your business logic, you might throw here or just warn
      }

      console.log('✅ eSewa payment verified successfully');
      return {
        verified: true,
        ...data
      };
    } else {
      console.log(`⏳ eSewa payment status: ${data.status}`);
      return {
        verified: false,
        status: data.status,
        ...data
      };
    }
  } catch (error) {
    console.error('🚨 eSewa verification error:', error);
    throw error;
  }
};

/**
 * Format amount for eSewa display
 * @param {number} amount - Amount in NPR
 * @returns {number} Amount for eSewa
 */
export const convertToEsewaAmount = (amount) => {
  return Math.round(amount);
};

export default {
  ESEWA_CONFIG,
  validateEsewaConfig,
  getEsewaPublicConfig,
  generateEsewaSignature,
  initiateEsewaPayment,
  verifyEsewaPayment,
  convertToEsewaAmount
};
