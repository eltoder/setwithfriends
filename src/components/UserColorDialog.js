import { useContext } from "react";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { makeStyles, withTheme } from "@material-ui/core/styles";
import CheckIcon from "@material-ui/icons/Check";

import { UserContext } from "../context";
import firebase from "../firebase";
import { colors, getColor } from "../util";
import User from "./User";

const useStyles = makeStyles((theme) => ({
  colorBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 60,
    width: "100%",
    cursor: "pointer",
    border: "none",
    color: theme.palette.primary.contrastText,
    "@media(hover: hover) and (pointer: fine)": {
      "&:hover": {
        outline: "3px dashed",
        outlineOffset: -3,
      },
    },
  },
}));

function UserColorDialog({ open, onClose, title, theme }) {
  const user = useContext(UserContext);
  const classes = useStyles();

  function handleChange(color) {
    firebase.database().ref(`users/${user.id}/color`).set(color);
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <User
          id={user.id}
          component={Typography}
          variant="subtitle1"
          style={{ textAlign: "center", marginBottom: 8 }}
        />
        <Grid container direction="row" style={{ width: 240 }}>
          {Object.keys(colors).map((color) => (
            <Grid item key={color} xs={3}>
              <button
                className={classes.colorBox}
                style={{ background: getColor(color, theme) }}
                onClick={() => handleChange(color)}
              >
                {color === user.color && <CheckIcon fontSize="large" />}
              </button>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default withTheme(UserColorDialog);
