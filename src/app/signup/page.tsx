"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SuccessModal from "@/components/SuccessModal";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Show success modal
        setShowSuccessModal(true);
      } else {
        setMessage(data.error || "Signup failed");
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
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 mt-1">Sign up to get started</p>
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
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            required
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00083d] transition"
          />
          <button
            type="submit"
            className="p-3 bg-[#00083d] text-white rounded-xl font-semibold hover:bg-[#00083d]/90 transition cursor-pointer"
          >
            Sign Up
          </button>
        </form>

        {/* Error message */}
        {message && <p className="text-center mt-4 text-red-500">{message}</p>}

        {/* Login link */}
        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <a 
            href={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"} 
            className="text-[#00083d] hover:underline"
          >
            Login
          </a>
        </p>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        title="Registration Submitted!"
        message="Your account has been sent for approval. You will receive an email notification once an administrator approves your account."
        onClose={() => {
          setShowSuccessModal(false);
          router.push("/login");
        }}
        buttonText="Go to Login"
      />
    </div>
  );
}
