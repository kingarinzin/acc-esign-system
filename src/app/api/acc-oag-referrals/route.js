import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

const COLLECTION_NAME = "acc_oag_referrals";

// ================= GET =================
export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const referrals = await db
      .collection(COLLECTION_NAME)
      .find()
      .sort({ referral_date: -1 })
      .toArray();

    return NextResponse.json(referrals);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ================= POST =================
export async function POST(req) {
  try {
    const { db } = await connectToDatabase();
    const data = await req.json();

    data.status = data.status || "Pending";

    // ensure accused_details exists
    if (!data.accused_details) {
      data.accused_details = [];
    }

    const result = await db.collection(COLLECTION_NAME).insertOne(data);

    return NextResponse.json(
      { ...data, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ================= PUT =================
export async function PUT(req) {
  try {
    const { db } = await connectToDatabase();
    const data = await req.json();

    const { _id, ...rest } = data;

    if (!_id) throw new Error("_id required");

    const { ObjectId } = await import("mongodb");

    const existing = await db
      .collection(COLLECTION_NAME)
      .findOne({ _id: new ObjectId(_id) });

    if (!existing) throw new Error("Record not found");

    const updated = {
      ...existing,
      ...rest,
      accused_details:
        rest.accused_details || existing.accused_details || [],
      updated_at: new Date(),
    };

    await db.collection(COLLECTION_NAME).updateOne(
      { _id: new ObjectId(_id) },
      { $set: updated }
    );

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ================= DELETE =================
export async function DELETE(req) {
  try {
    const { db } = await connectToDatabase();
    const { _id } = await req.json();

    if (!_id) throw new Error("_id required");

    const { ObjectId } = await import("mongodb");

    await db.collection(COLLECTION_NAME).deleteOne({
      _id: new ObjectId(_id),
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}