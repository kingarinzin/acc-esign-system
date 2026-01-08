import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];




export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const client = await clientPromise;
    const db = client.db("e_sign_db");

    const meetings = await db
      .collection("meetings")
      .find({ organizerId: decoded.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ meetings });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}





export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const formData = await req.formData();

    const dataRaw = formData.get("data");
    const file = formData.get("file") as File | null;

    if (!dataRaw || !file) {
      return NextResponse.json(
        { error: "Missing data or file" },
        { status: 400 }
      );
    }

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF or Word documents allowed" },
        { status: 400 }
      );
    }

    const data = JSON.parse(dataRaw.toString());
    const { title, date, description, participants, action } = data;

    if (!title || !description || !Array.isArray(participants)) {
      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const client = await clientPromise;
    const db = client.db("e_sign_db");

    const result = await db.collection("meetings").insertOne({
      title,
      date,
      description,
      participants: participants.map((p: any) => ({
        ...p,
        signed: false,
      })),
      fileName: file.name,
      filePath: `/uploads/${fileName}`,
      status: action === "prepare" ? "Prepared" : "Draft",
      organizerId: decoded.id,
      createdAt: new Date(),
    });

    return NextResponse.json({
      message:
        action === "prepare"
          ? "Meeting prepared"
          : "Meeting saved as draft",
      meetingId: result.insertedId,
    });
  } catch (err) {
    console.error("MEETING API ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
