import { Link as RouterLink, useLocation } from "react-router-dom";

import Divider from "@material-ui/core/Divider";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Paper from "@material-ui/core/Paper";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import AlarmIcon from "@material-ui/icons/Alarm";
import FitnessCenterIcon from "@material-ui/icons/FitnessCenter";
import SnoozeIcon from "@material-ui/icons/Snooze";
import SportsEsportsIcon from "@material-ui/icons/SportsEsports";

import { modes } from "../game";
import useMoment from "../hooks/useMoment";
import { capitalizeFirst, formatTime, formatDate } from "../util";
import Subheading from "./Subheading";
import User from "./User";

const useStyles = makeStyles((theme) => ({
  sidebar: {
    maxHeight: "100%",
    display: "flex",
    flexDirection: "column",
    padding: 8,
  },
  timer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  alarm: {
    color: theme.alarm,
    marginRight: 10,
    marginBottom: 3,
  },
  panel: {
    display: "flex",
    flexDirection: "column",
    overflowY: "hidden",
  },
}));

function GameSidebar({ game, scores, leaderboard, pause, endedAt }) {
  const classes = useStyles();
  const { pathname } = useLocation();
  const time = useMoment(500);

  const date = new Date(game.startedAt);

  const gameTime = endedAt || time;
  const pauseTime =
    (pause?.previous ?? 0) +
    (pause?.start ? (pause.end ?? gameTime) - pause.start : 0);

  return (
    <Paper className={classes.sidebar}>
      <Subheading>
        {modes[game.mode].name}{" "}
        <span style={{ opacity: 0.4 }}>[{capitalizeFirst(game.access)}]</span>
        {game.enableHint && (
          <FitnessCenterIcon
            fontSize="small"
            style={{ verticalAlign: "text-bottom", marginLeft: "0.1em" }}
          />
        )}
      </Subheading>
      <Divider style={{ margin: "4px 0" }} />
      {/* Timer */}
      <div className={classes.timer} style={{ marginTop: 6 }}>
        <AlarmIcon className={classes.alarm} fontSize="large" />
        <Typography variant="h4" align="center">
          {/* Hide the sub-second time resolution while game is active to
          avoid stressing beginners. */}
          {formatTime(gameTime - game.startedAt - pauseTime, !endedAt)}
        </Typography>
      </div>
      <Divider style={{ margin: "8px 0" }} />
      {/* Scoreboard */}
      <div className={classes.panel}>
        <Subheading>Scoreboard</Subheading>
        <List dense disablePadding style={{ overflowY: "auto" }}>
          {leaderboard.map((uid) => (
            <User
              key={uid}
              id={uid}
              showRating={game.mode || "normal"}
              component={Typography}
              variant="body2"
              noWrap
              render={(user, userEl) => (
                <ListItem button component={RouterLink} to={`/profile/${uid}`}>
                  {!endedAt && (
                    <ListItemIcon>
                      {user.connections &&
                      Object.values(user.connections).includes(pathname) ? (
                        <Tooltip title="Active player">
                          <SportsEsportsIcon />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Disconnected player">
                          <SnoozeIcon />
                        </Tooltip>
                      )}
                    </ListItemIcon>
                  )}
                  <ListItemText disableTypography>{userEl}</ListItemText>
                  <ListItemText
                    style={{
                      flex: "0 0 36px",
                      textAlign: "right",
                    }}
                  >
                    <strong>{scores[uid] || 0}</strong>
                  </ListItemText>
                </ListItem>
              )}
            />
          ))}
        </List>
      <Divider style={{ margin: "8px 0" }} />
      <Typography variant="p" align="center">
        <span style={{opacity: 0.9}}>{formatDate(date)}</span>
      </Typography>
      </div>
    </Paper>
  );
}

export default GameSidebar;
