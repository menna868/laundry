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
  const authPaths = ["/login", "/signup", "/forgot-password", "/reset-password"];
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
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopNav />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
