import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const role = decoded.role?.toLowerCase();
    const departmentId = decoded.departmentId;

    const client = await clientPromise;
    const db = client.db();

    let query: any = {};

    // ✅ Superadmin → all users
    if (role === "superadmin") {
      query = {};
    }

    // ✅ Admin → only same department
    else if (role === "admin") {
      if (!departmentId) {
        return NextResponse.json(
          { error: "Department not found in token" },
          { status: 403 }
        );
      }

      // ✅ STRING MATCH (IMPORTANT)
      query = { departmentId: departmentId.toString() };
    }

    else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("QUERY USED:", query);

    // ================= USERS =================
    const users = await db
      .collection("users")
      .find(query)
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray();

    // ================= LOOKUPS =================
    const departments = await db.collection("departments").find({}).toArray();
    const divisions = await db.collection("divisions").find({}).toArray();

    // ================= MAP =================
    const mappedUsers = users.map((u) => {
      const dept = departments.find(
        (d) => d._id.toString() === u.departmentId
      );

      const div = divisions.find(
        (d) => d._id.toString() === u.divisionId
      );

      return {
        _id: u._id.toString(),
        firstName: u.firstName || "-",
        cid: u.cid || "-",
        phone: u.phone || "-",
        email: u.email || "-",
        departmentName: dept?.name || "-",
        divisionName: div?.name || "-",
        role: u.role || (u.isAdmin ? "Admin" : "Normal User"),
        isActive: u.isActive !== undefined ? u.isActive : true,
        createdAt: u.createdAt
          ? new Date(u.createdAt).toISOString()
          : new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      users: mappedUsers,
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}