import React from "react";

interface CanvasContainerProps {
  children: React.ReactNode;
}

export function CanvasContainer({ children }: CanvasContainerProps) {
  return (
    <div className="flex-1 bg-gray-900 relative overflow-auto flex items-start justify-start">
      {children}
    </div>
  );
}
