"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";

interface AppSwitcherState {
  showAppSwitcher: boolean;
  switcherIndex: number;
  recentlyUsed: string[];
  altDownTimestampRef: React.MutableRefObject<number | null>;
  pendingShowTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  hasShownSwitcherRef: React.MutableRefObject<boolean>;
}

interface AppSwitcherActions {
  setShowAppSwitcher: React.Dispatch<React.SetStateAction<boolean>>;
  setSwitcherIndex: React.Dispatch<React.SetStateAction<number>>;
  updateRecentlyUsed: (itemName: string) => void;
  notifyProjectChange: (itemName: string) => void;
}

const AppSwitcherContext = createContext<
  (AppSwitcherState & AppSwitcherActions) | undefined
>(undefined);

export const AppSwitcherStateProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [showAppSwitcher, setShowAppSwitcher] = useState(false);
  const [switcherIndex, setSwitcherIndex] = useState(0);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);

  const altDownTimestampRef = useRef<number | null>(null);
  const pendingShowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownSwitcherRef = useRef(false);

  const updateRecentlyUsed = useCallback((itemName: string) => {
    setRecentlyUsed((prev) => {
      if (prev[0] === itemName) return prev;
      return [itemName, ...prev.filter((name) => name !== itemName)];
    });
  }, []);

  const notifyProjectChange = useCallback(
    (itemName: string) => {
      updateRecentlyUsed(itemName);
    },
    [updateRecentlyUsed],
  );

  const value = {
    showAppSwitcher,
    switcherIndex,
    recentlyUsed,
    altDownTimestampRef,
    pendingShowTimeoutRef,
    hasShownSwitcherRef,
    setShowAppSwitcher,
    setSwitcherIndex,
    updateRecentlyUsed,
    notifyProjectChange,
  };

  return (
    <AppSwitcherContext.Provider value={value}>
      {children}
    </AppSwitcherContext.Provider>
  );
};

export const useAppSwitcherState = () => {
  const context = useContext(AppSwitcherContext);
  if (context === undefined) {
    throw new Error(
      "useAppSwitcherState must be used within a AppSwitcherStateProvider",
    );
  }
  return context;
};
