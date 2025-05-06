"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Account, AppContextType } from "@/types";

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [fetching, setFetching] = useState<Record<string, boolean>>({});
  const [aiMode, setAiMode] = useState<boolean>(false);
  const [anthropicApiKey, setAnthropicApiKey] = useState<string>("");
  const [anthropicModel, setAnthropicModel] = useState<string>("claude-3-haiku-20240307");

  return (
    <AppContext.Provider
      value={{
        accounts,
        setAccounts,
        selectedAccountId,
        setSelectedAccountId,
        fetching,
        setFetching,
        aiMode,
        setAiMode,
        anthropicApiKey,
        setAnthropicApiKey,
        anthropicModel,
        setAnthropicModel,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
} 