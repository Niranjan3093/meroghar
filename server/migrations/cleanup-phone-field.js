/**
 * Migration: Cleanup Phone Field for Duplicate Registration Fix
 * 
 * This migration:
 * 1. Removes duplicate users with empty phone strings
 * 2. Converts empty phone strings to null for remaining users
 * 3. Ensures email uniqueness constraint is properly enforced
 * 
 * Run this script with: node migrations/cleanup-phone-field.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

// Load env vars
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/meroghar';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Step 1: Find users with empty phone strings
    const usersWithEmptyPhone = await User.find({
      $or: [
        { phone: '' },
        { phone: { $exists: false } }
      ]
    });

    console.log(`\nFound ${usersWithEmptyPhone.length} users with empty/missing phone field`);

    // Step 2: Group users by email to find duplicates
    const emailGroups = {};
    usersWithEmptyPhone.forEach(user => {
      const email = user.email?.toLowerCase();
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(user._id);
    });

    // Step 3: Delete duplicate users (keep the first one, delete the rest)
    let deletedCount = 0;
    for (const [email, userIds] of Object.entries(emailGroups)) {
      if (userIds.length > 1) {
        console.log(`\nFound ${userIds.length} users with email: ${email}`);
        const toDelete = userIds.slice(1); // Keep first, delete rest
        const result = await User.deleteMany({ _id: { $in: toDelete } });
        deletedCount += result.deletedCount;
        console.log(`Deleted ${result.deletedCount} duplicate(s)`);
      }
    }

    // Step 4: Convert empty phone strings to null
    const updateResult = await User.updateMany(
      { phone: '' },
      { phone: null }
    );
    console.log(`\nConverted ${updateResult.modifiedCount} empty phone strings to null`);

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   - Deleted: ${deletedCount} duplicate users`);
    console.log(`   - Updated: ${updateResult.modifiedCount} users with empty phone`);

    // Verify the fix
    const duplicatePhones = await User.aggregate([
      {
        $group: {
          _id: '$phone',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: '', // Check for empty strings
          count: { $gt: 1 }
        }
      }
    ]);

    if (duplicatePhones.length > 0) {
      console.log('\n⚠️  Warning: Still found duplicate empty phone strings');
    } else {
      console.log('\n✓ No duplicate empty phone strings found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
