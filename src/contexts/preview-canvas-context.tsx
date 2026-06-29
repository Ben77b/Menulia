"use client";

import { createContext, useContext } from "react";

const PreviewCanvasContext = createContext(false);

export function PreviewCanvasProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <PreviewCanvasContext.Provider value={enabled}>{children}</PreviewCanvasContext.Provider>
  );
}

export function usePreviewCanvas(): boolean {
  return useContext(PreviewCanvasContext);
}
