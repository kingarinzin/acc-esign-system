import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

async function migrateExistingUsers() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error("❌ MONGODB_URI not found in environment variables");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("e_sign_db");
    const users = db.collection("users");

    // Find users without approval status (existing users from before the system)
    const usersToUpdate = await users.find({
      approvalStatus: { $exists: false }
    }).toArray();

    if (usersToUpdate.length === 0) {
      console.log("✅ No users need migration - all users have approval status");
      return;
    }

    console.log(`\n📋 Found ${usersToUpdate.length} user(s) without approval status`);
    
    // Update all existing users to be approved (except if they're already admin)
    const result = await users.updateMany(
      { 
        approvalStatus: { $exists: false },
        isAdmin: { $ne: true }
      },
      {
        $set: {
          isApproved: true,
          approvalStatus: "approved",
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} user(s) to approved status`);
    console.log("\n🎉 Migration complete! All existing users can now login.");
    
    // Show updated users
    if (usersToUpdate.length > 0) {
      console.log("\nUpdated users:");
      usersToUpdate.forEach(user => {
        console.log(`  - ${user.email}${user.isAdmin ? ' (admin)' : ''}`);
      });
    }
  } catch (error) {
    console.error("❌ Error migrating users:", error);
  } finally {
    await client.close();
  }
}

// Run the migration
migrateExistingUsers();
