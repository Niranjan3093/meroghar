import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from './email.js';
import { getAppSettings } from './appSettings.js';

// Helper function to create and emit notification
export const createNotification = async (io, data) => {
  try {
    const notification = await Notification.createAndEmit(io, data);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

const sendAdminEmailAlert = async ({ subject, text, html, preferenceKey }) => {
  const settings = await getAppSettings();

  if (!settings.adminEmailNotifications?.[preferenceKey]) {
    return;
  }

  const admins = await User.find({ role: 'admin', isActive: true }).select('email');
  const recipients = [
    ...new Set([
      ...admins.map((admin) => admin.email).filter(Boolean),
      settings.adminNotificationEmail
    ].filter(Boolean))
  ];

  if (recipients.length === 0) {
    return;
  }

  for (const recipient of recipients) {
    await sendEmail({
      to: recipient,
      subject,
      text,
      html
    });
  }
};

// Notify host when someone sends a message
export const notifyNewMessage = async (io, { senderId, receiverId, senderName, propertyTitle, conversationId }) => {
  return createNotification(io, {
    recipient: receiverId,
    sender: senderId,
    type: 'message',
    title: 'New Message',
    message: `${senderName} sent you a message${propertyTitle ? ` about ${propertyTitle}` : ''}`,
    category: 'message',
    priority: 'medium',
    data: {
      conversationId,
      senderName
    }
  });
};

// Notify host when tenant requests a lease
export const notifyLeaseRequest = async (io, { hostId, tenantId, tenantName, propertyTitle, propertyId, leaseRequestId }) => {
  return createNotification(io, {
    recipient: hostId,
    sender: tenantId,
    type: 'lease_request',
    title: 'New Lease Request',
    message: `${tenantName} has requested to rent "${propertyTitle}"`,
    category: 'lease',
    priority: 'high',
    data: {
      propertyId,
      leaseRequestId,
      propertyTitle,
      senderName: tenantName,
      actionUrl: `/dashboard/lease-requests`
    }
  });
};

// Notify tenant when host accepts/rejects lease request
export const notifyLeaseRequestResponse = async (io, { tenantId, hostId, hostName, propertyTitle, propertyId, leaseRequestId, approved }) => {
  return createNotification(io, {
    recipient: tenantId,
    sender: hostId,
    type: approved ? 'lease_request_approved' : 'lease_request_rejected',
    title: approved ? 'Lease Request Approved!' : 'Lease Request Rejected',
    message: approved 
      ? `Your lease request for "${propertyTitle}" has been approved. Please pay the security deposit to proceed.`
      : `Your lease request for "${propertyTitle}" has been rejected.`,
    category: 'lease',
    priority: 'high',
    data: {
      propertyId,
      leaseRequestId,
      propertyTitle,
      senderName: hostName,
      actionUrl: approved ? `/dashboard/lease-requests` : '/properties'
    }
  });
};

// Notify host when tenant pays rent
export const notifyRentPayment = async (io, { hostId, tenantId, tenantName, amount, propertyTitle, paymentId, propertyId }) => {
  return createNotification(io, {
    recipient: hostId,
    sender: tenantId,
    type: 'rent_payment',
    title: 'Rent Payment Received',
    message: `${tenantName} paid NPR ${amount.toLocaleString()} for "${propertyTitle}"`,
    category: 'payment',
    priority: 'medium',
    data: {
      paymentId,
      propertyId,
      amount,
      propertyTitle,
      senderName: tenantName,
      actionUrl: '/dashboard/payments'
    }
  });
};

// Notify host when tenant requests maintenance
export const notifyMaintenanceRequest = async (io, { hostId, tenantId, tenantName, title, propertyTitle, maintenanceId, propertyId, priority }) => {
  return createNotification(io, {
    recipient: hostId,
    sender: tenantId,
    type: 'maintenance_request',
    title: 'New Maintenance Request',
    message: `${tenantName} reported "${title}" at "${propertyTitle}"`,
    category: 'maintenance',
    priority: priority === 'emergency' ? 'urgent' : priority === 'high' ? 'high' : 'medium',
    data: {
      maintenanceId,
      propertyId,
      propertyTitle,
      senderName: tenantName,
      actionUrl: '/dashboard/maintenance'
    }
  });
};

// Notify tenant when maintenance is resolved
export const notifyMaintenanceResolved = async (io, { tenantId, hostId, hostName, title, propertyTitle, maintenanceId, propertyId }) => {
  return createNotification(io, {
    recipient: tenantId,
    sender: hostId,
    type: 'maintenance_resolved',
    title: 'Maintenance Resolved',
    message: `"${title}" at "${propertyTitle}" has been resolved`,
    category: 'maintenance',
    priority: 'medium',
    data: {
      maintenanceId,
      propertyId,
      propertyTitle,
      senderName: hostName,
      actionUrl: '/dashboard/maintenance'
    }
  });
};

// Notify tenant when maintenance status changes
export const notifyMaintenanceUpdate = async (io, { tenantId, hostId, hostName, title, status, propertyTitle, maintenanceId, propertyId }) => {
  return createNotification(io, {
    recipient: tenantId,
    sender: hostId,
    type: 'maintenance_update',
    title: 'Maintenance Update',
    message: `"${title}" status changed to "${status}"`,
    category: 'maintenance',
    priority: 'low',
    data: {
      maintenanceId,
      propertyId,
      propertyTitle,
      senderName: hostName,
      actionUrl: '/dashboard/maintenance'
    }
  });
};

// Notify about expiring lease (for cron job)
export const notifyLeaseExpiring = async (io, { userId, daysRemaining, propertyTitle, leaseId, propertyId }) => {
  return createNotification(io, {
    recipient: userId,
    type: 'lease_expiring',
    title: 'Lease Expiring Soon',
    message: `Your lease for "${propertyTitle}" expires in ${daysRemaining} days`,
    category: 'lease',
    priority: daysRemaining <= 7 ? 'high' : 'medium',
    data: {
      leaseId,
      propertyId,
      propertyTitle,
      actionUrl: '/dashboard/leases'
    }
  });
};

// Notify tenant about contract renewal request from host
export const notifyContractRenewal = async (io, { tenantId, hostId, hostName, propertyTitle, leaseId, propertyId }) => {
  return createNotification(io, {
    recipient: tenantId,
    sender: hostId,
    type: 'contract_renewal',
    title: 'Contract Renewal Request',
    message: `${hostName} has requested to renew your lease for "${propertyTitle}"`,
    category: 'lease',
    priority: 'high',
    data: {
      leaseId,
      propertyId,
      propertyTitle,
      senderName: hostName,
      actionUrl: '/dashboard/leases'
    }
  });
};

// Notify about rent reminder (for cron job)
export const notifyRentReminder = async (io, { tenantId, amount, dueDate, propertyTitle, leaseId, propertyId }) => {
  return createNotification(io, {
    recipient: tenantId,
    type: 'rent_reminder',
    title: 'Rent Payment Due',
    message: `Your rent of NPR ${amount.toLocaleString()} for "${propertyTitle}" is due`,
    category: 'payment',
    priority: 'high',
    data: {
      leaseId,
      propertyId,
      amount,
      propertyTitle,
      actionUrl: '/dashboard/payments'
    }
  });
};

// Notify host when property is approved
export const notifyPropertyApproved = async (io, { hostId, propertyTitle, propertyId }) => {
  return createNotification(io, {
    recipient: hostId,
    type: 'property_approved',
    title: 'Property Approved!',
    message: `Your property "${propertyTitle}" has been approved and is now live`,
    category: 'admin',
    priority: 'high',
    data: {
      propertyId,
      propertyTitle,
      actionUrl: `/properties/${propertyId}`
    }
  });
};

// Notify host when property is rejected
export const notifyPropertyRejected = async (io, { hostId, propertyTitle, propertyId, reason }) => {
  return createNotification(io, {
    recipient: hostId,
    type: 'property_rejected',
    title: 'Property Rejected',
    message: `Your property "${propertyTitle}" was rejected. Reason: ${reason || 'Not specified'}`,
    category: 'admin',
    priority: 'high',
    data: {
      propertyId,
      propertyTitle,
      actionUrl: '/dashboard/host/properties'
    }
  });
};

// Notify admin when new user registers
export const notifyNewUserRegistration = async (io, { userId, userName, userEmail }) => {
  try {
    // Find all admins
    const admins = await User.find({ role: 'admin', isActive: true });
    
    for (const admin of admins) {
      await createNotification(io, {
        recipient: admin._id,
        sender: userId,
        type: 'new_user',
        title: 'New User Registration',
        message: `${userName} (${userEmail}) has registered`,
        category: 'admin',
        priority: 'low',
        data: {
          userId,
          senderName: userName,
          actionUrl: '/admin/users'
        }
      });
    }

    await sendAdminEmailAlert({
      preferenceKey: 'newUserRegistration',
      subject: 'New User Registration Alert',
      text: `${userName} (${userEmail}) has registered on the platform.`,
      html: `<p><strong>${userName}</strong> (${userEmail}) has registered on the platform.</p>`
    });
  } catch (error) {
    console.error('Error notifying admins about new user:', error);
  }
};

// Notify admin when property needs approval
export const notifyPendingProperty = async (io, { hostId, hostName, propertyTitle, propertyId }) => {
  try {
    // Find all admins
    const admins = await User.find({ role: 'admin', isActive: true });
    
    for (const admin of admins) {
      await createNotification(io, {
        recipient: admin._id,
        sender: hostId,
        type: 'pending_property',
        title: 'Property Pending Approval',
        message: `${hostName} submitted "${propertyTitle}" for approval`,
        category: 'admin',
        priority: 'medium',
        data: {
          propertyId,
          propertyTitle,
          senderName: hostName,
          actionUrl: '/admin/properties'
        }
      });
    }

    await sendAdminEmailAlert({
      preferenceKey: 'propertyPendingApproval',
      subject: 'Property Pending Approval',
      text: `${hostName} submitted "${propertyTitle}" for approval.`,
      html: `<p><strong>${hostName}</strong> submitted <strong>${propertyTitle}</strong> for approval.</p>`
    });
  } catch (error) {
    console.error('Error notifying admins about pending property:', error);
  }
};

// Send admin warning to user
export const sendAdminWarning = async (io, { userId, adminId, title, message }) => {
  return createNotification(io, {
    recipient: userId,
    sender: adminId,
    type: 'warning',
    title: title || 'Warning from Admin',
    message,
    category: 'admin',
    priority: 'urgent',
    data: {
      actionUrl: '/dashboard'
    }
  });
};

// Notify host when they receive a review
export const notifyNewReview = async (io, { hostId, reviewerId, reviewerName, propertyTitle, propertyId, rating }) => {
  return createNotification(io, {
    recipient: hostId,
    sender: reviewerId,
    type: 'review_received',
    title: 'New Review',
    message: `${reviewerName} left a ${rating}-star review for "${propertyTitle}"`,
    category: 'system',
    priority: 'low',
    data: {
      propertyId,
      propertyTitle,
      senderName: reviewerName,
      actionUrl: `/properties/${propertyId}`
    }
  });
};

// Notify when lease is signed
export const notifyLeaseSigned = async (io, { recipientId, signerId, signerName, propertyTitle, leaseId, propertyId }) => {
  return createNotification(io, {
    recipient: recipientId,
    sender: signerId,
    type: 'lease_signed',
    title: 'Lease Signed',
    message: `${signerName} has signed the lease for "${propertyTitle}"`,
    category: 'lease',
    priority: 'high',
    data: {
      leaseId,
      propertyId,
      propertyTitle,
      senderName: signerName,
      actionUrl: `/dashboard/leases/${leaseId}`
    }
  });
};

// Notify host when tenant requests a visit sitting
export const notifyHostVisitRequest = async (io, { hostId, tenantName, propertyTitle, visitDate, visitTime, visitSittingId }) => {
  return createNotification(io, {
    recipient: hostId,
    type: 'visit_sitting_request',
    title: 'New Visit Sitting Request',
    message: `${tenantName} has requested to visit "${propertyTitle}" on ${new Date(visitDate).toLocaleDateString()} at ${visitTime}`,
    category: 'visit',
    priority: 'medium',
    data: {
      visitSittingId,
      propertyTitle,
      tenantName,
      visitDate: new Date(visitDate).toLocaleDateString(),
      visitTime,
      actionUrl: '/dashboard/visit-requests'
    }
  });
};

// Notify tenant when host approves their visit sitting request
export const notifyTenantVisitApproval = async (io, { tenantId, hostName, propertyTitle, visitDate, visitTime }) => {
  return createNotification(io, {
    recipient: tenantId,
    type: 'visit_sitting_approved',
    title: 'Visit Sitting Approved!',
    message: `${hostName} has approved your visit for "${propertyTitle}" on ${new Date(visitDate).toLocaleDateString()} at ${visitTime}`,
    category: 'visit',
    priority: 'high',
    data: {
      propertyTitle,
      hostName,
      visitDate: new Date(visitDate).toLocaleDateString(),
      visitTime,
      actionUrl: '/dashboard/messages'
    }
  });
};
