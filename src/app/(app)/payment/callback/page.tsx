"use client";

import { Suspense } from "react";
import PaymentCallback from "@/app/pages/PaymentCallback";

export default function Page() {
  return (
    <Suspense>
      <PaymentCallback />
    </Suspense>
  );
}
