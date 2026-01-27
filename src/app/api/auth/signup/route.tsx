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
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("e_sign_db");
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userName = email.split('@')[0];

    await users.insertOne({
      email,
      password: hashedPassword,
      name: userName,
      isAdmin: false,
      isApproved: false,
      approvalStatus: 'pending',
      createdAt: new Date(),
    });

    // Send notification to user
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Registration Submitted - Pending Approval",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Registration Received</h2>
            <p>Hi ${userName},</p>
            <p>Thank you for registering with E-Sign. Your account has been created and is currently <strong>pending approval</strong>.</p>
            <p>You will receive an email notification once an administrator reviews and approves your account.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send user notification email:", emailError);
    }

    return NextResponse.json({ 
      message: "Registration submitted. Please wait for admin approval. You will receive an email notification once approved.",
      status: "pending"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
