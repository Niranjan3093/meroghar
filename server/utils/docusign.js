import axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// DocuSign API configuration
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;
const DOCUSIGN_INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;
const DOCUSIGN_USER_ID = process.env.DOCUSIGN_USER_ID;
const DOCUSIGN_PRIVATE_KEY_PATH = process.env.DOCUSIGN_PRIVATE_KEY_PATH;
const DOCUSIGN_AUTH_SERVER = process.env.DOCUSIGN_AUTH_SERVER || 'account-d.docusign.com';
const DOCUSIGN_WEBHOOK_SECRET = process.env.DOCUSIGN_WEBHOOK_SECRET;

// Cache for access token
let cachedToken = null;
let tokenExpiry = null;

/**
 * Read private key from file
 */
function getPrivateKey() {
  try {
    const keyPath = path.resolve(process.cwd(), DOCUSIGN_PRIVATE_KEY_PATH || './private.key');
    return fs.readFileSync(keyPath, 'utf8');
  } catch (error) {
    console.error('Failed to read DocuSign private key:', error);
    throw new Error('DocuSign private key not found. Please ensure private.key file exists.');
  }
}

/**
 * Get DocuSign access token using JWT Grant
 */
async function getAccessToken() {
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    // Validate required config
    if (!DOCUSIGN_INTEGRATION_KEY || !DOCUSIGN_USER_ID) {
      throw new Error('DocuSign configuration incomplete. Set DOCUSIGN_INTEGRATION_KEY and DOCUSIGN_USER_ID.');
    }

    const privateKey = getPrivateKey();
    const now = Math.floor(Date.now() / 1000);
    
    // Create JWT assertion
    const jwtPayload = {
      iss: DOCUSIGN_INTEGRATION_KEY,
      sub: DOCUSIGN_USER_ID,
      aud: DOCUSIGN_AUTH_SERVER,
      iat: now,
      exp: now + 3600,
      scope: 'signature impersonation'
    };

    // Sign the JWT with the private key
    const assertion = jwt.sign(jwtPayload, privateKey, { algorithm: 'RS256' });

    // Exchange JWT for access token
    const tokenResponse = await axios.post(
      `https://${DOCUSIGN_AUTH_SERVER}/oauth/token`,
      new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: assertion
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    cachedToken = tokenResponse.data.access_token;
    // Set expiry 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (tokenResponse.data.expires_in - 300) * 1000;

    console.log('DocuSign access token obtained successfully');
    return cachedToken;
  } catch (error) {
    console.error('Failed to get DocuSign access token:', error.response?.data || error.message);
    
    // Check if consent is needed
    if (error.response?.data?.error === 'consent_required') {
      const consentUrl = `https://${DOCUSIGN_AUTH_SERVER}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${DOCUSIGN_INTEGRATION_KEY}&redirect_uri=http://localhost:5000/api/leases/docusign/callback`;
      console.log('\n========================================');
      console.log('DOCUSIGN CONSENT REQUIRED!');
      console.log('Please visit this URL to grant consent:');
      console.log(consentUrl);
      console.log('========================================\n');
      throw new Error(`DocuSign consent required. Please visit: ${consentUrl}`);
    }
    
    throw error;
  }
}

/**
 * Get the base URL for API calls (may differ from auth server)
 */
function getBaseUrl() {
  return process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi';
}

/**
 * Create a lease agreement envelope in DocuSign
 */
export async function createLeaseEnvelope(lease, hostEmail, hostName, tenantEmail, tenantName) {
  try {
    const accessToken = await getAccessToken();
    
    // Generate the lease document HTML
    const documentHtml = generateLeaseDocument(lease, hostName, tenantName);
    const documentBase64 = Buffer.from(documentHtml).toString('base64');
    
    // Use clientUserId for embedded signing
    const hostClientUserId = `host_${lease._id}`;
    const tenantClientUserId = `tenant_${lease._id}`;
    
    const envelopeDefinition = {
      emailSubject: `Lease Agreement for ${lease.property?.title || 'Property'} - MeroGhar`,
      emailBlurb: 'Please review and sign the lease agreement to finalize your rental agreement.',
      status: 'sent', // 'sent' to send immediately, 'created' for draft
      documents: [
        {
          documentId: '1',
          name: 'Lease Agreement',
          fileExtension: 'html',
          documentBase64: documentBase64
        }
      ],
      recipients: {
        signers: [
          {
            email: hostEmail,
            name: hostName,
            recipientId: '1',
            routingOrder: '1',
            clientUserId: hostClientUserId, // Required for embedded signing
            roleName: 'Host/Landlord',
            tabs: {
              signHereTabs: [
                {
                  anchorString: '/sn1/',
                  anchorUnits: 'pixels',
                  anchorXOffset: '20',
                  anchorYOffset: '-5'
                }
              ],
              dateSignedTabs: [
                {
                  anchorString: '/dt1/',
                  anchorUnits: 'pixels',
                  anchorXOffset: '20',
                  anchorYOffset: '0'
                }
              ],
              fullNameTabs: [
                {
                  anchorString: '/fn1/',
                  anchorUnits: 'pixels',
                  anchorXOffset: '0',
                  anchorYOffset: '0'
                }
              ]
            }
          },
          {
            email: tenantEmail,
            name: tenantName,
            recipientId: '2',
            routingOrder: '1', // Same routing order so both can sign in any order
            clientUserId: tenantClientUserId, // Required for embedded signing
            roleName: 'Tenant',
            tabs: {
              signHereTabs: [
                {
                  anchorString: '/sn2/',
                  anchorUnits: 'pixels',
                  anchorXOffset: '20',
                  anchorYOffset: '-5'
                }
              ],
              dateSignedTabs: [
                {
                  anchorString: '/dt2/',
                  anchorUnits: 'pixels',
                  anchorXOffset: '20',
                  anchorYOffset: '0'
                }
              ],
              fullNameTabs: [
                {
                  anchorString: '/fn2/',
                  anchorUnits: 'pixels',
                  anchorXOffset: '0',
                  anchorYOffset: '0'
                }
              ]
            }
          }
        ]
      }
    };

    // Only add webhook/event notification if BACKEND_URL is HTTPS (DocuSign requires HTTPS for webhooks)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    if (backendUrl.startsWith('https://')) {
      envelopeDefinition.eventNotification = {
        url: `${backendUrl}/api/leases/docusign/webhook`,
        loggingEnabled: true,
        requireAcknowledgment: true,
        envelopeEvents: [
          { envelopeEventStatusCode: 'completed' },
          { envelopeEventStatusCode: 'declined' },
          { envelopeEventStatusCode: 'voided' }
        ],
        recipientEvents: [
          { recipientEventStatusCode: 'Completed' },
          { recipientEventStatusCode: 'Declined' }
        ]
      };
    } else {
      console.log('⚠️ Webhook notifications disabled - HTTPS required. Signature status will be updated via polling.');
    }

    const response = await axios.post(
      `${getBaseUrl()}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes`,
      envelopeDefinition,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      envelopeId: response.data.envelopeId,
      status: response.data.status,
      statusDateTime: response.data.statusDateTime
    };
  } catch (error) {
    console.error('Failed to create DocuSign envelope:', error.response?.data || error);
    throw error;
  }
}

/**
 * Get the embedded signing URL for a recipient
 */
export async function getSigningUrl(envelopeId, email, name, returnUrl, recipientId = '1', leaseId, userRole) {
  try {
    const accessToken = await getAccessToken();
    
    // Construct clientUserId to match what was used in envelope creation
    const clientUserId = userRole === 'host' ? `host_${leaseId}` : `tenant_${leaseId}`;
    
    const recipientViewRequest = {
      returnUrl: returnUrl,
      authenticationMethod: 'none',
      email: email,
      userName: name,
      recipientId: recipientId,
      clientUserId: clientUserId
    };

    const response = await axios.post(
      `${getBaseUrl()}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/views/recipient`,
      recipientViewRequest,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.url;
  } catch (error) {
    console.error('Failed to get signing URL:', error.response?.data || error);
    throw error;
  }
}

/**
 * Get envelope status
 */
export async function getEnvelopeStatus(envelopeId) {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.get(
      `${getBaseUrl()}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    return {
      status: response.data.status,
      emailSubject: response.data.emailSubject,
      sentDateTime: response.data.sentDateTime,
      completedDateTime: response.data.completedDateTime,
      recipients: response.data.recipients
    };
  } catch (error) {
    console.error('Failed to get envelope status:', error.response?.data || error);
    throw error;
  }
}

/**
 * Get detailed recipient status to check who has signed
 */
export async function getEnvelopeRecipients(envelopeId) {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.get(
      `${getBaseUrl()}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/recipients`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Failed to get envelope recipients:', error.response?.data || error);
    throw error;
  }
}

/**
 * Download signed document
 */
export async function downloadDocument(envelopeId, documentId = '1') {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.get(
      `${getBaseUrl()}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/documents/${documentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        responseType: 'arraybuffer'
      }
    );

    return {
      data: response.data,
      contentType: response.headers['content-type']
    };
  } catch (error) {
    console.error('Failed to download document:', error.response?.data || error);
    throw error;
  }
}

/**
 * Download combined documents (certificate + signed docs)
 */
export async function downloadCombinedDocument(envelopeId) {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.get(
      `${getBaseUrl()}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/documents/combined`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        responseType: 'arraybuffer'
      }
    );

    return {
      data: response.data,
      contentType: response.headers['content-type'] || 'application/pdf'
    };
  } catch (error) {
    console.error('Failed to download combined document:', error.response?.data || error);
    throw error;
  }
}

/**
 * Void an envelope
 */
export async function voidEnvelope(envelopeId, reason = 'Lease cancelled') {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.put(
      `${getBaseUrl()}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}`,
      {
        status: 'voided',
        voidedReason: reason
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Failed to void envelope:', error.response?.data || error);
    throw error;
  }
}

/**
 * Verify webhook HMAC signature
 */
export function verifyWebhookSignature(payload, signature) {
  if (!DOCUSIGN_WEBHOOK_SECRET) {
    console.warn('DocuSign webhook secret not configured');
    return true; // Skip verification in development
  }
  
  const computedSignature = crypto
    .createHmac('sha256', DOCUSIGN_WEBHOOK_SECRET)
    .update(payload)
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}

/**
 * Generate lease document HTML
 */
function generateLeaseDocument(lease, hostName, tenantName) {
  const startDate = new Date(lease.startDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const endDate = new Date(lease.endDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  
  const propertyAddress = lease.property?.address 
    ? `${lease.property.address.street || ''}, ${lease.property.address.city || ''}, ${lease.property.address.state || ''}`
    : 'Property Address';

  const terms = lease.terms?.length > 0 
    ? lease.terms.map(t => `<li>${t}</li>`).join('')
    : '<li>Standard rental terms apply</li>';

  const rules = lease.rules?.length > 0
    ? lease.rules.map(r => `<li>${r}</li>`).join('')
    : '<li>Standard property rules apply</li>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { text-align: center; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    .header { text-align: center; margin-bottom: 30px; }
    .section { margin-bottom: 20px; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .info-table td { padding: 10px; border: 1px solid #ddd; }
    .info-table td:first-child { font-weight: bold; background: #f8f9fa; width: 200px; }
    .terms-list { margin-left: 20px; }
    .signature-section { margin-top: 50px; page-break-inside: avoid; }
    .signature-box { display: inline-block; width: 45%; margin: 20px 2%; vertical-align: top; }
    .signature-line { border-bottom: 1px solid #333; height: 40px; margin-bottom: 5px; }
    .signature-label { font-size: 12px; color: #666; }
    .date-line { margin-top: 10px; }
    .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; }
    .legal-notice { background: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>RESIDENTIAL LEASE AGREEMENT</h1>
    <p>MeroGhar Property Management</p>
  </div>

  <div class="section">
    <p>This Residential Lease Agreement ("Agreement") is entered into as of <strong>${startDate}</strong>, 
    by and between the following parties:</p>
  </div>

  <h2>1. PARTIES</h2>
  <table class="info-table">
    <tr>
      <td>Landlord/Host</td>
      <td>${hostName}</td>
    </tr>
    <tr>
      <td>Tenant</td>
      <td>${tenantName}</td>
    </tr>
  </table>

  <h2>2. PROPERTY</h2>
  <table class="info-table">
    <tr>
      <td>Property Title</td>
      <td>${lease.property?.title || 'Rental Property'}</td>
    </tr>
    <tr>
      <td>Property Address</td>
      <td>${propertyAddress}</td>
    </tr>
  </table>

  <h2>3. LEASE TERM</h2>
  <table class="info-table">
    <tr>
      <td>Lease Start Date</td>
      <td>${startDate}</td>
    </tr>
    <tr>
      <td>Lease End Date</td>
      <td>${endDate}</td>
    </tr>
  </table>

  <h2>4. FINANCIAL TERMS</h2>
  <table class="info-table">
    <tr>
      <td>Monthly Rent</td>
      <td>NPR ${(lease.monthlyRent || 0).toLocaleString()}</td>
    </tr>
    <tr>
      <td>Security Deposit</td>
      <td>NPR ${(lease.securityDeposit || 0).toLocaleString()}</td>
    </tr>
    <tr>
      <td>Rent Due Date</td>
      <td>1st of each month</td>
    </tr>
    <tr>
      <td>Late Fee</td>
      <td>5% after 5 days grace period</td>
    </tr>
  </table>

  <h2>5. TERMS AND CONDITIONS</h2>
  <ul class="terms-list">
    ${terms}
    <li>Rent is due on the 1st of each month and is considered late after the 5th.</li>
    <li>Tenant shall maintain the property in good condition.</li>
    <li>Any modifications to the property require written consent from the Landlord.</li>
    <li>Tenant shall not sublease without prior written approval.</li>
  </ul>

  <h2>6. PROPERTY RULES</h2>
  <ul class="terms-list">
    ${rules}
  </ul>

  <h2>7. SECURITY DEPOSIT</h2>
  <div class="legal-notice">
    <p>The security deposit of <strong>NPR ${(lease.securityDeposit || 0).toLocaleString()}</strong> shall be held by the Landlord 
    and returned to the Tenant within 30 days after the lease ends, minus any deductions for damages 
    beyond normal wear and tear or unpaid rent.</p>
  </div>

  <h2>8. MAINTENANCE AND REPAIRS</h2>
  <p>The Landlord shall be responsible for major repairs and maintenance of the property's structure, 
  plumbing, electrical systems, and appliances provided with the property. The Tenant shall be 
  responsible for minor maintenance and keeping the property clean.</p>

  <h2>9. TERMINATION</h2>
  <p>Either party may terminate this lease with 30 days written notice. Early termination by the 
  Tenant without proper notice may result in forfeiture of the security deposit.</p>

  <h2>10. GOVERNING LAW</h2>
  <p>This Agreement shall be governed by and construed in accordance with the laws of Nepal.</p>

  <div class="signature-section">
    <h2>SIGNATURES</h2>
    <p>By signing below, both parties agree to the terms and conditions outlined in this Lease Agreement.</p>
    
    <div class="signature-box">
      <p><strong>Landlord/Host</strong></p>
      <div class="signature-line">/sn1/</div>
      <p class="signature-label">Signature of ${hostName}</p>
      <div class="date-line">Date: /dt1/</div>
    </div>
    
    <div class="signature-box">
      <p><strong>Tenant</strong></p>
      <div class="signature-line">/sn2/</div>
      <p class="signature-label">Signature of ${tenantName}</p>
      <div class="date-line">Date: /dt2/</div>
    </div>
  </div>

  <div class="footer">
    <p>This lease agreement was generated through MeroGhar Property Management System.</p>
    <p>Lease ID: ${lease._id}</p>
  </div>
</body>
</html>
  `;
}

// Fallback for when DocuSign is not configured - creates a simple contract document
export function generateSimpleLeaseContract(lease, hostName, tenantName) {
  return generateLeaseDocument(lease, hostName, tenantName);
}

export default {
  createLeaseEnvelope,
  getSigningUrl,
  getEnvelopeStatus,
  getEnvelopeRecipients,
  downloadDocument,
  downloadCombinedDocument,
  voidEnvelope,
  verifyWebhookSignature,
  generateSimpleLeaseContract
};
