"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, FileText, LogOut, Shield, Settings, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    setIsAdmin(adminStatus);

    // Fetch user profile
    async function loadProfile() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.name || "");
          setUserEmail(data.email || "");
        }
      } catch (err) {
        console.error("Profile load error:", err);
      }
    }
    loadProfile();
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
    <aside className="w-64 bg-[#1a2b4a] shadow-lg h-screen fixed top-0 left-0 flex flex-col overflow-y-auto z-30">
      <div className="p-6 flex items-center justify-center">
        <img src="/logo.png" alt="e-Sign Logo" className="h-15 w-auto" />
      </div>

      {/* User Profile Circle */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {userEmail}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {!isAdmin && navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 font-medium text-sm transition ${
                isActive
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-[#2a3b5a]"
              }`}
            >
              <Icon size={18} />
              {item.name}
            </button>
          );
        })}

        {!isAdmin && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 font-medium text-sm text-red-400 hover:bg-[#2a3b5a] transition cursor-pointer"
          >
            <LogOut size={18} />
            Logout
          </button>
        )}
        
        {/* Admin Section */}
        {isAdmin && (
          <>
            <button
              onClick={() => router.push("/admin/pending-users")}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 font-medium text-sm transition ${
                pathname === "/admin/pending-users"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-[#2a3b5a]"
              }`}
            >
              <Shield size={18} />
              Pending Approvals
            </button>
            <button
              onClick={() => router.push("/admin/all-users")}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 font-medium text-sm transition ${
                pathname === "/admin/all-users"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-[#2a3b5a]"
              }`}
            >
              <Users size={18} />
              All Users
            </button>
            <button
              onClick={() => router.push("/settings")}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 font-medium text-sm transition ${
                pathname === "/settings"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-[#2a3b5a]"
              }`}
            >
              <Settings size={18} />
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 font-medium text-sm text-red-400 hover:bg-[#2a3b5a] transition cursor-pointer"
            >
              <LogOut size={18} />
              Logout
            </button>
          </>
        )}
      </nav>

      {/* Footer with Copyright */}
      <div className="p-4 border-t border-[#2a3b5a] mt-auto">
        <p className="text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} ANTI-CORRUPTION COMMISSION
        </p>
      </div>
    </aside>
  );
}
