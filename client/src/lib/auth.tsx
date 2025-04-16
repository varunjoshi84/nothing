import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { User } from "../../shared/schema";
import type { LoginData, RegisterData } from "../../shared/schema";
import { apiRequest, queryClient } from "./queryClient";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Simple export for provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // User query to check logged in status
  const {
    data: user,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        if (res.status === 401) {
          return null;
        }
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        return data.user;
      } catch (error) {
        console.error("Error fetching user:", error);
        setAuthError(error.message); //Added error handling
        return null;
      } finally {
        setIsInitialized(true);
      }
    }
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData): Promise<User> => {
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include"
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || 'Login failed');
        }
        return json.user;
      } catch (error) {
        console.error('Login error:', error);
        setAuthError(error.message); //Added error handling
        throw error;
      }
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['/api/user'], user);
      setAuthError(null); //Clear error on success
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData): Promise<User> => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      const json = await res.json();
      return json.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setAuthError(null); //Clear error on success
    },
    onError: (error) => {
      setAuthError(error.message); //Added error handling
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await apiRequest("POST", "/api/logout", {});
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      setAuthError(null); //Clear error on success
    },
    onError: (error) => {
      setAuthError(error.message); //Added error handling
    }
  });

  // Helper functions
  const login = async (data: LoginData): Promise<User> => {
    return await loginMutation.mutateAsync(data);
  };

  const register = async (data: RegisterData): Promise<User> => {
    return await registerMutation.mutateAsync(data);
  };

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  // Create value object for context
  const contextValue: AuthContextType = {
    user: user || null,
    isLoading: isLoading && !isInitialized,
    login,
    register,
    logout,
    authError
  };

  // Return provider with value
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}