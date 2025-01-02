import { createTheme } from "@material-ui/core/styles";
import { blueGrey } from "@material-ui/core/colors";
import { grey } from "@material-ui/core/colors";
import { indigo } from "@material-ui/core/colors";
import { lightBlue } from "@material-ui/core/colors";
import { red } from "@material-ui/core/colors";
import snowLightImage from "./assets/snow.jpg";
import snowDarkImage from "./assets/snow-dark.jpg";

export const darkTheme = createTheme({
  palette: {
    type: "dark",
    primary: {
      light: "#c5cae9",
      main: "#8c9eff",
      dark: "#536dfe",
    },
    secondary: {
      light: "#ff80ac",
      main: "#ff4284",
      dark: "#c51162",
    },
    action: {
      hover: "#363636",
    },
    success: {
      light: "#81c784",
      main: "#a5d6a7",
      dark: "#82c483",
    },
    background: {
      panel: "#303030",
      paper: "#262626",
      default: "#161616",
    },
  },
  input: {
    textColor: "#fff",
    caretColor: "#fff",
    background: "#262626",
  },
  mentioned: {
    background: "#383838",
    border: "#ffd700",
  },
  pie: {
    noGames: "#rgba(0, 0, 0, 0.12)",
  },
  setCard: {
    purple: "#ff47ff",
    green: "#00b803",
    red: "#ffb047",
    background: "#262626",
    hinted: "#455A64",
    backColors: [
      grey[900],
      grey[800],
      grey[700],
      grey[600],
      grey[500],
      "#262626",
    ],
    backColorsHinted: [
      blueGrey[900],
      blueGrey[800],
      blueGrey[700],
      blueGrey[600],
      blueGrey[500],
      "#262626",
    ],
  },
  alarm: red[700],
  profileTable: {
    row: "#282828",
  },
  setFoundEntry: "rgba(130, 170, 100, 0.15)",
  overrides: {
    MuiCssBaseline: {
      "@global": {
        body: {
          backgroundImage: `url("${snowDarkImage}")`,
        },
      },
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    type: "light",
    background: {
      panel: "#fafafa",
      paper: "#fff",
      default: "#fafafa",
    },
    success: {
      light: "#81c784",
      main: "#4caf50",
      dark: "#388e3c",
    },
  },
  input: {
    textColor: "black",
    caretColor: "black",
    background: "#fff",
  },
  mentioned: {
    background: "#fffedc",
    border: "#ffd700",
  },
  pie: {
    noGames: "rgba(0, 0, 0, 0.12)",
  },
  setCard: {
    purple: "#800080",
    green: "#008002",
    red: "#ff0101",
    background: "#fff",
    hinted: "#E1F5FE",
    backColors: [
      indigo[600],
      indigo[300],
      indigo[200],
      indigo[200],
      indigo[50],
      "#fff",
    ],
    backColorsHinted: [
      lightBlue[600],
      lightBlue[300],
      lightBlue[200],
      lightBlue[200],
      lightBlue[50],
      "#fff",
    ],
  },
  alarm: red[700],
  profileTable: {
    row: "#fff",
  },
  setFoundEntry: "rgba(130, 170, 100, 0.15)",
  overrides: {
    MuiCssBaseline: {
      "@global": {
        body: {
          backgroundImage: `url("${snowLightImage}")`,
        },
      },
    },
  },
});
