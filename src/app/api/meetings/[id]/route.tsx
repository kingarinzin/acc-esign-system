// src/app/api/meetings/[id]/route.tsx
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import formidable from "formidable-serverless";
import fs from "fs";
import path from "path";

// Allowed file types
const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Helper: authenticate user from Bearer token
async function authenticate(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.split(" ")[1];
  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    throw new Error("Invalid token");
  }
  return decoded;
}

// GET /api/meetings/:id
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const decoded = await authenticate(req);

    const client = await clientPromise;
    const db = client.db("e_sign_db");

    const meeting = await db.collection("meetings").findOne({
      _id: new ObjectId(id),
      organizerId: decoded.id,
    });

    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    return NextResponse.json({ meeting });
  } catch (err: any) {
    console.error("MEETING GET ERROR:", err);
    const status = err.message === "Unauthorized" || err.message === "Invalid token" ? 401 : 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}

// PUT /api/meetings/:id
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const decoded = await authenticate(req);

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const form = new formidable.IncomingForm({
      uploadDir,
      keepExtensions: true,
      multiples: false,
    });

    const { fields, files }: any = await new Promise((resolve, reject) => {
      form.parse(req as any, (err: any, fields: any, files: any) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    if (!fields.data) {
      return NextResponse.json({ error: "Missing form data" }, { status: 400 });
    }

    const parsedData = JSON.parse(fields.data);
    const { title, date, description, participants, action } = parsedData;

    if (!title || !date || !description || !Array.isArray(participants)) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const uploadedFile = files.file;
    let fileData: { fileName?: string; filePath?: string } = {};

    if (uploadedFile) {
      if (!allowedMimeTypes.includes(uploadedFile.mimetype)) {
        return NextResponse.json(
          { error: "Only PDF or Word documents are allowed" },
          { status: 400 }
        );
      }
      fileData = {
        fileName: uploadedFile.originalFilename,
        filePath: `/uploads/${uploadedFile.newFilename}`,
      };
    }

    const client = await clientPromise;
    const db = client.db("e_sign_db");

    const result = await db.collection("meetings").updateOne(
      { _id: new ObjectId(id), organizerId: decoded.id },
      {
        $set: {
          title,
          date,
          description,
          participants: participants.map((p: any) => ({ ...p, signed: false })),
          status: action === "prepare" ? "Prepared" : "Draft",
          ...fileData,
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: action === "prepare" ? "Meeting prepared successfully" : "Draft updated",
      meetingId: id,
    });
  } catch (err: any) {
    console.error("MEETING PUT ERROR:", err);
    const status = err.message === "Unauthorized" || err.message === "Invalid token" ? 401 : 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}

// DELETE /api/meetings/:id
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const decoded = await authenticate(req);

    const client = await clientPromise;
    const db = client.db("e_sign_db");

    const result = await db.collection("meetings").deleteOne({
      _id: new ObjectId(id),
      organizerId: decoded.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Meeting deleted successfully" });
  } catch (err: any) {
    console.error("MEETING DELETE ERROR:", err);
    const status = err.message === "Unauthorized" || err.message === "Invalid token" ? 401 : 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
