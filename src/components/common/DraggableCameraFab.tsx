import React, { useState, useRef, useEffect } from 'react';
import { Camera, Zap } from 'lucide-react';

interface DraggableCameraFabProps {
  onClick: () => void;
}

export const DraggableCameraFab: React.FC<DraggableCameraFabProps> = ({ onClick }) => {
  // Initial position: 20px from right, 20px from bottom
  const [position, setPosition] = useState({ x: window.innerWidth - 76, y: window.innerHeight - 76 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const elementStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Keep within bounds on window resize
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 70),
        y: Math.min(prev.y, window.innerHeight - 70)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = false;
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    elementStartRef.current = { ...position };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      isDraggingRef.current = true;
    }

    const newX = Math.max(10, Math.min(window.innerWidth - 70, elementStartRef.current.x + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - 70, elementStartRef.current.y + dy));

    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) {
      onClick();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    elementStartRef.current = { ...position };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isDraggingRef.current = true;
      }

      const newX = Math.max(10, Math.min(window.innerWidth - 70, elementStartRef.current.x + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 70, elementStartRef.current.y + dy));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (!isDraggingRef.current) {
        onClick();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        touchAction: 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      className="z-40 select-none cursor-grab active:cursor-grabbing"
    >
      <button
        type="button"
        className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl flex items-center justify-center border-2 border-white transition active:scale-95 group relative"
        title="📷 Drag/Geser atau Klik Kamera Scanner Barcode"
      >
        <Camera className="w-7 h-7 text-white group-hover:rotate-12 transition duration-300 pointer-events-none" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow pointer-events-none">
          <Zap className="w-2.5 h-2.5 text-black" />
        </span>
      </button>
    </div>
  );
};
