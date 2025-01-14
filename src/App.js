import { useState, useEffect, useMemo } from "react";
import firebase from "./firebase";
import "./styles.css";

import { BrowserRouter, Switch, Route } from "react-router-dom";
import CssBaseline from "@material-ui/core/CssBaseline";
import { ThemeProvider } from "@material-ui/core/styles";

import { generateColor, generateName, standardLayouts } from "./util";
import { UserContext, SettingsContext } from "./context";
import useStorage from "./hooks/useStorage";
import ConnectionsTracker from "./components/ConnectionsTracker";
import WelcomeDialog from "./components/WelcomeDialog";
import Navbar from "./components/Navbar";
import RoomPage from "./pages/RoomPage";
import GamePage from "./pages/GamePage";
import LobbyPage from "./pages/LobbyPage";
import LoadingPage from "./pages/LoadingPage";
import NotFoundPage from "./pages/NotFoundPage";
import BannedPage from "./pages/BannedPage";
import HelpPage from "./pages/HelpPage";
import AboutPage from "./pages/AboutPage";
import ConductPage from "./pages/ConductPage";
import LegalPage from "./pages/LegalPage";
import ProfilePage from "./pages/ProfilePage";
import { lightTheme, darkTheme, withCardColors } from "./themes";

function makeThemes(customColors) {
  let parsed;
  try {
    parsed = JSON.parse(customColors);
  } catch (error) {
    console.log("failed to parse custom colors", error);
    parsed = {};
  }
  return {
    parsedCustomColors: parsed,
    customLightTheme: withCardColors(lightTheme, parsed.light),
    customDarkTheme: withCardColors(darkTheme, parsed.dark),
  };
}

function makeKeyboardLayout(keyboardLayoutName, customKeyboardLayout) {
  const emptyLayout = { verticalLayout: "", horizontalLayout: "" };
  if (keyboardLayoutName !== "Custom") {
    return standardLayouts[keyboardLayoutName] || emptyLayout;
  }
  let parsed;
  try {
    parsed = JSON.parse(customKeyboardLayout);
  } catch (error) {
    console.log("failed to parse custom keyboard layout", error);
    parsed = {};
  }
  return { ...emptyLayout, ...parsed };
}

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [user, setUser] = useState(null);
  const [themeType, setThemeType] = useStorage("theme", "light");
  const [customColors, setCustomColors] = useStorage("customColors", "{}");
  const { parsedCustomColors, customLightTheme, customDarkTheme } = useMemo(
    () => makeThemes(customColors),
    [customColors]
  );
  const [keyboardLayoutName, setKeyboardLayoutName] = useStorage(
    "keyboardLayout",
    "QWERTY"
  );
  const [customKeyboardLayout, setCustomKeyboardLayout] = useStorage(
    "customKeyboardLayout",
    "{}"
  );
  const keyboardLayout = useMemo(
    () => makeKeyboardLayout(keyboardLayoutName, customKeyboardLayout),
    [keyboardLayoutName, customKeyboardLayout]
  );
  const [layoutOrientation, setLayoutOrientation] = useStorage(
    "layout",
    "portrait"
  );
  const [cardOrientation, setCardOrientation] = useStorage(
    "orientation",
    "vertical"
  );
  const [volume, setVolume] = useStorage("volume", "on");

  useEffect(() => {
    return firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // User is signed in.
        setAuthUser({ ...user._delegate });
      } else {
        // User is signed out.
        setAuthUser(null);
        firebase
          .auth()
          .signInAnonymously()
          .catch((error) => {
            alert("Unable to connect to the server. Please try again later.");
          });
      }
    });
  }, []);

  useEffect(() => {
    if (!authUser) {
      setUser(null);
      return;
    }
    const userRef = firebase.database().ref(`/users/${authUser.uid}`);
    function update(snapshot) {
      if (snapshot.child("name").exists()) {
        setUser({
          ...snapshot.val(),
          id: authUser.uid,
          authUser,
          setAuthUser,
        });
      } else {
        userRef.update({
          color: generateColor(),
          name: generateName(),
        });
      }
    }
    userRef.on("value", update);
    return () => {
      userRef.off("value", update);
    };
  }, [authUser]);

  const handleChangeTheme = () => {
    setThemeType(themeType === "light" ? "dark" : "light");
  };

  const handleCustomColors = (custom) => {
    setCustomColors(JSON.stringify(custom));
  };

  return (
    <ThemeProvider
      theme={themeType === "light" ? customLightTheme : customDarkTheme}
    >
      <BrowserRouter>
        <CssBaseline />
        {!user ? (
          <LoadingPage />
        ) : user.banned && Date.now() < user.banned ? (
          <BannedPage time={user.banned} />
        ) : (
          <UserContext.Provider value={user}>
            <SettingsContext.Provider
              value={{
                keyboardLayout,
                keyboardLayoutName,
                setKeyboardLayoutName,
                customKeyboardLayout,
                setCustomKeyboardLayout,
                volume,
                setVolume,
                layoutOrientation,
                setLayoutOrientation,
                cardOrientation,
                setCardOrientation,
              }}
            >
              <ConnectionsTracker />
              <WelcomeDialog />
              <Navbar
                themeType={themeType}
                handleChangeTheme={handleChangeTheme}
                customColors={parsedCustomColors}
                handleCustomColors={handleCustomColors}
              />
              <Switch>
                <Route exact path="/help" component={HelpPage} />
                <Route exact path="/about" component={AboutPage} />
                <Route exact path="/conduct" component={ConductPage} />
                <Route exact path="/legal" component={LegalPage} />
                <Route exact path="/" component={LobbyPage} />
                <Route exact path="/room/:id" component={RoomPage} />
                <Route exact path="/game/:id" component={GamePage} />
                <Route exact path="/profile/:id" component={ProfilePage} />
                <Route component={NotFoundPage} />
              </Switch>
            </SettingsContext.Provider>
          </UserContext.Provider>
        )}
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
