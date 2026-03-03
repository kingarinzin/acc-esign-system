"use client";

import { useRouter, usePathname } from "next/navigation";
import { Shield, Settings, Users, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [openMaster, setOpenMaster] = useState(true);
  const [openLeave, setOpenLeave] = useState(false);

  const [activeMenu, setActiveMenu] = useState("master");

  /* ================= Detect Route Changes ================= */

  useEffect(() => {
    if (pathname === "/admin/department" || pathname === "/division") {
      setActiveMenu("master");
      setOpenMaster(true);
    } else if (pathname === "/admin/pending-users") {
      setActiveMenu("pending");
      setOpenMaster(false);
    } else if (pathname === "/admin/all-users") {
      setActiveMenu("allUsers");
      setOpenMaster(false);
    } else if (pathname === "/settings") {
      setActiveMenu("settings");
      setOpenMaster(false);
    }
  }, [pathname]);

  /* ================= Load Profile ================= */

  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    setIsAdmin(adminStatus);

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

  /* ================= Logout ================= */

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-[#1a2b4a] h-screen fixed top-0 left-0 flex flex-col text-sm">
      {/* Logo */}
      <div className="p-6 flex justify-center">
        <img src="/logo.png" alt="Logo" className="h-14" />
      </div>

      {/* Profile */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {userName
              ? userName.charAt(0).toUpperCase()
              : userEmail.charAt(0)?.toUpperCase()}
          </div>
          <p className="text-white truncate">{userEmail}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {isAdmin && (
          <>
            {/* ===== MASTER ===== */}
            <div>
              <button
                onClick={() => {
                  setActiveMenu("master");
                  setOpenMaster(!openMaster);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition ${
                  activeMenu === "master"
                    ? "bg-blue-500 text-white"
                    : "text-gray-300 hover:bg-[#2a3b5a]"
                }`}
              >
                <Shield size={18} />
                Master
                <span className="ml-auto">{openMaster ? "▾" : "▸"}</span>
              </button>

              {openMaster && (
                <div className="ml-8 mt-1 space-y-1">
                  <button
                    onClick={() => router.push("/admin/department")}
                    className={`w-full text-left px-4 py-2 rounded transition ${
                      pathname === "/admin/department"
                        ? "bg-blue-500 text-white"
                        : "text-gray-300 hover:bg-[#2a3b5a]"
                    }`}
                  >
                    Department
                  </button>

                  <button
                    onClick={() => router.push("/division")}
                    className={`w-full text-left px-4 py-2 rounded transition ${
                      pathname === "/division"
                        ? "bg-blue-500 text-white"
                        : "text-gray-300 hover:bg-[#2a3b5a]"
                    }`}
                  >
                    Division
                  </button>
                </div>
              )}
            </div>

            {/* ===== LEAVE ===== */}
            <div>
              <button
                onClick={() => {
                  setActiveMenu("leave");
                  setOpenLeave(!openLeave);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition ${
                  activeMenu === "leave"
                    ? "bg-blue-500 text-white"
                    : "text-gray-300 hover:bg-[#2a3b5a]"
                }`}
              >
                <Shield size={18} />
                Leave
                <span className="ml-auto">{openLeave ? "▾" : "▸"}</span>
              </button>

              {openLeave && (
                <div className="ml-8 mt-1 space-y-1">
                  <button
                    onClick={() => router.push("/admin/leave-type")}
                    className="w-full text-left px-4 py-2 rounded text-gray-300 hover:bg-[#2a3b5a]"
                  >
                    Leave Type
                  </button>

                  <button
                    onClick={() => router.push("/admin/leave-balances")}
                    className="w-full text-left px-4 py-2 rounded text-gray-300 hover:bg-[#2a3b5a]"
                  >
                    Leave Balance
                  </button>
                </div>
              )}
            </div>

            {/* Pending */}
            <button
              onClick={() => router.push("/admin/pending-users")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition ${
                activeMenu === "pending"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-[#2a3b5a]"
              }`}
            >
              <Shield size={18} />
              Pending Approvals
            </button>

            {/* All Users */}
            <button
              onClick={() => router.push("/admin/all-users")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition ${
                activeMenu === "allUsers"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-[#2a3b5a]"
              }`}
            >
              <Users size={18} />
              All Users
            </button>

            {/* Settings */}
            <button
              onClick={() => router.push("/settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition ${
                activeMenu === "settings"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-[#2a3b5a]"
              }`}
            >
              <Settings size={18} />
              Settings
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-[#2a3b5a]"
            >
              <LogOut size={18} />
              Logout
            </button>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-[#2a3b5a] text-center text-xs text-gray-400">
        © {new Date().getFullYear()} ANTI-CORRUPTION COMMISSION
      </div>
    </aside>
  );
}