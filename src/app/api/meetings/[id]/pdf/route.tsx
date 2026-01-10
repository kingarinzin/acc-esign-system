import path from "path";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { stat } from "fs/promises";
import { createReadStream } from "fs";
import { Readable } from "stream";

export const runtime = "nodejs";

function auth(req: Request) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(h.split(" ")[1], process.env.JWT_SECRET!) as any;
  } catch {
    return null;
  }
}

function safeRange(range: string, size: number) {
  const m = range.match(/bytes=(\d*)-(\d*)/);
  if (!m) return null;

  const start = m[1] ? parseInt(m[1], 10) : 0;
  const end = m[2] ? parseInt(m[2], 10) : size - 1;

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start > end || start < 0 || start >= size) return null;

  return { start, end: Math.min(end, size - 1) };
}

async function getMeetingPdfInfo(meetingId: string, organizerId: string) {
  const client = await clientPromise;
  const db = client.db("e_sign_db");

  const meeting = await db.collection("meetings").findOne(
    { _id: new ObjectId(meetingId), organizerId },
    { projection: { storedFileName: 1 } }
  );

  if (!meeting?.storedFileName) return null;

  const absolute = path.join(process.cwd(), "public", "uploads", String(meeting.storedFileName));
  const s = await stat(absolute);

  return { absolute, size: s.size };
}

export async function HEAD(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = auth(req);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const info = await getMeetingPdfInfo(id, user.id);
    if (!info) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(info.size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="document.pdf"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = auth(req);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let info: { absolute: string; size: number } | null = null;
  try {
    info = await getMeetingPdfInfo(id, user.id);
    if (!info) return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const range = req.headers.get("range");
  if (range) {
    const se = safeRange(range, info.size);
    if (!se) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${info.size}` },
      });
    }

    const { start, end } = se;
    const chunkSize = end - start + 1;

    const nodeStream = createReadStream(info.absolute, { start, end });
    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(chunkSize),
        "Content-Range": `bytes ${start}-${end}/${info.size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="document.pdf"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const nodeStream = createReadStream(info.absolute);
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(info.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="document.pdf"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = auth(req);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let info: { absolute: string; size: number } | null = null;
  try {
    info = await getMeetingPdfInfo(id, user.id);
    if (!info) return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Full-file stream only (no Range) — ideal for blob fetch
  const nodeStream = createReadStream(info.absolute);
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(info.size),
      "Cache-Control": "no-store",
      // you may REMOVE Content-Disposition entirely here to reduce download heuristics
      // "Content-Disposition": `inline; filename="document.pdf"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
