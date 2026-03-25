import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
export const runtime = "nodejs";

export async function PUT(req) {
  try {
    // ✅ Verify JWT
    let user;
    try {
      user = verifyToken(req);
    } catch (err) {
      return NextResponse.json(
        { error: err.message },
        { status: 401 }
      );
    }

    // ✅ Parse FormData instead of JSON
    const formData = await req.formData();

    const _id = formData.get("_id");
    const outcomeText = formData.get("outcomeText");
    //const file = formData.get("file");   // for single file.
    const files = formData.getAll("file");


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

    let fileData = null;

    // ✅ Handle file upload
    let uploadedFiles = [];

      if (files && files.length > 0) {
        const uploadDir = path.join(process.cwd(), "public/uploads");

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (const file of files) {
          if (typeof file === "object") {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileName = `${Date.now()}-${file.name}`;
            const filePath = path.join(uploadDir, fileName);

            fs.writeFileSync(filePath, buffer);

            uploadedFiles.push({
              filename: file.name,
              path: `/uploads/${fileName}`,
            });
          }
        }
      }
    // ✅ Build update object
    const updateQuery = {
      $set: {
        "outcome.text": outcomeText || "",
        "outcome.updated_by": user?.role || "OAG_USER",
        "outcome.updated_at": new Date(),
      },
    };

    // ✅ If file exists → push into files array
    if (uploadedFiles.length > 0) {
  updateQuery.$push = {
    "outcome.files": {
      $each: uploadedFiles,
    },
  };
}

    const client = await clientPromise;
const db = client.db(); // or client.db("yourDatabaseName")
    const result = await db.collection("acc_oag_referrals").updateOne(
      { _id: new ObjectId(_id) },
      updateQuery
    );

    return NextResponse.json({
      message: "Outcome updated successfully",
      modifiedCount: result.modifiedCount,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}