import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    // 🔐 1️⃣ Verify Token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    if (!decoded.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const allowedRoles = [
      "Officer",
      "DivisionHead",
      "DepartmentHead",
      "Commissioner",
      "Chairperson",
    ];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ==============================
    // ✅ 2️⃣ Chairperson Restriction
    // ==============================
    if (role === "Chairperson") {
      const existingChair = await usersCollection.findOne({
        role: "Chairperson",
        _id: { $ne: new ObjectId(userId) },
      });

      if (existingChair) {
        return NextResponse.json(
          { error: "Only one Chairperson allowed" },
          { status: 400 }
        );
      }
    }

    // ==================================
    // ✅ 3️⃣ Division Head Restriction
    // ==================================
    if (role === "DivisionHead") {
      if (!user.divisionId) {
        return NextResponse.json(
          { error: "User must belong to a division" },
          { status: 400 }
        );
      }

      const existingDivisionHead = await usersCollection.findOne({
        role: "DivisionHead",
        divisionId: user.divisionId,
        _id: { $ne: new ObjectId(userId) },
      });

      if (existingDivisionHead) {
        return NextResponse.json(
          { error: "Division already has a Division Head" },
          { status: 400 }
        );
      }
    }

    // ==================================
    // ✅ 4️⃣ Department Head Restriction
    // ==================================
    if (role === "DepartmentHead") {
      if (!user.departmentId) {
        return NextResponse.json(
          { error: "User must belong to a department" },
          { status: 400 }
        );
      }

      const existingDeptHead = await usersCollection.findOne({
        role: "DepartmentHead",
        departmentId: user.departmentId,
        _id: { $ne: new ObjectId(userId) },
      });

      if (existingDeptHead) {
        return NextResponse.json(
          { error: "Department already has a Department Head" },
          { status: 400 }
        );
      }
    }

    // ==================================
    // ✅ 5️⃣ Maximum 2 Commissioners
    // ==================================
    if (role === "Commissioner") {
      const commissionerCount = await usersCollection.countDocuments({
        role: "Commissioner",
      });

      // If user is already commissioner, allow
      if (user.role !== "Commissioner" && commissionerCount >= 2) {
        return NextResponse.json(
          { error: "Maximum 2 Commissioners allowed" },
          { status: 400 }
        );
      }
    }

    // ==================================
    // ✅ 6️⃣ Update Role
    // ==================================
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Role updated successfully",
    });
  } catch (error) {
    console.error("Update Role Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}