import React from "react";
import HighlightIcon from "@mui/icons-material/Highlight";
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

function Header({ onLogout }) {
  return (
    <header className="header">
      <h1 className="header-title">
        <HighlightIcon />
        My Diary
      </h1>
      <button className="logout-button"  onClick={onLogout}>
       <ExitToAppIcon className="logout-icon" />
        </button>
    </header>
  );
}

export default Header;
