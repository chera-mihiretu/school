"use client";

import { useEffect, type ReactNode } from "react";
import { useFirstLoginStore } from "@/stores/first-login-store";

export function FirstLoginSecretsGuard({ children }: { children: ReactNode }) {
  const clearSecrets = useFirstLoginStore((state) => state.clearSecrets);

  useEffect(() => {
    return () => {
      clearSecrets();
    };
  }, [clearSecrets]);

  return children;
}
