import cron from 'node-cron';
import Lease from '../models/Lease.js';
import Property from '../models/Property.js';
import { sendEmail } from '../utils/email.js';
import { notifyLeaseExpiring, notifyRentReminder } from '../utils/notifications.js';

// Store io reference for cron jobs
let ioInstance = null;

export const setIOInstance = (io) => {
  ioInstance = io;
};

export const startCronJobs = () => {
  // Check for lease renewals daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running lease renewal check...');
    
    try {
      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

      const expiringLeases = await Lease.find({
        status: 'active',
        endDate: { $lte: fourteenDaysFromNow, $gte: new Date() }
      }).populate('host tenant property');

      for (const lease of expiringLeases) {
        // Check if reminder already sent
        const reminderExists = lease.remindersSent.find(
          r => r.type === 'renewal' && 
          new Date(r.sentAt).toDateString() === new Date().toDateString()
        );

        if (!reminderExists) {
          const daysRemaining = Math.ceil((lease.endDate - new Date()) / (1000 * 60 * 60 * 24));
          
          // Create notifications for both host and tenant
          if (ioInstance) {
            await notifyLeaseExpiring(ioInstance, {
              userId: lease.host._id,
              daysRemaining,
              propertyTitle: lease.property.title,
              leaseId: lease._id,
              propertyId: lease.property._id
            });
            
            await notifyLeaseExpiring(ioInstance, {
              userId: lease.tenant._id,
              daysRemaining,
              propertyTitle: lease.property.title,
              leaseId: lease._id,
              propertyId: lease.property._id
            });
          }
          
          // Send renewal reminder to host
          await sendEmail({
            to: lease.host.email,
            subject: 'Lease Renewal Reminder - MeroGhar',
            html: `
              <h2>Lease Renewal Reminder</h2>
              <p>The lease for ${lease.property.title} is expiring on ${lease.endDate.toLocaleDateString()}.</p>
              <p>Please contact your tenant to discuss renewal.</p>
            `
          });

          // Send renewal reminder to tenant
          await sendEmail({
            to: lease.tenant.email,
            subject: 'Lease Renewal Reminder - MeroGhar',
            html: `
              <h2>Lease Renewal Reminder</h2>
              <p>Your lease for ${lease.property.title} is expiring on ${lease.endDate.toLocaleDateString()}.</p>
              <p>Please contact your host if you wish to renew.</p>
            `
          });

          lease.remindersSent.push({ type: 'renewal', sentAt: new Date() });
          await lease.save();
        }
      }
    } catch (error) {
      console.error('Lease renewal check error:', error);
    }
  });

  // Check for expired leases daily at 10 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('Running expired lease check...');
    
    try {
      const expiredLeases = await Lease.find({
        status: 'active',
        endDate: { $lt: new Date() }
      }).populate('property');

      for (const lease of expiredLeases) {
        lease.status = 'expired';
        await lease.save();

        // Update property status
        const property = await Property.findById(lease.property);
        property.status = 'inactive';
        property.currentLease = null;
        await property.save();
      }
    } catch (error) {
      console.error('Expired lease check error:', error);
    }
  });

  // Send reactivation reminders 7 days after expiry
  cron.schedule('0 11 * * *', async () => {
    console.log('Running reactivation reminder check...');
    
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const properties = await Property.find({
        status: 'inactive',
        updatedAt: { $lte: sevenDaysAgo }
      }).populate('host');

      for (const property of properties) {
        await sendEmail({
          to: property.host.email,
          subject: 'Reactivate Your Property - MeroGhar',
          html: `
            <h2>Reactivate Your Property</h2>
            <p>Your property "${property.title}" has been inactive for 7 days.</p>
            <p>Would you like to reactivate it for new tenants?</p>
          `
        });
      }
    } catch (error) {
      console.error('Reactivation reminder error:', error);
    }
  });

  // Auto-archive properties 30 days after expiry
  cron.schedule('0 12 * * *', async () => {
    console.log('Running auto-archive check...');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const propertiesToArchive = await Property.find({
        status: 'inactive',
        updatedAt: { $lte: thirtyDaysAgo }
      });

      for (const property of propertiesToArchive) {
        property.status = 'archived';
        await property.save();
      }

      console.log(`Archived ${propertiesToArchive.length} properties`);
    } catch (error) {
      console.error('Auto-archive error:', error);
    }
  });

  // Send rent reminders (5 days before due date)
  cron.schedule('0 9 * * *', async () => {
    console.log('Running rent reminder check...');
    
    try {
      const activeLeases = await Lease.find({
        status: 'active'
      }).populate('tenant host property');

      for (const lease of activeLeases) {
        // Calculate next rent due date (assuming monthly rent)
        const today = new Date();
        const dayOfMonth = lease.startDate.getDate();
        const dueDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
        
        if (dueDate < today) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilDue === 5) {
          // Create notification for rent reminder
          if (ioInstance) {
            await notifyRentReminder(ioInstance, {
              tenantId: lease.tenant._id,
              amount: lease.monthlyRent,
              dueDate,
              propertyTitle: lease.property.title,
              leaseId: lease._id,
              propertyId: lease.property._id
            });
          }
          
          await sendEmail({
            to: lease.tenant.email,
            subject: 'Rent Payment Reminder - MeroGhar',
            html: `
              <h2>Rent Payment Reminder</h2>
              <p>Your rent payment of NPR ${lease.monthlyRent} for ${lease.property.title} is due on ${dueDate.toLocaleDateString()}.</p>
              <p>Please make the payment on time.</p>
            `
          });
        }
      }
    } catch (error) {
      console.error('Rent reminder error:', error);
    }
  });

  console.log('Cron jobs started successfully');
};
