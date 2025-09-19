// Client/src/theme/AppThemeProvider.tsx
import React, { createContext, useMemo, useState, useEffect } from "react";
import { ThemeProvider as MUIThemeProvider, createTheme, CssBaseline } from "@mui/material";

type Mode = "light" | "dark";
export const ColorModeContext = createContext<{ mode: Mode; toggle: () => void }>({
  mode: "light",
  toggle: () => {},
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    const saved = localStorage.getItem("prefers-color");
    if (saved === "dark" || saved === "light") setMode(saved);
  }, []);

  const toggle = () => {
    setMode((m) => {
      const next = m === "light" ? "dark" : "light";
      localStorage.setItem("prefers-color", next);
      return next;
    });
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode, primary: { main: "#005096" }, secondary: { main: "#F0781E" } },
        shape: { borderRadius: 8 },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={{ mode, toggle }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ColorModeContext.Provider>
  );
}
