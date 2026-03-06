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
 * Initiate Khalti payment with retry logic
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

  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔗 Khalti Payment Initiation (Attempt ${attempt}/${maxRetries}):`);
      console.log(`   - Amount: NPR ${amount}`);
      console.log(`   - Product ID: ${productIdentity}`);
      console.log(`   - Return URL: ${returnUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(KHALTI_CONFIG.initUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${KHALTI_CONFIG.secretKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
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

      clearTimeout(timeoutId);

      const data = await response.json();

      console.log('📦 Khalti API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });

      if (!response.ok) {
        console.error('Khalti API Error:', data);
        throw new Error(data.detail || data.message || 'Failed to initiate Khalti payment');
      }

      // Verify response has payment_url field
      if (!data.payment_url) {
        console.error('❌ Khalti response missing payment_url field:', data);
        throw new Error('Khalti API response missing payment_url field');
      }

      console.log('✅ Khalti payment initiated successfully');
      return data;
    } catch (error) {
      lastError = error;
      console.error(`❌ Khalti initiation error (Attempt ${attempt}):`, error.message);

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error('🚨 All Khalti payment initiation attempts failed');
        throw new Error(`Failed to initiate payment after ${maxRetries} attempts: ${error.message}`);
      }

      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

/**
 * Verify Khalti payment with retry logic
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

  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Khalti Payment Verification (Attempt ${attempt}/${maxRetries}): ${pidx}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(KHALTI_CONFIG.verifyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${KHALTI_CONFIG.secretKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({ pidx })
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      console.log('📦 Khalti Verification Response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('Khalti Verification Error:', data);
        throw new Error(data.detail || data.message || 'Failed to verify Khalti payment');
      }

      // Check multiple possible status field names (state, status, transaction_state, etc.)
      const paymentState = data.state || data.status || data.transaction_state || null;
      
      console.log(`Payment State Field Values:`, {
        'data.state': data.state,
        'data.status': data.status,
        'data.transaction_state': data.transaction_state,
        'resolved to': paymentState,
        'all_keys': Object.keys(data)
      });

      // Accept either 'Completed' or 'Successful' or completed status
      // Also log if we receive an unexpected state
      if (paymentState === 'Completed' || paymentState === 'Successful' || data.transaction_state === 'Completed') {
        console.log('✅ Khalti payment verified successfully');
        return {
          verified: true,
          ...data
        };
      } else if (paymentState === 'Pending' || paymentState === 'Processing' || paymentState === 'Initiated') {
        // Payment is still processing
        console.log(`⏳ Khalti payment is ${paymentState}`);
        return {
          verified: false,
          status: paymentState,
          message: `Payment ${paymentState.toLowerCase()}, please wait...`,
          ...data
        };
      } else {
        // Unknown status - could be Failed, Expired, or something else
        console.log(`⚠️ Khalti payment status is unknown: ${paymentState}`);
        return {
          verified: false,
          status: paymentState || 'unknown',
          message: `Payment status: ${paymentState || 'unknown'}`,
          ...data
        };
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ Khalti verification error (Attempt ${attempt}):`, error.message);

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error('🚨 All Khalti payment verification attempts failed');
        throw new Error(`Failed to verify payment after ${maxRetries} attempts: ${error.message}`);
      }

      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Retrying verification in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
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
