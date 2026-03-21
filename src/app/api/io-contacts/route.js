import { NextResponse } from "next/server";
import mongoose from "mongoose";

// ================== DB CONNECTION ==================
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    throw new Error("Database connection failed");
  }
};

// ================== SCHEMA ==================
const IoContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone_number: { type: String, required: true },
    remarks: { type: String },
  },
  { timestamps: true }
);

// Prevent model overwrite
const IoContact =
  mongoose.models.IoContact ||
  mongoose.model("IoContact", IoContactSchema);

// ================== GET ==================
export async function GET() {
  try {
    await connectDB();
    const contacts = await IoContact.find().sort({ createdAt: -1 });

    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

// ================== POST ==================
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const newContact = await IoContact.create({
      name: body.name,
      phone_number: body.phone_number,
      remarks: body.remarks,
    });

    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create contact" },
      { status: 500 }
    );
  }
}

// ================== PUT ==================
export async function PUT(req) {
  try {
    await connectDB();
    const body = await req.json();

    const updated = await IoContact.findByIdAndUpdate(
      body._id,
      {
        name: body.name,
        phone_number: body.phone_number,
        remarks: body.remarks,
      },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update contact" },
      { status: 500 }
    );
  }
}

// ================== DELETE ==================
export async function DELETE(req) {
  try {
    await connectDB();
    const body = await req.json();

    await IoContact.findByIdAndDelete(body._id);

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete contact" },
      { status: 500 }
    );
  }
}