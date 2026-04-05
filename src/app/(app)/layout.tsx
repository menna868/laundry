"use client";

import { motion, AnimatePresence } from "motion/react";
import { TopNav } from "@/app/components/TopNav";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useRef } from "react";
import { ReactNode } from "react";

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.22, ease: [0.42, 0, 1, 1] as const },
  },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, isAuthReady } = useAuth();
  const hasHandledDevLandingRef = useRef(false);
  const authPaths = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];
  const isAuthPage = authPaths.includes(pathname);

  useEffect(() => {
    if (!isAuthReady) return;

    if (
      process.env.NODE_ENV === "development" &&
      !hasHandledDevLandingRef.current &&
      pathname !== "/"
    ) {
      hasHandledDevLandingRef.current = true;
      router.replace("/");
      return;
    }

    hasHandledDevLandingRef.current = true;

    if (isLoggedIn && isAuthPage) {
      router.replace("/");
    }
  }, [isAuthPage, isAuthReady, isLoggedIn, pathname, router]);

  if (!isAuthReady) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-[-8rem] h-80 w-80 rounded-full bg-[#1D6076]/8 blur-3xl" />
        <div className="absolute top-40 left-[-6rem] h-72 w-72 rounded-full bg-[#EBA050]/10 blur-3xl" />
      </div>
      <TopNav />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
