"use client";
import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface GlassMorphCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

export default function GlassMorphCard({ 
  children, 
  className, 
  hover = true, 
  glow = false, 
  gradient = false,
  onClick 
}: GlassMorphCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        // Base glassmorphism styles
        "backdrop-blur-xl bg-white/[0.03] border border-white/[0.08]",
        "shadow-[0_8px_32px_0_rgba(31,38,135,0.2)]",
        
        // Hover effects
        hover && "transition-all duration-500 ease-out",
        hover && "hover:bg-white/[0.06] hover:border-white/[0.15]",
        hover && "hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.3)]",
        hover && "hover:scale-[1.02] hover:-translate-y-1",
        
        // Glow effect
        glow && "shadow-[0_0_30px_rgba(201,146,10,0.3)]",
        glow && hover && "hover:shadow-[0_0_40px_rgba(201,146,10,0.5)]",
        
        // Gradient border
        gradient && "before:absolute before:inset-0 before:p-[1px] before:rounded-[inherit]",
        gradient && "before:bg-gradient-to-r before:from-amber-500/20 before:via-blue-500/20 before:to-amber-500/20",
        gradient && "before:mask-[linear-gradient(white_0_0)_content-box,_linear-gradient(white_0_0)]",
        gradient && "before:mask-composite-subtract",
        
        // Cursor
        onClick && "cursor-pointer",
        
        className
      )}
      style={{
        background: gradient 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)'
          : undefined
      }}
    >
      {children}
    </div>
  );
}

// Floating action button variant
export function FloatingGlassButton({ 
  children, 
  className, 
  onClick,
  position = "bottom-right" 
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}) {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6"
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        "fixed z-50 w-14 h-14 rounded-full",
        "backdrop-blur-xl bg-gradient-to-r from-amber-500/20 to-blue-500/20",
        "border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.4)]",
        "transition-all duration-300 ease-out",
        "hover:scale-110 hover:rotate-12 hover:shadow-[0_12px_40px_0_rgba(201,146,10,0.6)]",
        "active:scale-95",
        "flex items-center justify-center text-white/80 hover:text-white",
        positionClasses[position],
        className
      )}
    >
      {children}
    </button>
  );
}
