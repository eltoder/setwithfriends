import clsx from "clsx";
import { useContext, useMemo } from "react";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import { makeStyles } from "@material-ui/core/styles";

import { SettingsContext } from "../context";
import { generateDeck } from "../game";
import { standardLayouts } from "../util";
import Game from "./Game";

const useStyles = makeStyles((theme) => ({
  gameBoard: {
    marginBottom: theme.spacing(2),
  },
  gameBoardLandscape: {
    [theme.breakpoints.up("md")]: {
      minWidth: 400,
    },
    [theme.breakpoints.down("sm")]: {
      minWidth: 240,
    },
  },
  controlsRow: {
    display: "flex",
    flexDirection: "column",
  },
}));

function KeyboardLayoutDialog(props) {
  const { open, onClose, title } = props;
  const classes = useStyles();
  const deck = useMemo(() => generateDeck("normal", Math.random), []);

  const {
    keyboardLayout,
    keyboardLayoutName,
    setKeyboardLayoutName,
    setCustomKeyboardLayout,
    layoutOrientation,
  } = useContext(SettingsContext);

  const isLandscape = layoutOrientation === "landscape";
  const layoutKey = isLandscape ? "horizontalLayout" : "verticalLayout";
  const shortcuts = keyboardLayout[layoutKey];

  const handleChange = (event) => {
    setKeyboardLayoutName(event.target.value);
  };

  const handleChangeCustom = (event) => {
    setCustomKeyboardLayout(
      JSON.stringify({ ...keyboardLayout, [layoutKey]: event.target.value })
    );
  };

  const menuItems = [...Object.keys(standardLayouts), "Custom"].map(
    (layoutName) => (
      <MenuItem key={layoutName} value={layoutName}>
        {layoutName}
      </MenuItem>
    )
  );

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <div
          className={clsx(classes.gameBoard, {
            [classes.gameBoardLandscape]: isLandscape,
          })}
        >
          <Game
            board={deck.slice(0, Math.max(12, shortcuts.length))}
            showShortcuts={true}
            onClick={() => {}}
            onClear={() => {}}
          />
        </div>
        <div className={classes.controlsRow}>
          <FormControl>
            <InputLabel>Layout</InputLabel>
            <Select value={keyboardLayoutName} onChange={handleChange}>
              {menuItems}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Shortcuts"
            type="text"
            fullWidth
            disabled={keyboardLayoutName !== "Custom"}
            value={shortcuts}
            onChange={handleChangeCustom}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default KeyboardLayoutDialog;
