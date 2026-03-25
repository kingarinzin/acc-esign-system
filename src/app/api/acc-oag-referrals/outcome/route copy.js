import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";export async function PUT(req) {
  try {
    let user;

    try {
      user = verifyToken(req); // ✅ directly decoded
    } catch (err) {
      return NextResponse.json(
        { error: err.message },
        { status: 401 }
      );
    }

    const { _id, outcomeText, filePath } = await req.json();

    if (!_id) {
      return NextResponse.json(
        { error: "Case ID is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(_id)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const updateData = {
      outcome: {
        text: outcomeText || "",
        file: filePath || "",
        updated_by: user?.role || "OAG_USER", // ✅ FIX HERE
        updated_at: new Date(),
      },
    };

    const result = await db.collection("acc_oag_referrals").updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );

    console.log("Matched:", result.matchedCount);
    console.log("Modified:", result.modifiedCount);

    return NextResponse.json({
      message: "Outcome updated successfully",
      modifiedCount: result.modifiedCount,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}