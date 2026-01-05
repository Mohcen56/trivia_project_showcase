"use client";

import React from "react";

import { Check, Sparkles, Rocket,  Gamepad2, Trophy, Crown,  Smartphone, Layers } from "lucide-react";
import { VerifyBadge } from "../ui/verify-badge";

export function PremiumDashboard() {
  ;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 py-4 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Premium Header */}
        <div className="text-center space-y-4">
          <div className="inline-block">
            <Crown className="w-16 h-16 text-yellow-500 mx-auto -mb-5 drop-shadow-lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            🎉 You&apos;re a Premium Member!
          </h1>
         <VerifyBadge type="premium" size="md" showLabel={true} />
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Enjoy all categories, future updates, and unlimited play forever.
          </p>
        </div>

        {/* Premium Benefits */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-cyan-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-500" />
            Your Premium Benefits
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "All categories unlocked",
              "All future categories included",
              "No ads — forever",
              "Early access to new game modes",
              "Exclusive premium-only badges",
              "Lifetime membership (no renewal needed)",
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3 text-gray-700">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

      
      

        {/* Coming Soon Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Rocket className="w-6 h-6 text-cyan-500" />
            Coming Soon — Free for You!
          </h2>
          <p className="text-gray-600 mb-6">
            All future expansions are <span className="font-bold text-green-600">FREE</span> for Premium members.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
            { icon: <Smartphone className="w-5 h-5" />, text: "Brainigo Mobile App (iOS & Android)" },
            { icon: <Gamepad2 className="w-5 h-5" />, text: "Real-Time 1v1 Multiplayer Mode" },
            { icon: <Layers className="w-5 h-5" />, text: "New Categories Added Regularly" },
            { icon: <Trophy className="w-5 h-5" />, text: "Global Leaderboards" },
            

            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="text-blue-500">{item.icon}</div>
                <span className="text-gray-700 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appreciation Message */}
        <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-2xl p-8 text-center border-2 border-cyan-200">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Thank You for Supporting TriviaSpirit! 💙
          </h3>
          <p className="text-gray-600">
            You help us create more game modes and categories for everyone.
          </p>
        </div>

   
       
      </div>
    </div>
  );
}
