import React, { useContext } from "react";
import { AppBar, Toolbar, Typography, IconButton } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import { ColorModeContext } from "../theme/AppThemeProvider";

export default function Header() {
  const { toggle } = useContext(ColorModeContext);

  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Toolbar sx={{ gap: 1 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Issue Tracker Lite
        </Typography>
        <IconButton color="inherit" onClick={toggle} aria-label="toggle theme">
          <Brightness4Icon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

