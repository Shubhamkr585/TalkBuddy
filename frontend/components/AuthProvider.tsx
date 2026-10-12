"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { checkAuth, authUser } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Optional: We can show a global loading spinner here if we want to block the ENTIRE app 
  // until we know the auth status. For now, we'll let individual pages handle redirects/loading
  // to allow for better "optimistic" UI rendering (e.g. showing cached data while checking).
  
  return <>{children}</>;
};
