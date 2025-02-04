import FormControlLabel from "@material-ui/core/FormControlLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Switch from "@material-ui/core/Switch";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

import firebase from "../firebase";
import { modes } from "../game";
import useStorage from "../hooks/useStorage";

const useStyles = makeStyles(() => ({
  settings: { display: "flex", justifyContent: "space-evenly" },
}));

const practiceModeTip =
  "Practice mode is only available in private games. " +
  "Games in practice mode are not counted in stats. " +
  "You are allowed to use hints and pause the game.";

function GameSettings({ game, gameId, userId }) {
  const classes = useStyles();
  const gameMode = game.mode || "normal";
  const [, setGameMode] = useStorage("gameMode", "normal");
  const [, setPracticeMode] = useStorage("practiceMode", "off");

  function handleChangeMode(event) {
    firebase.database().ref(`games/${gameId}/mode`).set(event.target.value);
    setGameMode(event.target.value);
  }

  function togglePracticeMode() {
    firebase.database().ref(`games/${gameId}/enableHint`).set(!game.enableHint);
    setPracticeMode(!game.enableHint ? "on" : "off");
  }

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
      <Tooltip arrow placement="left" title={practiceModeTip}>
        <FormControlLabel
          control={
            <Switch checked={game.enableHint} onChange={togglePracticeMode} />
          }
          label="Practice Mode"
          disabled={userId !== game.host || game.access !== "private"}
        />
      </Tooltip>
    </div>
  );
}

export default GameSettings;
