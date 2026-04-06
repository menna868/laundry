import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export function Card({ children, className, title, action }: CardProps) {
  return (
    <div className={clsx("bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-6">
          {title && <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
