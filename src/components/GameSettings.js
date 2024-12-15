import { makeStyles } from "@material-ui/core/styles";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Switch from "@material-ui/core/Switch";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";

import firebase from "../firebase";
import { hasHint, modes } from "../util";

const useStyles = makeStyles(() => ({
  settings: { display: "flex", justifyContent: "space-evenly" },
}));

const hintTip =
  "Practice mode where you can get hints to help you find Sets. " +
  "Only available in private games with a single player, and not counted in total stats.";

function GameSettings({ game, gameId, userId }) {
  const classes = useStyles();

  function handleChangeMode(event) {
    firebase.database().ref(`games/${gameId}/mode`).set(event.target.value);
  }

  function toggleHint() {
    firebase.database().ref(`games/${gameId}/enableHint`).set(!game.enableHint);
  }

  const gameMode = game.mode || "normal";

  return (
    <div className={classes.settings}>
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <Typography style={{ marginRight: "0.6em" }}>Mode:</Typography>
        <Select
          value={gameMode}
          disabled={userId !== game.host}
          onChange={handleChangeMode}
        >
          {Object.entries(modes).map(([key, { name, description }]) => (
            <MenuItem key={key} value={key}>
              <Tooltip key={key} arrow placement="left" title={description}>
                <Typography>{name}</Typography>
              </Tooltip>
            </MenuItem>
          ))}
        </Select>
      </div>
      <Tooltip arrow placement="left" title={hintTip}>
        <FormControlLabel
          control={<Switch checked={hasHint(game)} onChange={toggleHint} />}
          label="Enable Hints"
          disabled={
            userId !== game.host ||
            game.access !== "private" ||
            Object.keys(game.users || {}).length !== 1
          }
        />
      </Tooltip>
    </div>
  );
}

export default GameSettings;
