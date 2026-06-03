"use client";

import * as React from "react";

import { createSupabaseDataAccess } from "@/lib/data-access";
import type { AppState } from "@/types/domain";

interface AppContextValue {
  state: AppState;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  updateState: (updater: (current: AppState) => AppState) => Promise<void>;
  resetState: () => Promise<void>;
  clearError: () => void;
}

const AppContext = React.createContext<AppContextValue | null>(null);

export function AppProvider({ children, initialState }: { children: React.ReactNode; initialState: AppState }) {
  const dataAccess = React.useMemo(() => createSupabaseDataAccess(), []);
  const [state, setState] = React.useState<AppState>(initialState);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const saveVersion = React.useRef(0);
  const stateRef = React.useRef(state);

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  React.useEffect(() => {
    let mounted = true;

    Promise.resolve(dataAccess.getState())
      .then((nextState) => {
        if (mounted) {
          setState(nextState);
          stateRef.current = nextState;
          setError(null);
        }
      })
      .catch((nextError: unknown) => {
        if (mounted) {
          setError(getErrorMessage(nextError));
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [dataAccess]);

  const updateState = React.useCallback(
    async (updater: (current: AppState) => AppState) => {
      const previous = stateRef.current;
      const next = updater(previous);
      const currentSaveVersion = saveVersion.current + 1;
      saveVersion.current = currentSaveVersion;
      stateRef.current = next;
      setState(next);
      setIsSaving(true);
      setError(null);

      try {
        await Promise.resolve(dataAccess.saveState(next));
      } catch (nextError: unknown) {
        if (saveVersion.current === currentSaveVersion) {
          stateRef.current = previous;
          setState(previous);
        }

        const message = getErrorMessage(nextError);
        setError(message);
        throw new Error(message);
      } finally {
        if (saveVersion.current === currentSaveVersion) {
          setIsSaving(false);
        }
      }
    },
    [dataAccess]
  );

  const resetState = React.useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const nextState = await Promise.resolve(dataAccess.reset());
      stateRef.current = nextState;
      setState(nextState);
    } catch (nextError: unknown) {
      const message = getErrorMessage(nextError);
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [dataAccess]);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return (
    <AppContext.Provider value={{ state, isLoading, isSaving, error, updateState, resetState, clearError }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = React.useContext(AppContext);

  if (!context) {
    throw new Error("useAppState must be used within AppProvider");
  }

  return context;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось выполнить операцию с Supabase.";
}
