"use client";

import { ShieldAlert } from "lucide-react";

export default function FraudPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
        <ShieldAlert size={32} />
      </div>
      <h1 className="text-2xl font-bold text-slate-800">Fraud Monitor</h1>
      <p className="text-slate-500 max-w-sm">
        This page is under construction. Future updates will bring live fraud alerts here to match the Figma design flow.
      </p>
    </div>
  );
}
