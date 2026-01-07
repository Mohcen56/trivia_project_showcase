"use client";
import React, { useState} from "react";
import { resetPasswordAction } from "@/lib/auth/actions";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

const ResetPassword = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!uid || !token) {
      setMessage("Invalid or missing reset link.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await resetPasswordAction(uid, token, password);
      
      if (result.success) {
        setSuccess(true);
        setMessage(result.message || "Password reset successfully!");
        // Redirect after 3s
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setMessage(result.error || "Something went wrong. Please try again.");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="p-8 rounded-xl border max-w-md w-full relative z-10 transform transition-all duration-300 hover:border-primary/50">
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
        <h1 className="text-foreground text-3xl md:text-4xl font-light mb-3 text-center tracking-tight">
          Reset Password
        </h1>
        <p className="text-muted-foreground text-base md:text-lg mb-8 text-center leading-relaxed">
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit}>
          {/* New password field */}
          <div className="mb-6 relative">
            <label
              htmlFor="password"
              className="block text-foreground text-sm font-medium mb-2"
            >
              New Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter new password"
              className="w-full px-4 py-3 rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border hover:border-primary/50 transition-all duration-200 text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {/* Confirm password field */}
          <div className="mb-6 relative">
            <label
              htmlFor="confirm-password"
              className="block text-foreground text-sm font-medium mb-2"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              placeholder="Confirm new password"
              className="w-full px-4 py-3 rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border hover:border-primary/50 transition-all duration-200 text-base"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75 transition-all duration-200 active:scale-95 transform ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-cyan-700 text-primary-foreground hover:bg-cyan-800 hover:scale-105"
            }`}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <p
            className={`text-center text-sm mt-6 mb-4 ${
              success ? "text-green-500" : "text-muted-foreground"
            }`}
          >
            {message}
          </p>
        )}

        <div className="border-t border-border pt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Remembered your password?{" "}
            <a
              href="/login"
              className="text-primary hover:underline hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary rounded-md transition-colors duration-200"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
