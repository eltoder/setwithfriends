import { useState } from "react";
import { ChromePicker } from "react-color";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Grid from "@material-ui/core/Grid";
import { ThemeProvider, makeStyles, withTheme } from "@material-ui/core/styles";

import { darkTheme, lightTheme, withCardColors } from "../themes";
import ResponsiveSetCard from "./ResponsiveSetCard";

const useStyles = makeStyles({
  colorPickerColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
});

function ColorChoiceDialog(props) {
  const { open, onClose, title, theme } = props;
  const classes = useStyles();

  const [red, setRed] = useState(theme.setCard.red);
  const [green, setGreen] = useState(theme.setCard.green);
  const [purple, setPurple] = useState(theme.setCard.purple);
  const [orange, setOrange] = useState(theme.setCard.orange);

  function handleClose() {
    onClose(null);
  }

  function handleSubmit() {
    onClose({ red, green, purple, orange });
  }

  function handleReset() {
    const resetTo = theme.palette.type === "light" ? lightTheme : darkTheme;
    setRed(resetTo.setCard.red);
    setGreen(resetTo.setCard.green);
    setPurple(resetTo.setCard.purple);
    setOrange(resetTo.setCard.orange);
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <ThemeProvider theme={withCardColors(theme, { red, green, purple })}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3} className={classes.colorPickerColumn}>
              <ResponsiveSetCard width={225} value="0000" />
              <ChromePicker
                color={purple}
                onChangeComplete={(result) => setPurple(result.hex)}
              />
            </Grid>
            <Grid item xs={12} md={3} className={classes.colorPickerColumn}>
              <ResponsiveSetCard width={225} value="1000" />
              <ChromePicker
                color={green}
                onChangeComplete={(result) => setGreen(result.hex)}
              />
            </Grid>
            <Grid item xs={12} md={3} className={classes.colorPickerColumn}>
              <ResponsiveSetCard width={225} value="2000" />
              <ChromePicker
                color={red}
                onChangeComplete={(result) => setRed(result.hex)}
              />
            </Grid>
            <Grid item xs={12} md={3} className={classes.colorPickerColumn}>
              <ResponsiveSetCard width={225} value="3000" />
              <ChromePicker
                color={orange}
                onChangeComplete={(result) => setOrange(result.hex)}
              />
            </Grid>
          </Grid>
          <Grid container direction="row" justifyContent="center">
            <Button
              onClick={handleReset}
              variant="outlined"
              color="secondary"
              style={{ marginTop: "15px" }}
            >
              Set Colors to Default
            </Button>
          </Grid>
        </ThemeProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default withTheme(ColorChoiceDialog);
