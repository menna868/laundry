"use client";

import { motion, AnimatePresence } from "motion/react";
import { TopNav } from "@/app/components/TopNav";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect } from "react";
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn, isAuthReady } = useAuth();
  const authPaths = ["/login", "/signup"];
  const isAuthPage = authPaths.includes(pathname);
  const shouldShowTopNav = !isAuthPage || !!searchParams.get("from");

  useEffect(() => {
    if (!isAuthReady) return;

    if (isLoggedIn && isAuthPage) {
      router.replace("/");
    }
  }, [isAuthPage, isAuthReady, isLoggedIn, router]);

  if (!isAuthReady) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {shouldShowTopNav && <TopNav />}
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
