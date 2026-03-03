import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
const nodemailer = require("nodemailer");

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

export async function POST(req: Request) {
  try {
    const {
      firstName,
      cid,          // <-- fixed here
      designation,
      phone,
      email,
      departmentId,
      divisionId,
      password,
    } = await req.json();

    // ===== Validation =====
    if (
      !firstName ||
      !cid ||
      !designation ||
      !phone ||
      !email ||
      !departmentId ||
      !divisionId ||
      !password
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("e_sign_db");
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      firstName,
      cid,           // <-- save lowercase
      designation,
      phone,
      email,
      departmentId,
      divisionId,
      password: hashedPassword,
      isAdmin: false,
      approvalStatus: "pending",
      createdAt: new Date(),
    };

    await users.insertOne(newUser);

    // ===== Email notification =====
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Registration Submitted - Pending Approval",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Registration Received</h2>
            <p>Hi ${firstName},</p>
            <p>Your account has been created and is currently <strong>pending approval</strong>.</p>
            <p>You will receive an email once an administrator approves your account.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              This is an automated message. Please do not reply.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send user notification email:", emailError);
    }

    return NextResponse.json({
      message: "Registration submitted. Await admin approval.",
      status: "pending",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}