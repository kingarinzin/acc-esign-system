import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
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

async function setupAdmin() {
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

    // Admin credentials
    const adminEmail = "admin@esign.com";
    const adminPassword = "Admin@123";
    const adminName = "System Admin";

    // Check if admin already exists
    const existingAdmin = await users.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists");
      
      // Update to ensure admin status
      await users.updateOne(
        { email: adminEmail },
        {
          $set: {
            isAdmin: true,
            isApproved: true,
            approvalStatus: "approved",
          }
        }
      );
      console.log("✅ Admin status confirmed");
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create admin user
      await users.insertOne({
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        isAdmin: true,
        isApproved: true,
        approvalStatus: "approved",
        createdAt: new Date(),
        signature: "",
        initials: "",
      });

      console.log("✅ Admin user created successfully!");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log("   ⚠️  Please change the password after first login");
    }

    console.log("\n🎉 Setup complete!");
    console.log("\nYou can now:");
    console.log("1. Login at http://localhost:3000/login");
    console.log("2. Access admin panel at http://localhost:3000/admin/pending-users");
  } catch (error) {
    console.error("❌ Error setting up admin:", error);
  } finally {
    await client.close();
  }
}

// Run the setup
setupAdmin();
