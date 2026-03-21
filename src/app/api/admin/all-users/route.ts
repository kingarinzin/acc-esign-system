import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(req) {
  try {
    // 🔐 1️⃣ Verify Admin
    const adminCheck = await verifyAdmin(req);

    if (!adminCheck.valid) {
      return NextResponse.json(
        { error: adminCheck.error || "Unauthorized" },
        { status: 403 }
      );
    }

    // 🔌 2️⃣ Connect DB
    const client = await clientPromise;
    const db = client.db("e_sign_db");

    // 📦 3️⃣ Fetch Data
    const allUsers = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
    const departments = await db.collection("departments").find({}).toArray();
    const divisions = await db.collection("divisions").find({}).toArray();

    // 🔄 4️⃣ Convert to Maps (performance optimization)
    const deptMap = new Map(
      departments.map((d) => [d._id.toString(), d.name])
    );

    const divMap = new Map(
      divisions.map((d) => [d._id.toString(), d.name])
    );

    // ✅ Valid roles
    const validRoles = ["ACC_USER", "OAG_USER", "RAA_USER", "ADMIN"];

    // 🔄 5️⃣ Transform Users
    const users = allUsers.map((u) => ({
      _id: u._id.toString(),
      firstName: u.firstName || u.name || "-",
      cid: u.cid || "-",
      phone: u.phone || "-",
      email: u.email || "-",

      departmentName:
        deptMap.get(u.departmentId?.toString()) || "-",

      divisionName:
        divMap.get(u.divisionId?.toString()) || "-",

      role: validRoles.includes(u.role) ? u.role : "ACC_USER",

      isAdmin: !!u.isAdmin, // optional (can be phased out later)

      isActive: u.isActive !== undefined ? u.isActive : true,

      createdAt: u.createdAt
        ? new Date(u.createdAt).toISOString()
        : new Date().toISOString(),
    }));

    // 📤 6️⃣ Return Response
    return NextResponse.json({ users });

  } catch (error) {
    console.error("Error fetching all users:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}