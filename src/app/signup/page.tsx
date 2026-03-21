"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SuccessModal from "@/components/SuccessModal";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  // ================= STATE =================
  const [firstName, setFirstName] = useState("");
  const [cid, setCid] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [departmentId, setDepartmentId] = useState("");
  const [divisionId, setDivisionId] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [departments, setDepartments] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);

  const [message, setMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ================= FETCH DEPARTMENTS =================
  useEffect(() => {
    const fetchDepartments = async () => {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (Array.isArray(data)) setDepartments(data);
    };
    fetchDepartments();
  }, []);

  // ================= FETCH DIVISIONS =================
  useEffect(() => {
    const fetchDivisions = async () => {
      if (!departmentId) {
        setDivisions([]);
        setDivisionId("");
        return;
      }

      const res = await fetch("/api/divisions");
      const data = await res.json();

      // filter by department
      const filtered = data.filter(
        (div: any) => div.departmentId?._id === departmentId
      );

      setDivisions(filtered);
      setDivisionId("");
    };

    fetchDivisions();
  }, [departmentId]);

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (
      !firstName ||
      !cid ||
      !phone ||
      !email ||
      !departmentId ||
      !divisionId
    ) {
      setMessage("All fields are required");
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          cid,
          phone,
          email,
          departmentId,
          divisionId,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowSuccessModal(true);
      } else {
        setMessage(data.error || "Signup failed");
      }
    } catch (err) {
      setMessage("Server error");
    }
  };

  // ================= UI =================
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#00083d]">
      <div className="bg-white shadow-2xl border border-gray-200 rounded-3xl p-10 w-full max-w-md overflow-y-auto max-h-[95vh]">

        {/* Logo */}
        <div className="flex justify-center items-center mb-6">
          <img src="/logo.png" alt="e-Sign Logo" className="h-16 w-auto" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 mt-1">Sign up to get started</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>

          {/* ===== PERSONAL INFORMATION ===== */}
          <h2 className="text-sm font-semibold text-gray-500 mt-2">
            Personal Information
          </h2>

          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="input"
          />

          <input
            type="text"
            placeholder="CID Number"
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            className="input"
          />

          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />

          {/* ===== ORGANIZATION ===== */}
          <h2 className="text-sm font-semibold text-gray-500 mt-4">
            Organization Details
          </h2>

          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="input"
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value)}
            disabled={!departmentId}
            className="input"
          >
            <option value="">Select Division</option>
            {divisions.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* ===== SECURITY ===== */}
          <h2 className="text-sm font-semibold text-gray-500 mt-4">
            Account Security
          </h2>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
          />

          <button
            type="submit"
            className="p-3 bg-[#00083d] text-white rounded-xl font-semibold hover:bg-[#00083d]/90 transition"
          >
            Sign Up
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-red-500">{message}</p>
        )}

        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-[#00083d] hover:underline">
            Login
          </a>
        </p>

        <p className="text-center mt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} Anti-Corruption Commission
        </p>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        title="Registration Submitted!"
        message="Your account has been sent for approval. You will receive an email notification once approved."
        onClose={() => {
          setShowSuccessModal(false);
          router.push("/login");
        }}
        buttonText="Go to Login"
      />

      {/* Tailwind input reuse */}
      <style jsx>{`
        .input {
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          outline: none;
        }
        .input:focus {
          ring: 2px;
          border-color: #00083d;
        }
      `}</style>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#00083d]">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}