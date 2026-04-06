"use client";

import { Suspense } from "react";
import ForgotPassword from "@/app/pages/ForgotPassword";

export default function Page() {
  return (
    <Suspense>
      <ForgotPassword />
    </Suspense>
  );
}
