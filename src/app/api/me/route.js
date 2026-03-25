import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FETCH USER FROM DB
    const { db } = await connectToDatabase();

    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.id),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ RETURN REAL ROLE
    return NextResponse.json({
      id: user._id,
      email: user.email,
      role: user.role,   // ✅ FIXED
      isAdmin: user.isAdmin || false,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}