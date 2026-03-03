"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power, PowerOff, Trash2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface User {
  _id: string;
  firstName: string;
  cid: string;
  designation: string;
  phone: string;
  email: string;
  departmentName: string;
  divisionName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AllUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // JWT Verification & Fetch Users
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/all-users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          // Invalid or expired token
          localStorage.clear();
          router.push("/login?expired=true");
          return;
        }

        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [router]);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAction = async (userId: string, action: "toggleStatus" | "delete", currentStatus?: boolean) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("token");
      let url = "";
      let method: "POST" | "DELETE" = "POST";
      let body: any = {};

      if (action === "toggleStatus") {
        url = "/api/admin/toggle-user-status";
        body = { userId, isActive: !currentStatus };
      } else if (action === "delete") {
        url = `/api/admin/delete-user?userId=${userId}`;
        method = "DELETE";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: method === "POST" ? JSON.stringify(body) : undefined,
      });

      if (res.ok) {
        showNotification(action === "delete" ? "User deleted" : `User ${!currentStatus ? "activated" : "deactivated"}`, "success");
        // Refresh users
        const refreshed = await fetch("/api/admin/all-users", { headers: { Authorization: `Bearer ${token}` } });
        const data = await refreshed.json();
        setUsers(data.users || []);
      } else {
        const data = await res.json();
        showNotification(data.error || "Action failed", "error");
      }
    } catch {
      showNotification("Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/update-user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        showNotification("Role updated", "success");
        const refreshed = await fetch("/api/admin/all-users", { headers: { Authorization: `Bearer ${token}` } });
        const data = await refreshed.json();
        setUsers(data.users || []);
      } else {
        const data = await res.json();
        showNotification(data.error || "Failed to update role", "error");
      }
    } catch {
      showNotification("Failed to update role", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter & Pagination
  const filteredUsers = users.filter(
    (u) =>
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.cid.includes(search) ||
      u.departmentName.toLowerCase().includes(search.toLowerCase()) ||
      u.divisionName.toLowerCase().includes(search.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white z-50 transition-transform duration-300 ${
            notification.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {notification.message}
        </div>
      )}

      <Sidebar />

      <main className="flex-1 p-6 ml-64">
        <h1 className="text-3xl font-bold mb-2">All Users</h1>
        <p className="text-gray-600 mb-4">View and manage all registered users</p>

        {/* Search & Rows */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} className="border rounded px-2 py-1">
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto w-full bg-white shadow rounded-lg">
          {/* Desktop Table */}
          <table className="w-full table-auto min-w-full divide-y divide-gray-200 hidden md:table">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "CID", "Designation", "Phone", "Email", "Department", "Division", "Role", "Registered", "Actions"].map((col) => (
                  <th key={col} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{user.firstName}</td>
                    <td className="px-4 py-2">{user.cid}</td>
                    <td className="px-4 py-2">{user.designation}</td>
                    <td className="px-4 py-2">{user.phone}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.departmentName}</td>
                    <td className="px-4 py-2">{user.divisionName}</td>
                    <td className="px-4 py-2">
                      <select
                        value={user.role || "Officer"}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="border rounded px-2 py-1 text-xs w-full"
                      >
                        <option value="Officer">Officer</option>
                        <option value="DivisionHead">Division Head</option>
                        <option value="DepartmentHead">Department Head</option>
                        <option value="Commissioner">Commissioner</option>
                        <option value="Chairperson">Chairperson</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleAction(user._id, "toggleStatus", user.isActive)}
                        disabled={actionLoading === user._id}
                        className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition ${
                          user.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {actionLoading === user._id ? <Loader2 className="animate-spin" size={14} /> : user.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleAction(user._id, "delete")}
                        disabled={actionLoading === user._id}
                        className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-6 text-gray-500">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end items-center gap-4 mt-4 text-sm">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className={`font-semibold text-lg ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "hover:text-blue-600"}`}>&lt;</button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className={`font-semibold text-lg ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "hover:text-blue-600"}`}>&gt;</button>
          </div>
        )}
      </main>
    </div>
  );
}