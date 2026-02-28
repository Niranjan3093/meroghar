/**
 * eSewa Payment Gateway - Client-side Utility
 * Handles eSewa payment initiation and verification on frontend
 */

const ESEWA_CONFIG = {
  merchantId: import.meta.env.VITE_ESEWA_MERCHANT_ID,
  productCode: import.meta.env.VITE_ESEWA_PRODUCT_CODE,
  formUrl: import.meta.env.VITE_ESEWA_FORM_URL,
  apiUrl: import.meta.env.VITE_API_URL || '/api'
};

/**
 * Validate eSewa configuration
 * @returns {Object} { valid: boolean, message: string }
 */
export const validateEsewaConfig = () => {
  if (!ESEWA_CONFIG.merchantId) {
    return { valid: false, message: 'VITE_ESEWA_MERCHANT_ID is not configured' };
  }
  if (!ESEWA_CONFIG.productCode) {
    return { valid: false, message: 'VITE_ESEWA_PRODUCT_CODE is not configured' };
  }
  if (!ESEWA_CONFIG.formUrl) {
    return { valid: false, message: 'VITE_ESEWA_FORM_URL is not configured' };
  }
  return { valid: true, message: 'eSewa configuration is valid' };
};

/**
 * Get eSewa configuration (frontend)
 * @returns {Object} Public configuration
 */
export const getEsewaPublicConfig = () => {
  return {
    merchantId: ESEWA_CONFIG.merchantId,
    productCode: ESEWA_CONFIG.productCode,
    enabled: !!ESEWA_CONFIG.merchantId && !!ESEWA_CONFIG.productCode,
    environment: import.meta.env.VITE_ENV === 'production' ? 'live' : 'test'
  };
};

/**
 * Initiate eSewa payment via backend
 * @param {Object} paymentData - Payment details
 * @param {number} paymentData.amount - Amount in NPR
 * @param {string} paymentData.productIdentity - Unique product/order ID
 * @param {string} paymentData.successUrl - Success callback URL
 * @param {string} paymentData.failureUrl - Failure callback URL
 * @returns {Promise<Object>} Payment initiation response with form data
 */
export const initiateEsewaPayment = async (paymentData) => {
  const validation = validateEsewaConfig();
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const { amount, productIdentity, successUrl, failureUrl } = paymentData;

  // Validate required fields
  if (!amount) throw new Error('Amount is required');
  if (!productIdentity) throw new Error('Product identity is required');

  try {
    console.log('🔗 eSewa Payment Initiation:');
    console.log(`   - Amount: NPR ${amount}`);
    console.log(`   - Product ID: ${productIdentity}`);

    const response = await fetch(`${ESEWA_CONFIG.apiUrl}/payments/esewa/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        amount,
        productIdentity,
        successUrl,
        failureUrl
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('eSewa API Error:', data);
      throw new Error(data.message || 'Failed to initiate eSewa payment');
    }

    console.log('✅ eSewa payment initiated successfully');
    return data.data;
  } catch (error) {
    console.error('🚨 eSewa initiation error:', error);
    throw error;
  }
};

/**
 * Submit eSewa payment form
 * @param {Object} esewaResponse - Response from backend eSewa initiation
 * @returns {void} Submits form to eSewa gateway
 */
export const submitEsewaPaymentForm = (esewaResponse) => {
  try {
    if (!esewaResponse.url) {
      throw new Error('eSewa form URL not provided');
    }

    if (!esewaResponse.fields) {
      throw new Error('eSewa form fields not provided');
    }

    console.log('📝 Submitting eSewa form...');
    console.log(`   - URL: ${esewaResponse.url}`);

    // Create and submit form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = esewaResponse.url;

    // Populate form fields
    Object.keys(esewaResponse.fields).forEach((key) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(esewaResponse.fields[key]);
      form.appendChild(input);
    });

    // Append to body and submit
    document.body.appendChild(form);
    form.submit();

    console.log('✅ eSewa form submitted');
  } catch (error) {
    console.error('🚨 Failed to submit eSewa form:', error);
    throw error;
  }
};

/**
 * Handle eSewa payment callback from URL parameters
 * @returns {Object|null} Parsed callback data or null
 */
export const parseEsewaCallback = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('data');

    if (!encodedData) {
      return null;
    }

    // Decode base64 data (eSewa v2 format)
    // Replace URL-safe base64 chars with standard ones
    const normalizedBase64 = decodeURIComponent(encodedData)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decodedPayload = JSON.parse(atob(normalizedBase64));

    console.log('✅ eSewa callback decoded:', decodedPayload);
    return decodedPayload;
  } catch (error) {
    console.error('🚨 Failed to parse eSewa callback:', error);
    return null;
  }
};

/**
 * Get auth token from localStorage
 * @returns {string} JWT token
 */
const getAuthToken = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('token') || '';
    }
  } catch (e) {
    console.warn('localStorage not available:', e);
  }
  return '';
};

/**
 * Check if eSewa is available/configured
 * @returns {boolean}
 */
export const isEsewaAvailable = () => {
  return !!ESEWA_CONFIG.merchantId && !!ESEWA_CONFIG.productCode;
};

/**
 * Get eSewa configuration
 * @returns {Object}
 */
export const getEsewaConfig = () => {
  return {
    ...ESEWA_CONFIG,
    available: isEsewaAvailable()
  };
};

/**
 * Convert amount from NPR to eSewa format (if needed)
 * @param {number} amount - Amount in NPR
 * @returns {number} Amount in eSewa format
 */
export const convertToEsewaAmount = (amount) => {
  // eSewa uses standard NPR amounts (no decimals)
  return Math.round(amount);
};

export default {
  ESEWA_CONFIG,
  validateEsewaConfig,
  getEsewaPublicConfig,
  initiateEsewaPayment,
  submitEsewaPaymentForm,
  parseEsewaCallback,
  isEsewaAvailable,
  getEsewaConfig,
  convertToEsewaAmount
};
