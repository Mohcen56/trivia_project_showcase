"use client";
import React, { useState } from "react";
import { logger } from "@/lib/utils/logger";
import { API_BASE_URL } from "@/lib/api/base";
import Image from "next/image";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Ensure API base is configured before attempting the request
    if (!API_BASE_URL) {
      setMessage("Service is temporarily unavailable. Please contact support.");
      return;
    }

    const baseUrl = API_BASE_URL.replace(/\/+$/, "");

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${baseUrl}/api/auth/password-reset/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();
      setMessage(data.detail || "Check your inbox for a reset link.");
    } catch (err) {
      logger.exception(err, { where: 'auth.forgotPassword.submit' });
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-md p-8 rounded-xl border bg-card shadow-lg">
        {/* Logo area */}
        <div className="flex justify-center mb-6">
            <Image
                  src="logo/mylogo.svg"
                  alt="Trivia Logo"
                  width={100}
                  height={100}
                  className="mx-auto"
                />
        </div>

        <h1 className="text-center text-3xl md:text-4xl font-light mb-3 text-foreground">
          Recover Password
        </h1>
        <p className="text-center text-muted-foreground mb-8 text-base md:text-lg">
          Enter your email to receive a reset link
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 active:scale-95 transform ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-cyan-700 text-primary-foreground hover:bg-cyan-800 hover:scale-105"
            }`}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p className="text-center text-sm mt-6 text-muted-foreground">
            {message}
          </p>
        )}

        <div className="border-t border-border pt-6 mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Remembered your password?{" "}
            <a
              href="/login"
              className="text-primary hover:underline hover:text-primary/80 transition-colors duration-200"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
