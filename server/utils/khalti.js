/**
 * Khalti Payment Gateway Utility
 * Handles all Khalti-related API calls and configurations
 */

const KHALTI_CONFIG = {
  secretKey: process.env.KHALTI_SECRET_KEY,
  publicKey: process.env.KHALTI_PUBLIC_KEY,
  initUrl: process.env.KHALTI_INIT_URL || 'https://dev.khalti.com/api/v2/epayment/initiate/',
  verifyUrl: process.env.KHALTI_VERIFY_URL || 'https://dev.khalti.com/api/v2/epayment/lookup/',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

/**
 * Validate Khalti configuration
 * @returns {Object} { valid: boolean, message: string }
 */
export const validateKhaltiConfig = () => {
  if (!KHALTI_CONFIG.secretKey) {
    return { valid: false, message: 'KHALTI_SECRET_KEY is not configured' };
  }
  if (!KHALTI_CONFIG.publicKey) {
    return { valid: false, message: 'KHALTI_PUBLIC_KEY is not configured' };
  }
  return { valid: true, message: 'Khalti configuration is valid' };
};

/**
 * Get Khalti configuration for frontend
 * @returns {Object} Public configuration that can be sent to frontend
 */
export const getKhaltiPublicConfig = () => {
  return {
    publicKey: KHALTI_CONFIG.publicKey,
    enabled: !!KHALTI_CONFIG.secretKey && !!KHALTI_CONFIG.publicKey,
    environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox'
  };
};

/**
 * Initiate Khalti payment
 * @param {Object} paymentData - Payment details
 * @param {number} paymentData.amount - Amount in NPR (will be converted to paisa)
 * @param {string} paymentData.productIdentity - Unique product/order ID
 * @param {string} paymentData.productName - Product/order name
 * @param {string} paymentData.productUrl - Product URL (optional)
 * @param {string} paymentData.returnUrl - Return URL after payment
 * @param {Object} paymentData.customerInfo - Customer information
 * @param {string} paymentData.customerInfo.name - Customer name
 * @param {string} paymentData.customerInfo.email - Customer email
 * @param {string} paymentData.customerInfo.phone - Customer phone
 * @returns {Promise<Object>} Khalti API response
 */
export const initiateKhaltiPayment = async (paymentData) => {
  const validation = validateKhaltiConfig();
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const {
    amount,
    productIdentity,
    productName,
    productUrl,
    returnUrl,
    customerInfo
  } = paymentData;

  // Validate required fields
  if (!amount) throw new Error('Amount is required');
  if (!productIdentity) throw new Error('Product identity is required');
  if (!productName) throw new Error('Product name is required');
  if (!returnUrl) throw new Error('Return URL is required');

  try {
    console.log('🔗 Khalti Payment Initiation:');
    console.log(`   - Amount: NPR ${amount}`);
    console.log(`   - Product ID: ${productIdentity}`);
    console.log(`   - Return URL: ${returnUrl}`);

    const response = await fetch(KHALTI_CONFIG.initUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${KHALTI_CONFIG.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        return_url: returnUrl,
        website_url: productUrl || KHALTI_CONFIG.clientUrl,
        amount: Math.round(amount * 100), // Convert NPR to paisa
        purchase_order_id: String(productIdentity),
        purchase_order_name: productName,
        customer_info: {
          name: customerInfo?.name || 'Customer',
          email: customerInfo?.email || 'noreply@meroghar.com',
          phone: customerInfo?.phone || '9800000000'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Khalti API Error:', data);
      throw new Error(data.detail || 'Failed to initiate Khalti payment');
    }

    console.log('✅ Khalti payment initiated successfully');
    return data;
  } catch (error) {
    console.error('🚨 Khalti initiation error:', error);
    throw error;
  }
};

/**
 * Verify Khalti payment
 * @param {string} pidx - Payment index from Khalti
 * @returns {Promise<Object>} Khalti API response
 */
export const verifyKhaltiPayment = async (pidx) => {
  const validation = validateKhaltiConfig();
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  if (!pidx) {
    throw new Error('Payment index (pidx) is required');
  }

  try {
    console.log(`🔍 Khalti Payment Verification: ${pidx}`);

    const response = await fetch(KHALTI_CONFIG.verifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${KHALTI_CONFIG.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pidx })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Khalti Verification Error:', data);
      throw new Error(data.detail || 'Failed to verify Khalti payment');
    }

    if (data.status === 'Completed') {
      console.log('✅ Khalti payment verified successfully');
      return {
        verified: true,
        ...data
      };
    } else {
      console.log(`⏳ Khalti payment status: ${data.status}`);
      return {
        verified: false,
        status: data.status,
        ...data
      };
    }
  } catch (error) {
    console.error('🚨 Khalti verification error:', error);
    throw error;
  }
};

/**
 * Format amount for Khalti display (NPR to paisa and back)
 * @param {number} nprAmount - Amount in NPR
 * @returns {number} Amount in paisa
 */
export const convertToKhaltiAmount = (nprAmount) => {
  return Math.round(nprAmount * 100);
};

/**
 * Format amount from Khalti (paisa to NPR)
 * @param {number} paisaAmount - Amount in paisa
 * @returns {number} Amount in NPR
 */
export const convertFromKhaltiAmount = (paisaAmount) => {
  return paisaAmount / 100;
};

export default {
  KHALTI_CONFIG,
  validateKhaltiConfig,
  getKhaltiPublicConfig,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  convertToKhaltiAmount,
  convertFromKhaltiAmount
};
