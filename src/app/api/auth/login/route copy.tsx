import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import nodemailer from "nodemailer";
// import { generateOTP, getOTPExpiry } from "@/lib/otp-helpers";

export const runtime = "nodejs";

/*
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
*/

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

    const user = await users.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Auto-approve existing users without approval status (backwards compatibility)
    if (!user.approvalStatus && !user.isApproved && !user.isAdmin) {
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            isApproved: true,
            approvalStatus: "approved",
          },
        }
      );
      user.isApproved = true;
      user.approvalStatus = "approved";
    }

    // Check approval status for new users
    if (user.approvalStatus === "pending") {
      return NextResponse.json(
        { error: "Your account is pending admin approval" },
        { status: 403 }
      );
    }

    if (user.approvalStatus === "rejected") {
      return NextResponse.json(
        { error: "Your account registration was not approved" },
        { status: 403 }
      );
    }

    if (!user.isApproved && !user.isAdmin) {
      return NextResponse.json(
        { error: "Your account is not approved yet" },
        { status: 403 }
      );
    }

    // Check if user is active (defaults to true for backward compatibility)
    if (user.isActive === false) {
      return NextResponse.json(
        {
          error:
            "Your account has been deactivated. Please contact the administrator.",
        },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ✅ Admin login (unchanged)
    if (user.isAdmin) {
      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, isAdmin: true },
        process.env.JWT_SECRET!,
        { expiresIn: "8h" }
      );

      return NextResponse.json({
        success: true,
        token,
        isAdmin: true,
        requiresOtp: false,
      });
    }

    /*
    // ❌ OTP FLOW DISABLED

    const otpCode = generateOTP();
    const otpExpiry = getOTPExpiry();

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          loginOtp: {
            code: otpCode,
            expiresAt: otpExpiry,
            attempts: 0,
          },
        },
      }
    );

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"E-Sign Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Login Verification Code",
      html: `...`,
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
      userId: user._id.toString(),
      email: user.email,
      requiresOtp: true,
    });
    */

    // ✅ Direct login for regular users (OTP removed)
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET!,
      { expiresIn: "8h" }
    );

    return NextResponse.json({
      success: true,
      token,
      isAdmin: user.isAdmin || false,
      requiresOtp: false,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}