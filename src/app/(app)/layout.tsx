'use client';

import { motion, AnimatePresence } from 'motion/react';
import { TopNav } from '@/app/components/TopNav';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.22, ease: 'easeIn' } },
};

export default function AppLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname();

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
