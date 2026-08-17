import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const DoaIbuLogo: React.FC<LogoProps> = ({ showSubtitle = true }) => {
  return (
    <div className="flex items-center gap-3 select-none max-w-[210px] sm:max-w-none overflow-hidden shrink-0">
      {/* Clean Frameless Logo Image (Directly on Topbar background, enlarged h-10 sm:h-12 md:h-14) */}
      <img
        src="/Unknown.jpeg"
        alt="Doa Ibu Sparepart Logo"
        className="h-10 sm:h-12 lg:h-14 w-auto object-contain shrink-0"
      />

      {/* Clean Formal Business Text Container */}
      <div className="min-w-0 flex flex-col justify-center leading-tight">
        {/* Line 1: Formal Title "Doa Ibu Sparepart" */}
        <span className="text-slate-900 font-bold text-base md:text-lg tracking-tight whitespace-nowrap truncate">
          Doa Ibu Sparepart
        </span>

        {/* Line 2: Formal Subtitle "supported by PT Fardan Utama Niaga" */}
        {showSubtitle && (
          <span className="text-slate-500 font-normal text-xs whitespace-nowrap truncate max-w-[150px] sm:max-w-none">
            supported by PT Fardan Utama Niaga
          </span>
        )}
      </div>
    </div>
  );
};
