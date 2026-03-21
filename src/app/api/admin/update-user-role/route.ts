import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "UserId and role are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const usersCollection = db.collection("users");

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "No changes made" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Role updated successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}