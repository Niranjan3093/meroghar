/**
 * Khalti Payment Gateway - Client-side Utility
 * Handles Khalti payment initiation and verification on frontend
 */

const KHALTI_CONFIG = {
  publicKey: import.meta.env.VITE_KHALTI_PUBLIC_KEY,
  apiUrl: import.meta.env.VITE_API_URL || '/api'
};

/**
 * Load Khalti checkout script
 * @returns {Promise<void>}
 */
export const loadKhaltiScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Khalti) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2.0.0/khalti-checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Khalti script'));
    document.head.appendChild(script);
  });
};

/**
 * Initialize Khalti checkout
 * @param {Object} config - Payment configuration
 * @param {number} config.amount - Amount in NPR (not paisa)
 * @param {string} config.productIdentity - Unique product/order ID
 * @param {string} config.productName - Product/order name
 * @param {string} config.productUrl - Product URL
 * @param {Function} config.onSuccess - Success callback
 * @param {Function} config.onError - Error callback
 * @returns {Promise<void>}
 */
export const openKhaltiCheckout = async (config) => {
  try {
    await loadKhaltiScript();

    if (!window.Khalti) {
      throw new Error('Khalti script not loaded');
    }

    const {
      amount,
      productIdentity,
      productName,
      productUrl,
      onSuccess,
      onError
    } = config;

    console.log('🔗 Opening Khalti Checkout');
    console.log(`   - Amount: NPR ${amount}`);
    console.log(`   - Product: ${productName}`);

    const checkout = new window.Khalti({
      publicKey: KHALTI_CONFIG.publicKey,
      amount: Math.round(amount * 100), // Convert to paisa
      productIdentity,
      productName,
      productUrl: productUrl || window.location.origin,
      eventHandler: {
        onSuccess: async (payload) => {
          console.log('✅ Khalti payment success:', payload);
          
          try {
            // Verify payment on backend
            const response = await fetch(`${KHALTI_CONFIG.apiUrl}/payments/khalti/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
              },
              body: JSON.stringify({
                pidx: payload.pidx,
                amount: amount
              })
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Payment verification failed');
            }

            console.log('✅ Payment verified successfully');
            if (onSuccess) {
              onSuccess(data);
            }
          } catch (error) {
            console.error('❌ Verification error:', error);
            if (onError) {
              onError(error);
            }
          }
        },
        onError: (error) => {
          console.error('❌ Khalti payment error:', error);
          if (onError) {
            onError(error);
          }
        },
        onClose: () => {
          console.log('⏹️ Khalti checkout closed');
        }
      }
    });

    checkout.show();
  } catch (error) {
    console.error('🚨 Failed to open Khalti checkout:', error);
    if (config.onError) {
      config.onError(error);
    }
  }
};

/**
 * Initiate payment via backend (get payment URL/token)
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Payment initiation response
 */
export const initiateKhaltiPaymentBackend = async (paymentData) => {
  try {
    console.log('🔗 Initiating Khalti payment on backend...', paymentData);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout on client side

    const response = await fetch(`${KHALTI_CONFIG.apiUrl}/payments/khalti/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      signal: controller.signal,
      body: JSON.stringify(paymentData)
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    
    console.log('📦 Backend Response:', {
      status: response.status,
      data: data
    });

    if (!response.ok) {
      throw new Error(data.message || 'Failed to initiate Khalti payment');
    }

    if (!data.data?.payment_url) {
      console.error('❌ Missing payment_url in backend response:', data);
      throw new Error('Backend returned invalid payment data');
    }

    console.log('✅ Khalti payment initiated');
    return data.data;
  } catch (error) {
    console.error('🚨 Khalti initiation error:', error);
    
    // Provide better error message for timeout
    if (error.name === 'AbortError') {
      throw new Error('Payment gateway connection timeout. The server is taking too long to respond. Please try again.');
    }
    
    throw error;
  }
};

/**
 * Get auth token from localStorage or localStorage
 * @returns {string} JWT token
 */
const getAuthToken = () => {
  try {
    // Try localStorage first (for browser environment)
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('token') || '';
    }
  } catch (e) {
    console.warn('localStorage not available:', e);
  }
  return '';
};

/**
 * Check if Khalti is available/configured
 * @returns {boolean}
 */
export const isKhaltiAvailable = () => {
  return !!KHALTI_CONFIG.publicKey;
};

/**
 * Get Khalti configuration
 * @returns {Object}
 */
export const getKhaltiConfig = () => {
  return {
    ...KHALTI_CONFIG,
    available: isKhaltiAvailable()
  };
};

/**
 * Reset Khalti session (useful after payment completion)
 */
export const resetKhaltiSession = () => {
  if (window.Khalti) {
    // Clear any Khalti-related session data
    delete window.Khalti;
  }
};

export default {
  KHALTI_CONFIG,
  loadKhaltiScript,
  openKhaltiCheckout,
  initiateKhaltiPaymentBackend,
  isKhaltiAvailable,
  getKhaltiConfig,
  resetKhaltiSession
};
