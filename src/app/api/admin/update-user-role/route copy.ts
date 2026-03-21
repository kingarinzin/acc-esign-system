import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    // 🔐 1️⃣ Verify Token
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 🔐 2️⃣ Check Admin Role (UPDATED)
    // Instead of isAdmin flag, use role
    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // 📦 3️⃣ Parse Request Body
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // ✅ 4️⃣ Validate Role (UPDATED)
    const allowedRoles = ["ACC_USER", "OAG_USER", "RAA_USER", "ADMIN"];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        {
          error: `Invalid role. Allowed roles: ${allowedRoles.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 🔌 5️⃣ Connect DB
    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");

    // 🔍 6️⃣ Check User Exists
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🔄 7️⃣ Update Role
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Role updated to "${role}" successfully`,
    });

  } catch (error) {
    console.error("Update Role Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}