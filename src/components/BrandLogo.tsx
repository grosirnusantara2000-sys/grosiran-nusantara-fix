import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'badge' | 'inline' | 'iconOnly';
  theme?: 'dark' | 'light';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'badge',
  theme = 'light',
}) => {
  // If variant is badge, we use the complete badge graphic with dual-outlet labels
  if (variant === 'badge') {
    const sizeClasses = {
      sm: 'h-10 w-auto',
      md: 'h-12 w-auto',
      lg: 'h-16 w-auto',
      xl: 'h-24 w-auto',
    }[size];

    return (
      <img
        src="/assets/aistudio/Logo_Grosir_Nusantara_Warna_Nusantara_fc818c0f.png"
        alt="Grosir Nusantara - Sentra Grosir Tanah Abang & Aur Kuning"
        className={`${sizeClasses} object-contain shrink-0 drop-shadow-sm select-none ${className}`}
        onError={(e) => {
          // Fallback to relative public path if needed
          const target = e.currentTarget;
          if (target.src.indexOf('/public/') === -1) {
            target.src = '/public/assets/aistudio/Logo_Grosir_Nusantara_Warna_Nusantara_fc818c0f.png';
          }
        }}
      />
    );
  }

  // If variant is iconOnly (e.g. for small mobile buttons)
  if (variant === 'iconOnly') {
    const iconSizes = {
      sm: 'w-7 h-7',
      md: 'w-9 h-9',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
    }[size];

    return (
      <div
        className={`${iconSizes} rounded-xl bg-gradient-to-br from-[#0a192f] via-[#0f2744] to-[#1e3a8a] border border-blue-900/60 p-1.5 flex items-center justify-center shrink-0 shadow-sm ${className}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-amber-400 stroke-current">
          <path
            d="M3 3h2l2.4 12h11.2l2-8H6.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="19" r="1.5" fill="currentColor" />
          <circle cx="17" cy="19" r="1.5" fill="currentColor" />
        </svg>
      </div>
    );
  }

  // Horizontal inline text layout (e.g. for Navbar or Sidebar text)
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon emblem */}
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#0a192f] via-[#0f2744] to-[#1e3a8a] border border-amber-500/40 p-2 flex items-center justify-center shrink-0 shadow-md">
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-amber-400 stroke-current">
          <path
            d="M3 3h2.5l2.2 11h11.6l2.2-7H6.5"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="18.5" r="1.8" fill="currentColor" />
          <circle cx="17" cy="18.5" r="1.8" fill="currentColor" />
          <path
            d="M12 5l1.2 2.5 2.8.4-2 2 .5 2.8L12 11.4 9.5 12.7l.5-2.8-2-2 2.8-.4L12 5z"
            fill="#38bdf8"
            stroke="#38bdf8"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col text-left">
        <div
          className={`text-base sm:text-lg font-black tracking-tight leading-none ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          GROSIR <span className="text-amber-500">NUSANTARA</span>
        </div>
        <div
          className={`text-[9.5px] sm:text-[10px] tracking-wide font-bold uppercase mt-1 ${
            isDark ? 'text-amber-400/90' : 'text-slate-500'
          }`}
        >
          Belanja Grosir &amp; Eceran, Lebih Mudah
        </div>
      </div>
    </div>
  );
};
