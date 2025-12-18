"use client";

import { useRef, useEffect } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "./index";
import { useAppDispatch } from "./hooks";
import { initializeAuth } from "./slices/auth.slice";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize auth state from localStorage on mount (after page refresh)
    dispatch(initializeAuth());
  }, [dispatch]);

  return <>{children}</>;
}

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef(undefined as ReturnType<typeof makeStore> | undefined);
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}

