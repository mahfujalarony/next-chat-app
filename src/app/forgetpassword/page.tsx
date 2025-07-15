"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email, {
        url: process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT_URL || "http://localhost:3000/login",
      });

      setMessage("A password reset link has been sent to your email. Please check your inbox.");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("The email address is invalid.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      console.error("Error in password reset:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 24, border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", boxShadow: "0 2px 8px #0001" }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, textAlign: "center" }}>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Email Address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
          style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 4, marginBottom: 16 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10, background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Sending..." : "Send Password Reset Email"}
        </button>
      </form>
      {message && <div style={{ color: "#16a34a", marginTop: 16, textAlign: "center" }}>{message}</div>}
      {error && <div style={{ color: "#dc2626", marginTop: 16, textAlign: "center" }}>{error}</div>}
    </div>
  );
}
