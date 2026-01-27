"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, FileText, LogOut, Shield, Settings, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    setIsAdmin(adminStatus);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      name: "Document List",
      icon: FileText,
      path: "/dashboard/documents",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg h-screen fixed top-0 left-0 flex flex-col overflow-y-auto">
      <div className="p-6 shadow-sm flex items-center justify-center">
        <img src="/logo.png" alt="e-Sign Logo" className="h-11 w-auto" />
      </div>
      <nav className="flex-1  p-4 space-y-2">
        {!isAdmin && navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={18} />
              {item.name}
            </button>
          );
        })}
        
        {/* Admin Section */}
        {isAdmin && (
          <>
            <button
              onClick={() => router.push("/admin/pending-users")}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition ${
                pathname === "/admin/pending-users"
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Shield size={18} />
              Pending Approvals
            </button>
            <button
              onClick={() => router.push("/admin/all-users")}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition ${
                pathname === "/admin/all-users"
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users size={18} />
              All Users
            </button>
            <button
              onClick={() => router.push("/settings")}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition ${
                pathname === "/settings"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Settings size={18} />
              Settings
            </button>
          </>
        )}
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm text-red-600 hover:bg-red-50 transition cursor-pointer"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
