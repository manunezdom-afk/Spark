"use client";

import * as React from "react";

import { NovaAskDialog } from "@/components/nova/NovaAskDialog";
import { useTutorialStore } from "@/lib/tutorial/store";

interface NovaAskContextValue {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
}

const NovaAskContext = React.createContext<NovaAskContextValue | null>(null);

export function useNovaAsk(): NovaAskContextValue {
  const ctx = React.useContext(NovaAskContext);
  if (!ctx) {
    return { open: () => {}, close: () => {}, toggle: () => {}, isOpen: false };
  }
  return ctx;
}

export function NovaAskProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      // No abrir Nova mientras el tour está activo.
      if (useTutorialStore.getState().welcomeOpen) return;
      e.preventDefault();
      setIsOpen((v) => !v);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const value = React.useMemo<NovaAskContextValue>(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
      isOpen,
    }),
    [isOpen],
  );

  return (
    <NovaAskContext.Provider value={value}>
      {children}
      <NovaAskDialog open={isOpen} onOpenChange={setIsOpen} />
    </NovaAskContext.Provider>
  );
}
