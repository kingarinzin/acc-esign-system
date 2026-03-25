import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import path from "path";
import { ObjectId } from "mongodb";
import fs from "fs";

export async function POST(req) {
  try {
    const { referralId, filePath } = await req.json();

    if (!referralId || !filePath) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Remove file from MongoDB array
    await db.collection("acc_oag_referrals").updateOne(
      { _id: new ObjectId(referralId) },
      {
        $pull: {
          "outcome.files": { path: filePath },
        },
      }
    );

    // 2. Delete file from filesystem
    const fullPath = path.join(process.cwd(), "public", filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    return NextResponse.json({
      message: "File deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}