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
import { makeStyles } from "@material-ui/core/styles";

import { SettingsContext } from "../context";
import { generateDeck } from "../game";
import Game from "./Game";

const useStyles = makeStyles((theme) => ({
  gameBoard: {
    marginBottom: theme.spacing(2),
    [theme.breakpoints.up("md")]: {
      minWidth: 400,
    },
    [theme.breakpoints.down("sm")]: {
      minWidth: 240,
    },
  },
  controlsRow: {
    display: "flex",
    justifyContent: "center",
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));

function BoardLayoutDialog(props) {
  const { open, onClose, title } = props;
  const classes = useStyles();
  const board = useMemo(
    () => generateDeck("normal", Math.random).slice(0, 12),
    []
  );

  const {
    layoutOrientation,
    setLayoutOrientation,
    cardOrientation,
    setCardOrientation,
  } = useContext(SettingsContext);

  const menuItems = (...items) =>
    items.map((item) => (
      <MenuItem key={item} value={item}>
        {item}
      </MenuItem>
    ));

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <div className={classes.gameBoard}>
          <Game board={board} onClick={() => {}} onClear={() => {}} />
        </div>
        <div className={classes.controlsRow}>
          <FormControl className={classes.formControl}>
            <InputLabel>Board Layout</InputLabel>
            <Select
              value={layoutOrientation}
              onChange={(e) => setLayoutOrientation(e.target.value)}
            >
              {menuItems("portrait", "landscape")}
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel>Card Orientation</InputLabel>
            <Select
              value={cardOrientation}
              onChange={(e) => setCardOrientation(e.target.value)}
            >
              {menuItems("vertical", "horizontal")}
            </Select>
          </FormControl>
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

export default BoardLayoutDialog;
