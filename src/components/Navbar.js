import { useContext, useEffect, useState } from "react";

import AppBar from "@material-ui/core/AppBar";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import Link from "@material-ui/core/Link";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Toolbar from "@material-ui/core/Toolbar";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import EditIcon from "@material-ui/icons/Edit";
import SettingsIcon from "@material-ui/icons/Settings";

import { version } from "../config";
import { SettingsContext, UserContext } from "../context";
import firebase from "../firebase";
import useFirebaseRef from "../hooks/useFirebaseRef";
import useKeydown, { getModifierState } from "../hooks/useKeydown";
import AccountOptionsDialog from "./AccountOptionsDialog";
import BoardLayoutDialog from "./BoardLayoutDialog";
import ColorChoiceDialog from "./ColorChoiceDialog";
import InternalLink from "./InternalLink";
import KeyboardLayoutDialog from "./KeyboardLayoutDialog";
import PromptDialog from "./PromptDialog";
import User from "./User";
import UserColorDialog from "./UserColorDialog";

const useStyles = makeStyles({
  editIcon: {
    marginLeft: 4,
    cursor: "pointer",
    "&:hover": {
      fill: "#f06292",
    },
    visibility: "hidden",
  },
  title: {
    display: "flex",
    alignItems: "center",
    flexGrow: 1,
    "&:hover > $editIcon": {
      visibility: "visible",
    },
  },
});

function Navbar() {
  const user = useContext(UserContext);
  const classes = useStyles();
  const settings = useContext(SettingsContext);
  const [siteTitleDb] = useFirebaseRef("/site/title");
  const siteTitle = siteTitleDb || "Set with Forks";
  const [anchorEl, setAnchorEl] = useState(null);
  const [changeSiteTitle, setChangeSiteTitle] = useState(false);
  const [changeName, setChangeName] = useState(false);
  const [changeUserColor, setChangeUserColor] = useState(false);
  const [changeCardColors, setChangeCardColors] = useState(false);
  const [changeBoardLayout, setChangeBoardLayout] = useState(false);
  const [changeKeyboardLayout, setChangeKeyboardLayout] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    document.title = siteTitle;
  }, [siteTitle]);

  function handleMenu(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleCloseMenu() {
    setAnchorEl(null);
  }

  function handleChangeSiteTitle(title) {
    setChangeSiteTitle(false);
    title = (title || "").trim();
    if (title) {
      firebase.database().ref("/site/title").set(title);
    }
  }

  function handleChangeName(name) {
    setChangeName(false);
    name = (name || "").trim();
    if (name) {
      firebase.database().ref(`users/${user.id}/name`).set(name);
    }
  }

  function handleChangeCardColors(colorMap) {
    setChangeCardColors(false);
    if (colorMap) {
      settings.setCustomCardColors(
        JSON.stringify({
          ...settings.customCardColors,
          [settings.themeType]: colorMap,
        })
      );
    }
  }

  function handleChangeVolume() {
    settings.setVolume((volume) => (volume === "on" ? "off" : "on"));
  }

  function handleChangeTheme() {
    settings.setThemeType((themeType) =>
      themeType === "light" ? "dark" : "light"
    );
  }

  function handleChangeNotifications() {
    settings.setNotifications((notifications) =>
      notifications === "on" ? "off" : "on"
    );
  }

  useKeydown((event) => {
    if (getModifierState(event) === "Control") {
      if (event.key === "s") {
        event.preventDefault();
        handleChangeVolume();
      } else if (event.key === "e") {
        event.preventDefault();
        handleChangeTheme();
      } else if (event.key === "o") {
        event.preventDefault();
        settings.setLayoutOrientation((layoutOrientation) =>
          layoutOrientation === "portrait" ? "landscape" : "portrait"
        );
      } else if (event.key === "i") {
        event.preventDefault();
        settings.setCardOrientation((cardOrientation) =>
          cardOrientation === "vertical" ? "horizontal" : "vertical"
        );
      }
    }
  });

  return (
    <AppBar position="relative" color="transparent" elevation={0}>
      <Toolbar variant="dense">
        <div className={classes.title}>
          <Typography variant="h6" style={{ whiteSpace: "nowrap" }}>
            <InternalLink underline="none" color="inherit" to="/">
              {siteTitle}
            </InternalLink>
          </Typography>
          {user.admin && (
            <EditIcon
              className={classes.editIcon}
              onClick={() => setChangeSiteTitle(true)}
            />
          )}
        </div>
        <Typography
          variant="subtitle1"
          style={{ marginLeft: "2em", marginRight: 8, minWidth: 0 }}
        >
          <InternalLink underline="none" to={`/profile/${user.id}`}>
            <User
              id={user.id}
              style={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            />
          </InternalLink>
        </Typography>
        <IconButton color="inherit" onClick={handleMenu}>
          <Tooltip title="Settings">
            <SettingsIcon />
          </Tooltip>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          open={anchorEl !== null}
          onClose={handleCloseMenu}
        >
          <Typography variant="subtitle1" align="center">
            {version ? `Version ${version}` : "Development Version"}
          </Typography>
          {version && (
            <Typography variant="subtitle2" align="center">
              <Link
                target="_blank"
                rel="noopener"
                href={`https://github.com/eltoder/setwithfriends/releases/tag/v${version}`}
              >
                Release Notes
              </Link>
            </Typography>
          )}
          <Divider style={{ margin: "8px 0" }} />
          <MenuItem
            onClick={() => {
              handleChangeVolume();
              handleCloseMenu();
            }}
          >
            {settings.volume === "on" ? "Mute" : "Unmute"} sound
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleChangeNotifications();
              handleCloseMenu();
            }}
          >
            {settings.notifications === "on" ? "Disable" : "Enable"}{" "}
            notifications
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleChangeTheme();
              handleCloseMenu();
            }}
          >
            Change theme
          </MenuItem>
          <MenuItem
            onClick={() => {
              setChangeName(true);
              handleCloseMenu();
            }}
          >
            Change name
          </MenuItem>
          <MenuItem
            onClick={() => {
              setChangeUserColor(true);
              handleCloseMenu();
            }}
          >
            Change user color
          </MenuItem>
          <MenuItem
            onClick={() => {
              setChangeCardColors(true);
              handleCloseMenu();
            }}
          >
            Change card colors
          </MenuItem>
          <MenuItem
            onClick={() => {
              setChangeBoardLayout(true);
              handleCloseMenu();
            }}
          >
            Change board layout
          </MenuItem>
          <MenuItem
            onClick={() => {
              setChangeKeyboardLayout(true);
              handleCloseMenu();
            }}
          >
            Change keyboard layout
          </MenuItem>
          <MenuItem
            onClick={() => {
              setShowOptions(true);
              handleCloseMenu();
            }}
          >
            Account options
          </MenuItem>
        </Menu>
        <PromptDialog
          open={changeSiteTitle}
          onClose={handleChangeSiteTitle}
          title="Change Site Title"
          message="Enter the new site title. It will be visible for everyone on the site. Please change responsibly."
          label="Title"
          maxLength={100}
        />
        <PromptDialog
          open={changeName}
          onClose={handleChangeName}
          title="Change Name"
          message="Enter your preferred display name below. This will be updated for all current, past, and future games."
          label="Name"
          maxLength={25}
        />
        <UserColorDialog
          open={changeUserColor}
          onClose={() => setChangeUserColor(false)}
          title="Change User Color"
        />
        <ColorChoiceDialog
          open={changeCardColors}
          onClose={handleChangeCardColors}
          title="Change Card Colors"
        />
        <BoardLayoutDialog
          open={changeBoardLayout}
          onClose={() => setChangeBoardLayout(false)}
          title="Change Board Layout"
        />
        <KeyboardLayoutDialog
          open={changeKeyboardLayout}
          onClose={() => setChangeKeyboardLayout(false)}
          title="Change Keyboard Layout"
        />
        <AccountOptionsDialog
          open={showOptions}
          onClose={() => setShowOptions(false)}
        />
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
