import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(req) {
  try {
    const body = await req.json();

    console.log("👉 Incoming request body:", body); // ✅ DEBUG

    const { _id, status } = body;

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("acc_oag_referrals").updateOne(
      { _id: new ObjectId(_id) },
      { $set: { status } }
    );

    console.log("✅ Update result:", result); // ✅ DEBUG

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ FULL ERROR:", error); // 🔥 THIS IS KEY

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}