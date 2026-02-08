import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import Lease from '../models/Lease.js';
import Property from '../models/Property.js';
import docusign, { 
  createLeaseEnvelope, 
  getSigningUrl, 
  getEnvelopeStatus,
  getEnvelopeRecipients,
  downloadCombinedDocument,
  voidEnvelope,
  verifyWebhookSignature,
  generateSimpleLeaseContract 
} from '../utils/docusign.js';
import { notifyContractRenewal, notifyLeaseSigned } from '../utils/notifications.js';

// Get all leases for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'tenant') {
      // Tenants see their leases
      query = { tenant: req.user._id };
    } else if (req.user.role === 'host') {
      // Hosts see leases for their properties
      query = { host: req.user._id };
    } else if (req.user.role === 'admin') {
      // Admins see all leases
      query = {};
    }
    
    const leases = await Lease.find(query)
      .populate('property', 'title images address rent')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: leases });
  } catch (error) {
    console.error('Error fetching leases:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leases' });
  }
});

// Get single lease
router.get('/:id', protect, async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('property', 'title images address rent')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone');
    
    if (!lease) {
      return res.status(404).json({ success: false, message: 'Lease not found' });
    }
    
    res.json({ success: true, data: lease });
  } catch (error) {
    console.error('Error fetching lease:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lease' });
  }
});

// Create lease
router.post('/', protect, async (req, res) => {
  try {
    const lease = await Lease.create(req.body);
    
    const populated = await Lease.findById(lease._id)
      .populate('property', 'title images address rent')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone');
    
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Error creating lease:', error);
    res.status(500).json({ success: false, message: 'Failed to create lease' });
  }
});

// Update lease
router.put('/:id', protect, async (req, res) => {
  try {
    const lease = await Lease.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('property', 'title images address rent')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone');
    
    if (!lease) {
      return res.status(404).json({ success: false, message: 'Lease not found' });
    }
    
    res.json({ success: true, data: lease });
  } catch (error) {
    console.error('Error updating lease:', error);
    res.status(500).json({ success: false, message: 'Failed to update lease' });
  }
});

// ============= DOCUSIGN INTEGRATION =============

// Initialize DocuSign signing process - creates envelope and sends for signature
router.post('/:id/docusign/create-envelope', protect, async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('property', 'title address')
      .populate('host', 'name email')
      .populate('tenant', 'name email');

    if (!lease) {
      return res.status(404).json({ success: false, message: 'Lease not found' });
    }

    // Verify user is part of this lease
    const isHost = lease.host._id.toString() === req.user._id.toString();
    const isTenant = lease.tenant._id.toString() === req.user._id.toString();
    
    if (!isHost && !isTenant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if envelope already exists
    if (lease.docusign?.envelopeId && lease.docusign?.status !== 'voided') {
      return res.status(400).json({ 
        success: false, 
        message: 'Signing process already initiated',
        envelopeId: lease.docusign.envelopeId 
      });
    }

    // Check if DocuSign is configured
    if (!process.env.DOCUSIGN_ACCOUNT_ID || !process.env.DOCUSIGN_INTEGRATION_KEY || !process.env.DOCUSIGN_USER_ID) {
      // Fall back to simple signature mode
      lease.docusign = {
        envelopeId: `LOCAL-${Date.now()}`,
        status: 'created',
        createdAt: new Date(),
        useLocalSigning: true
      };
      await lease.save();

      return res.json({
        success: true,
        message: 'DocuSign not configured. Using local signing mode.',
        data: {
          envelopeId: lease.docusign.envelopeId,
          status: 'created',
          useLocalSigning: true
        }
      });
    }

    // Create DocuSign envelope
    const result = await createLeaseEnvelope(
      lease,
      lease.host.email,
      lease.host.name,
      lease.tenant.email,
      lease.tenant.name
    );

    // Update lease with DocuSign info
    lease.docusign = {
      envelopeId: result.envelopeId,
      status: result.status,
      createdAt: new Date(),
      useLocalSigning: false
    };
    await lease.save();

    res.json({
      success: true,
      message: 'DocuSign envelope created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating DocuSign envelope:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create signing envelope',
      error: error.message 
    });
  }
});

// Get embedded signing URL
router.get('/:id/docusign/signing-url', protect, async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('host', 'name email')
      .populate('tenant', 'name email');

    if (!lease) {
      return res.status(404).json({ success: false, message: 'Lease not found' });
    }

    // Verify user is part of this lease
    const isHost = lease.host._id.toString() === req.user._id.toString();
    const isTenant = lease.tenant._id.toString() === req.user._id.toString();
    
    if (!isHost && !isTenant) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!lease.docusign?.envelopeId) {
      return res.status(400).json({ success: false, message: 'Signing process not initiated' });
    }

    // For local signing mode
    if (lease.docusign.useLocalSigning) {
      return res.json({
        success: true,
        data: {
          useLocalSigning: true,
          leaseId: lease._id
        }
      });
    }

    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/leases/${lease._id}?signing=complete`;
    
    const email = isHost ? lease.host.email : lease.tenant.email;
    const name = isHost ? lease.host.name : lease.tenant.name;
    const recipientId = isHost ? '1' : '2';
    const userRole = isHost ? 'host' : 'tenant';

    const signingUrl = await getSigningUrl(
      lease.docusign.envelopeId,
      email,
      name,
      returnUrl,
      recipientId,
      lease._id.toString(),
      userRole
    );

    res.json({
      success: true,
      data: {
        signingUrl,
        useLocalSigning: false
      }
    });
  } catch (error) {
    console.error('Error getting signing URL:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get signing URL',
      error: error.message 
    });
  }
});

// Local signing (fallback when DocuSign not configured)
router.post('/:id/sign', protect, async (req, res) => {
  try {
    const { signature } = req.body;
    
    const lease = await Lease.findById(req.params.id)
      .populate('host', 'name email')
      .populate('tenant', 'name email');

    if (!lease) {
      return res.status(404).json({ success: false, message: 'Lease not found' });
    }

    // Verify user is part of this lease
    const isHost = lease.host._id.toString() === req.user._id.toString();
    const isTenant = lease.tenant._id.toString() === req.user._id.toString();
    
    if (!isHost && !isTenant) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Update signature based on user role
    if (isHost) {
      if (lease.hostSignature?.signed) {
        return res.status(400).json({ success: false, message: 'You have already signed this lease' });
      }
      lease.hostSignature = {
        signed: true,
        signedAt: new Date(),
        signature: signature || `Signed by ${lease.host.name}`
      };
    } else {
      if (lease.tenantSignature?.signed) {
        return res.status(400).json({ success: false, message: 'You have already signed this lease' });
      }
      lease.tenantSignature = {
        signed: true,
        signedAt: new Date(),
        signature: signature || `Signed by ${lease.tenant.name}`
      };
    }

    // Check if both parties have signed
    if (lease.hostSignature?.signed && lease.tenantSignature?.signed) {
      lease.status = 'active';
      
      // Update DocuSign status if using local signing
      if (lease.docusign?.useLocalSigning) {
        lease.docusign.status = 'completed';
        lease.docusign.completedAt = new Date();
      }
    }

    await lease.save();

    const populated = await Lease.findById(lease._id)
      .populate('property', 'title images address rent')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone');

    // Create persistent notification for lease signing
    const io = req.app.get('io');
    const notifyUserId = isHost ? lease.tenant._id : lease.host._id;
    const signerName = isHost ? lease.host.name : lease.tenant.name;
    
    await notifyLeaseSigned(io, {
      recipientId: notifyUserId,
      signerId: req.user._id,
      signerName,
      propertyTitle: populated.property?.title || 'Property',
      leaseId: lease._id,
      propertyId: populated.property?._id
    });

    // If both signed, notify both parties
    if (lease.status === 'active' && io) {
      io.to(lease.host._id.toString()).emit('notification', {
        type: 'lease-active',
        message: 'Lease agreement is now active! Both parties have signed.',
        data: populated
      });
      io.to(lease.tenant._id.toString()).emit('notification', {
        type: 'lease-active',
        message: 'Lease agreement is now active! Both parties have signed.',
        data: populated
      });
    }

    res.json({ 
      success: true, 
      data: populated,
      message: lease.status === 'active' 
        ? 'Lease is now active! Both parties have signed.' 
        : 'Signature recorded. Waiting for other party to sign.'
    });
  } catch (error) {
    console.error('Error signing lease:', error);
    res.status(500).json({ success: false, message: 'Failed to sign lease' });
  }
});

// Get DocuSign envelope status
router.get('/:id/docusign/status', protect, async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id);

    if (!lease) {
      return res.status(404).json({ success: false, message: 'Lease not found' });
    }

    if (!lease.docusign?.envelopeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No signing process found for this lease' 
      });
    }

    // For local signing
    if (lease.docusign.useLocalSigning) {
      return res.json({
        success: true,
        data: {
          status: lease.docusign.status,
          useLocalSigning: true,
          hostSigned: lease.hostSignature?.signed || false,
          tenantSigned: lease.tenantSignature?.signed || false
        }
      });
    }

    const status = await getEnvelopeStatus(lease.docusign.envelopeId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting envelope status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get signing status',
      error: error.message 
    });
  }
});

// Sync DocuSign status - polls DocuSign and updates lease accordingly
// This is crucial for environments where webhooks don't work (non-HTTPS)
router.post('/:id/docusign/sync', protect, async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('property', 'title address')
      .populate('host', 'name email')
      .populate('tenant', 'name email');

    if (!lease) {
      return res.status(404).json({ success: false, message: 'Lease not found' });
    }

    // Verify user has access
    const isHost = lease.host._id.toString() === req.user._id.toString();
    const isTenant = lease.tenant._id.toString() === req.user._id.toString();
    
    if (!isHost && !isTenant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!lease.docusign?.envelopeId) {
      return res.status(400).json({ success: false, message: 'No signing process found for this lease' });
    }

    // For local signing, no need to sync
    if (lease.docusign.useLocalSigning) {
      return res.json({
        success: true,
        data: lease,
        message: 'Local signing mode - no sync needed'
      });
    }

    // Get envelope status from DocuSign
    const envelopeStatus = await getEnvelopeStatus(lease.docusign.envelopeId);
    const recipients = await getEnvelopeRecipients(lease.docusign.envelopeId);
    
    console.log('DocuSign sync - Envelope status:', envelopeStatus.status);
    console.log('DocuSign sync - Recipients:', JSON.stringify(recipients.signers, null, 2));

    let updated = false;

    // Check each signer's status
    if (recipients.signers) {
      for (const signer of recipients.signers) {
        const signedStatus = signer.status === 'completed' || signer.status === 'signed';
        
        // Host is recipientId 1
        if (signer.recipientId === '1' && signedStatus && !lease.hostSignature?.signed) {
          lease.hostSignature = {
            signed: true,
            signedAt: signer.signedDateTime ? new Date(signer.signedDateTime) : new Date(),
            signature: `Signed via DocuSign by ${signer.name}`
          };
          updated = true;
          console.log('DocuSign sync - Host signature updated');
        }
        
        // Tenant is recipientId 2
        if (signer.recipientId === '2' && signedStatus && !lease.tenantSignature?.signed) {
          lease.tenantSignature = {
            signed: true,
            signedAt: signer.signedDateTime ? new Date(signer.signedDateTime) : new Date(),
            signature: `Signed via DocuSign by ${signer.name}`
          };
          updated = true;
          console.log('DocuSign sync - Tenant signature updated');
        }
      }
    }

    // Update overall envelope status
    if (lease.docusign.status !== envelopeStatus.status) {
      lease.docusign.status = envelopeStatus.status;
      updated = true;
    }

    // If envelope is completed, update lease status and download signed document
    if (envelopeStatus.status === 'completed') {
      if (lease.status !== 'active') {
        lease.status = 'active';
        updated = true;
      }
      
      if (!lease.docusign.completedAt) {
        lease.docusign.completedAt = envelopeStatus.completedDateTime 
          ? new Date(envelopeStatus.completedDateTime) 
          : new Date();
        updated = true;
      }

      // Ensure both signatures are marked as signed
      if (!lease.hostSignature?.signed) {
        lease.hostSignature = {
          signed: true,
          signedAt: new Date(),
          signature: 'Signed via DocuSign'
        };
        updated = true;
      }
      if (!lease.tenantSignature?.signed) {
        lease.tenantSignature = {
          signed: true,
          signedAt: new Date(),
          signature: 'Signed via DocuSign'
        };
        updated = true;
      }
    }

    // Handle declined or voided envelopes
    if (envelopeStatus.status === 'declined' || envelopeStatus.status === 'voided') {
      if (!lease.docusign.voidedAt) {
        lease.docusign.voidedAt = new Date();
        updated = true;
      }
    }

    if (updated) {
      await lease.save();
      console.log('DocuSign sync - Lease updated successfully');
    }

    // Re-fetch the populated lease
    const populatedLease = await Lease.findById(lease._id)
      .populate('property', 'title images address rent')
      .populate('host', 'name email avatar phone')
      .populate('tenant', 'name email avatar phone');

    // Emit notifications if lease became active
    if (envelopeStatus.status === 'completed' && updated) {
      const io = req.app.get('io');
      if (io) {
        io.to(lease.host._id.toString()).emit('notification', {
          type: 'lease-completed',
          message: 'Lease agreement has been fully signed!',
          data: populatedLease
        });
        io.to(lease.tenant._id.toString()).emit('notification', {
          type: 'lease-completed',
          message: 'Lease agreement has been fully signed!',
          data: populatedLease
        });
      }
    }

    res.json({
      success: true,
      data: populatedLease,
      synced: updated,
      docusignStatus: envelopeStatus.status,
      message: updated ? 'Lease status synced with DocuSign' : 'Lease already up to date'
    });
  } catch (error) {
    console.error('Error syncing DocuSign status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sync signing status',
      error: error.message 
    });
  }
});

// Download signed lease document
router.get('/:id/download', protect, async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('property', 'title address')
      .populate('host', 'name email')
      .populate('tenant', 'name email');

    if (!lease) {
      return res.status(404).json({ success: false, message: 'Lease not found' });
    }

    // Verify user has access
    const isHost = lease.host._id.toString() === req.user._id.toString();
    const isTenant = lease.tenant._id.toString() === req.user._id.toString();
    
    if (!isHost && !isTenant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // If DocuSign with completed envelope
    if (lease.docusign?.envelopeId && !lease.docusign.useLocalSigning && lease.docusign.status === 'completed') {
      const document = await downloadCombinedDocument(lease.docusign.envelopeId);
      
      res.setHeader('Content-Type', document.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="lease-${lease._id}.pdf"`);
      return res.send(Buffer.from(document.data));
    }

    // Generate simple HTML contract for download
    const html = generateSimpleLeaseContract(lease, lease.host.name, lease.tenant.name);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="lease-${lease._id}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Error downloading lease:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to download lease document',
      error: error.message 
    });
  }
});

// View lease contract (inline)
router.get('/:id/contract', protect, async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('property', 'title address')
      .populate('host', 'name email')
      .populate('tenant', 'name email');

    if (!lease) {
      return res.status(404).json({ success: false, message: 'Lease not found' });
    }

    // Verify user has access
    const isHost = lease.host._id.toString() === req.user._id.toString();
    const isTenant = lease.tenant._id.toString() === req.user._id.toString();
    
    if (!isHost && !isTenant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Generate contract HTML
    const html = generateSimpleLeaseContract(lease, lease.host.name, lease.tenant.name);
    
    // Add signature status to the response
    const signatureStatus = {
      hostSigned: lease.hostSignature?.signed || false,
      hostSignedAt: lease.hostSignature?.signedAt,
      tenantSigned: lease.tenantSignature?.signed || false,
      tenantSignedAt: lease.tenantSignature?.signedAt
    };
    
    res.json({
      success: true,
      data: {
        html,
        signatureStatus,
        leaseStatus: lease.status
      }
    });
  } catch (error) {
    console.error('Error getting lease contract:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get lease contract',
      error: error.message 
    });
  }
});

// DocuSign webhook handler
router.post('/docusign/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-docusign-signature-1'];
    
    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production' && signature) {
      const isValid = verifyWebhookSignature(req.body.toString(), signature);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const payload = JSON.parse(req.body.toString());
    const { envelopeId, status } = payload;

    console.log('DocuSign webhook received:', { envelopeId, status });

    // Find and update the lease
    const lease = await Lease.findOne({ 'docusign.envelopeId': envelopeId });
    
    if (lease) {
      lease.docusign.status = status;
      
      if (status === 'completed') {
        lease.status = 'active';
        lease.docusign.completedAt = new Date();
        lease.hostSignature = { signed: true, signedAt: new Date() };
        lease.tenantSignature = { signed: true, signedAt: new Date() };
      } else if (status === 'declined' || status === 'voided') {
        lease.docusign.voidedAt = new Date();
      }
      
      await lease.save();

      // Emit notification
      const io = req.app.get('io');
      if (io && status === 'completed') {
        io.to(lease.host.toString()).emit('notification', {
          type: 'lease-completed',
          message: 'Lease agreement has been fully signed!'
        });
        io.to(lease.tenant.toString()).emit('notification', {
          type: 'lease-completed',
          message: 'Lease agreement has been fully signed!'
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('DocuSign webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Request lease renewal
router.post('/:id/renewal', protect, async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('host', 'name email')
      .populate('tenant', 'name email');

    if (!lease) {
      return res.status(404).json({ success: false, message: 'Lease not found' });
    }

    // Verify user is part of this lease
    const isHost = lease.host._id.toString() === req.user._id.toString();
    const isTenant = lease.tenant._id.toString() === req.user._id.toString();
    
    if (!isHost && !isTenant) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (lease.renewalRequested) {
      return res.status(400).json({ success: false, message: 'Renewal already requested' });
    }

    lease.renewalRequested = true;
    lease.renewalRequestedBy = req.user._id;
    lease.renewalRequestedAt = new Date();
    await lease.save();

    // Create persistent notification for contract renewal
    const io = req.app.get('io');
    const notifyUserId = isHost ? lease.tenant._id : lease.host._id;
    const requesterName = isHost ? lease.host.name : lease.tenant.name;
    
    await notifyContractRenewal(io, {
      tenantId: isHost ? lease.tenant._id : lease.host._id,
      hostId: isHost ? lease.host._id : lease.tenant._id,
      hostName: requesterName,
      propertyTitle: lease.property?.title || 'Property',
      leaseId: lease._id,
      propertyId: lease.property?._id
    });

    res.json({ 
      success: true, 
      message: 'Renewal request submitted successfully',
      data: lease 
    });
  } catch (error) {
    console.error('Error requesting renewal:', error);
    res.status(500).json({ success: false, message: 'Failed to request renewal' });
  }
});

// DocuSign consent callback - for initial app authorization
router.get('/docusign/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    console.error('DocuSign consent error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/leases?docusign_error=${error}`);
  }
  
  if (code) {
    console.log('DocuSign consent granted! Authorization code received.');
    // The JWT grant doesn't need to exchange the code - consent is now granted
    // Future JWT authentication will work
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/leases?docusign_consent=success`);
  }
  
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/leases`);
});

// Get DocuSign consent URL (for admin to grant initial consent)
router.get('/docusign/consent-url', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  
  const consentUrl = `https://${process.env.DOCUSIGN_AUTH_SERVER || 'account-d.docusign.com'}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${process.env.DOCUSIGN_INTEGRATION_KEY}&redirect_uri=${encodeURIComponent(process.env.BACKEND_URL || 'http://localhost:5000')}/api/leases/docusign/callback`;
  
  res.json({
    success: true,
    data: {
      consentUrl,
      message: 'Visit this URL to grant DocuSign consent for the application'
    }
  });
});

export default router;
