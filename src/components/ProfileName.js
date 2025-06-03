import { memo, useContext, useState } from "react";

import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import { useTheme } from "@material-ui/core/styles";
import { makeStyles } from "@material-ui/core/styles";
import MoreVertIcon from "@material-ui/icons/MoreVert";

import { UserContext } from "../context";
import firebase from "../firebase";
import { generateColor, generateName } from "../util";
import ElapsedTime from "./ElapsedTime";
import User from "./User";

const useStyles = makeStyles((theme) => ({
  vertIcon: {
    marginLeft: "auto",
    cursor: "pointer",
    "&:hover": {
      fill: "#f06292",
    },
    visibility: "hidden",
  },
  name: {
    display: "flex",
    marginBottom: 6,
    "&:hover > $vertIcon": {
      visibility: "visible",
    },
  },
}));

function ProfileName({ userId }) {
  const theme = useTheme();
  const user = useContext(UserContext);
  const classes = useStyles();

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClickVertIcon = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleResetName = () => {
    firebase.database().ref(`users/${userId}/name`).set(generateName());
    handleClose();
  };

  const handleColor = () => {
    firebase.database().ref(`users/${userId}/color`).set(generateColor());
    handleClose();
  };

  const handleBan = (minutes) => {
    const endTime = Date.now() + minutes * 60000;
    firebase.database().ref(`users/${userId}/banned`).set(endTime);
  };

  const handleUnban = () => {
    firebase.database().ref(`users/${userId}/banned`).remove();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <User
      id={userId}
      render={(player, userEl) => {
        const isOnline =
          player.connections && Object.keys(player.connections).length > 0;
        return (
          <section>
            <div className={classes.name}>
              <Typography variant="h4" style={{ overflowWrap: "anywhere" }}>
                {userEl}
              </Typography>
              {user.admin && (
                <MoreVertIcon
                  aria-controls="admin-menu"
                  color="inherit"
                  className={classes.vertIcon}
                  onClick={handleClickVertIcon}
                />
              )}
              <Menu
                id="admin-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleResetName}>Reset username</MenuItem>
                <MenuItem onClick={handleColor}>Reset color</MenuItem>
                {player.banned && Date.now() < player.banned ? (
                  <MenuItem onClick={() => handleUnban()}>Unban</MenuItem>
                ) : (
                  [
                    <MenuItem key={1} onClick={() => handleBan(30)}>
                      Ban for 30 minutes
                    </MenuItem>,
                    <MenuItem key={2} onClick={() => handleBan(24 * 60)}>
                      Ban for 1 day
                    </MenuItem>,
                    <MenuItem key={3} onClick={() => handleBan(7 * 24 * 60)}>
                      Ban for 1 week
                    </MenuItem>,
                  ]
                )}
              </Menu>
            </div>

            {player.admin && (
              <Typography variant="subtitle2" gutterBottom>
                Moderator
              </Typography>
            )}

            <Typography variant="body2" gutterBottom>
              Last seen:{" "}
              <span
                style={{
                  color: isOnline ? theme.palette.success.main : "inherit",
                  fontWeight: 700,
                }}
              >
                {isOnline ? (
                  "online now"
                ) : (
                  <ElapsedTime value={player.lastOnline} />
                )}
              </span>
            </Typography>
          </section>
        );
      }}
    />
  );
}

export default memo(ProfileName);
