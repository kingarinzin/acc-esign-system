"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Clock, Trash2, Power, PowerOff } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface User {
  _id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  isApproved: boolean;
  approvalStatus: string;
  isActive?: boolean;
  createdAt: string;
}

export default function AllUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    
    if (!token) {
      router.push("/login");
      return;
    }

    if (!isAdmin) {
      alert("Unauthorized: Admin access required");
      router.push("/dashboard");
      return;
    }

    fetchAllUsers();
  }, [router]);

  async function fetchAllUsers() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/all-users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        alert("Unauthorized: Admin access required");
        router.push("/dashboard");
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

  function getStatusBadge(user: User) {
    if (user.isAdmin) {
      return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">Admin</span>;
    }
    
    if (user.approvalStatus === 'approved') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium inline-flex items-center gap-1"><CheckCircle size={12} />Approved</span>;
    }
    
    if (user.approvalStatus === 'pending') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium inline-flex items-center gap-1"><Clock size={12} />Pending</span>;
    }
    
    if (user.approvalStatus === 'rejected') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium inline-flex items-center gap-1"><XCircle size={12} />Rejected</span>;
    }
    
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">Unknown</span>;
  }

  function getActivityBadge(user: User) {
    // Default to active if isActive is undefined (for backward compatibility)
    const isActive = user.isActive !== false;
    
    if (isActive) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium inline-flex items-center gap-1"><Power size={12} />Active</span>;
    }
    
    return <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-medium inline-flex items-center gap-1"><PowerOff size={12} />Inactive</span>;
  }

  async function handleToggleStatus(userId: string, currentStatus: boolean) {
    const newStatus = !currentStatus;
    
    if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this user?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/toggle-user-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, isActive: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update user status");
        return;
      }

      alert(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchAllUsers();
    } catch (err) {
      console.error("Failed to toggle user status:", err);
      alert("Failed to update user status");
    }
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (!confirm(`Are you sure you want to permanently delete user "${email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/delete-user?userId=${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete user");
        return;
      }

      alert("User deleted successfully");
      fetchAllUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">All Users</h1>
            <p className="text-gray-600 mt-2">View all registered users and their status</p>
          </div>

          {users.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No users found
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => {
                    const isActive = user.isActive !== false;
                    return (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{user.name || '-'}</td>
                        <td className="px-6 py-4 text-sm">{getStatusBadge(user)}</td>
                        <td className="px-6 py-4 text-sm">{getActivityBadge(user)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleStatus(user._id, isActive)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                isActive 
                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                              title={isActive ? 'Deactivate user' : 'Activate user'}
                            >
                              {isActive ? <PowerOff size={14} /> : <Power size={14} />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id, user.email)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
