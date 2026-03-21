"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power, PowerOff, Trash2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface User {
  _id: string;
  firstName: string;
  cid: string;
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

  // ================= Load Users =================
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

  // ================= Notification =================
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ================= User Actions =================
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
    if (!newRole) return;
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

  // ================= Filter & Pagination =================
  const filteredUsers = users.filter(
    (u) =>
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.cid.includes(search) ||
      u.departmentName.toLowerCase().includes(search.toLowerCase()) ||
      u.divisionName.toLowerCase().includes(search.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {notification && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white z-50 ${
            notification.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {notification.message}
        </div>
      )}

      <Sidebar />

      <main className="flex-1 p-6 ml-64">
        <h1 className="text-3xl font-bold mb-4">All Users</h1>

        <input
          type="text"
          placeholder="Search users..."
          className="mb-4 border px-3 py-2 rounded w-full max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="w-full table-auto divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "CID", "Phone", "Email", "Department", "Division", "Role", "Registered", "Actions"].map(
                  (col) => (
                    <th key={col} className="px-4 py-2 text-left text-xs font-medium uppercase">
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {paginatedUsers.length ? (
                paginatedUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-4 py-2">{user.firstName}</td>
                    <td className="px-4 py-2">{user.cid}</td>
                    <td className="px-4 py-2">{user.phone}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.departmentName}</td>
                    <td className="px-4 py-2">{user.divisionName}</td>
                    <td className="px-4 py-2">
                      <select
                        value={user.role || "Normal User"}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="border rounded px-2 py-1 text-xs w-full"
                      >
                        <option value="Normal User">Normal User</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button onClick={() => handleAction(user._id, "toggleStatus", user.isActive)}>
                        {user.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                      <button onClick={() => handleAction(user._id, "delete")}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {Math.ceil(filteredUsers.length / rowsPerPage) || 1}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(Math.ceil(filteredUsers.length / rowsPerPage), currentPage + 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === Math.ceil(filteredUsers.length / rowsPerPage)}
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}