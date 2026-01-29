"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const returnTo = searchParams.get("returnTo");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAdmin", data.isAdmin ? "true" : "false");
        
        // Redirect admin to approval page, regular users to dashboard
        if (data.isAdmin) {
          router.push("/admin/pending-users");
        } else {
          router.push(returnTo || "/dashboard");
        }
      } else {
        setMessage(data.error || "Login failed");
      }
    } catch (err) {
      setMessage("Server error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#00083d]">
      {/* Card */}
      <div className="bg-white shadow-2xl border border-gray-200 rounded-3xl p-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <img src="/logo.png" alt="e-Sign Logo" className="h-16 w-auto" />
          <span className="text-3xl font-bold text-gray-800">e-Sign</span>
        </div>
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00083d] transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00083d] transition"
          />
          <button
            type="submit"
            className="p-3 bg-[#00083d] text-white rounded-xl font-semibold hover:bg-[#00083d]/90 transition cursor-pointer"
          >
            Login
          </button>
        </form>

        {/* Error message */}
        {message && <p className="text-center mt-4 text-red-500">{message}</p>}

        {/* Signup link */}
        <p className="text-center mt-6 text-sm text-gray-500">
          Don’t have an account?{" "}
          <a href="/signup" className="text-[#00083d] hover:underline">
            Sign Up
          </a>
        </p>
        {/* Copyright */}
        <p className="text-center mt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} Anti-Corruption Commission
        </p>      </div>
    </div>
  );
}
