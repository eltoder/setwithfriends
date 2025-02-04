import generate from "project-name-generator";
import { useContext, useMemo, useState } from "react";
import { Redirect } from "react-router-dom";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import Paper from "@material-ui/core/Paper";
import Tab from "@material-ui/core/Tab";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Tabs from "@material-ui/core/Tabs";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

import Chat from "../components/Chat";
import GameInfoRow from "../components/GameInfoRow";
import InternalLink from "../components/InternalLink";
import { UserContext } from "../context";
import firebase, { createGame } from "../firebase";
import useFirebaseQuery from "../hooks/useFirebaseQuery";
import useFirebaseRef from "../hooks/useFirebaseRef";
import useKeydown, { getModifierState } from "../hooks/useKeydown";
import useStorage from "../hooks/useStorage";

const useStyles = makeStyles((theme) => ({
  mainGrid: {
    "--table-height": "400px", // responsive variable
    [theme.breakpoints.up("sm")]: {
      "--table-height": "480px",
    },
    [theme.breakpoints.up("md")]: {
      "--table-height": "calc(min(100vh - 200px, 720px))",
    },
  },
  gamesTable: {
    height: "var(--table-height)",
    whiteSpace: "nowrap",
    "& td, & th": {
      paddingTop: 6,
      paddingBottom: 6,
      paddingLeft: 12,
      paddingRight: 12,
    },
    "& svg": {
      display: "block",
    },
    "& tbody > tr:hover": {
      background: theme.palette.action.hover,
      cursor: "pointer",
    },
  },
  lobbyTabs: {
    minHeight: 32,
    "& .MuiTab-root": {
      minHeight: 32,
      textTransform: "none",
      fontWeight: 400,
    },
  },
  gameCounters: {
    margin: "1.2em 0.2em 0.2em 0.2em",
    display: "flex",
    justifyContent: "space-between",
    [theme.breakpoints.down("sm")]: {
      order: -1,
      margin: "0 0.2em 1em 0.2em",
    },
  },
  actionButtons: {
    display: "flex",
    margin: "1em 0 1em 0",
    "& > button:first-of-type": {
      marginRight: "0.5em",
    },
    "& > button:last-of-type": {
      marginLeft: "0.5em",
    },
    [theme.breakpoints.down("sm")]: {
      marginBottom: "0.2em",
    },
  },
  chatColumn: {
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.up("md")]: {
      marginTop: 36,
    },
  },
  chatColumnPaper: {
    padding: 8,
    display: "flex",
    flexDirection: "column",
    "--chat-height": "calc(var(--table-height) - 16px)",
  },
  gamesColumn: {
    paddingBottom: "0 !important",
  },
}));

// Add separators to a large number, every 3 digits, while also displaying in
// a span that is styled with equal width numerals.
//   humanize(12345) -> "12,345"
function humanize(number) {
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {number.toLocaleString()}
    </span>
  );
}

function LobbyPage() {
  const user = useContext(UserContext);
  const classes = useStyles();
  const [redirect, setRedirect] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [gameMode] = useStorage("gameMode", "normal");
  const [practiceMode] = useStorage("practiceMode", "off");

  const gamesQuery = useMemo(() => {
    return firebase
      .database()
      .ref("/publicGames")
      .orderByValue()
      .limitToLast(35);
  }, []);
  const games = useFirebaseQuery(gamesQuery);

  const myGamesQuery = useMemo(() => {
    return firebase
      .database()
      .ref(`/userGames/${user.id}`)
      .orderByValue()
      .limitToLast(35);
  }, [user.id]);
  const myGames = useFirebaseQuery(myGamesQuery);

  const [stats, loadingStats] = useFirebaseRef("/stats");

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useKeydown((event) => {
    if (event.key === "Enter") {
      const mod = getModifierState(event);
      if (mod === "Control") {
        event.preventDefault();
        if (!waiting) {
          newRoom("public");
        }
      } else if (mod === "Shift") {
        event.preventDefault();
        if (!waiting) {
          newRoom("private");
        }
      }
    }
  });

  if (redirect) return <Redirect push to={redirect} />;

  async function newRoom(access) {
    // Make several attempts to create a game with an unused ID
    setWaiting(true);
    let attempts = 0;
    while (attempts < 5) {
      const gameId = generate({ words: 3 }).dashed;
      try {
        await createGame({
          gameId,
          access,
          mode: gameMode,
          enableHint: access === "private" && practiceMode === "on",
        });
      } catch (error) {
        if (error.code === "functions/already-exists") {
          // We generated an already-used game ID
          ++attempts;
          continue;
        } else {
          // Unspecified error occurred
          setWaiting(false);
          alert(error.toString());
          return;
        }
      }
      // Successful game creation
      firebase.analytics().logEvent("create_game", { gameId, access });
      setRedirect(`/room/${gameId}`);
      return;
    }
    // Unsuccessful game creation
    setWaiting(false);
    alert("Error: Could not find an available game ID.");
  }

  return (
    <Container>
      <Grid container spacing={2} className={classes.mainGrid}>
        <Box clone order={{ xs: 2, md: 1 }} className={classes.chatColumn}>
          <Grid item xs={12} sm={12} md={6}>
            <Paper className={classes.chatColumnPaper}>
              <Chat title="Lobby Chat" messageLimit={64} showMessageTimes />
            </Paper>
            <div className={classes.gameCounters}>
              <Typography variant="body2">
                <strong>
                  {loadingStats
                    ? "---"
                    : humanize((stats && stats.onlineUsers) || 0)}
                </strong>{" "}
                users online
              </Typography>
              <Typography variant="body2">
                <strong>
                  {loadingStats
                    ? "---,---"
                    : humanize((stats && stats.gameCount) || 0)}
                </strong>{" "}
                games played
              </Typography>
            </div>
          </Grid>
        </Box>
        <Box clone order={{ xs: 1, md: 2 }} className={classes.gamesColumn}>
          <Grid item xs={12} sm={12} md={6}>
            <Tabs
              className={classes.lobbyTabs}
              indicatorColor="secondary"
              textColor="secondary"
              variant="fullWidth"
              value={tabValue}
              onChange={handleTabChange}
            >
              <Tab label="Lobby" />
              <Tab label="Your games" />
            </Tabs>
            <TableContainer component={Paper} className={classes.gamesTable}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Host</TableCell>
                    <TableCell>Players</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.keys(tabValue === 0 ? games : myGames)
                    .reverse()
                    .map((gameId) => (
                      <GameInfoRow
                        key={gameId}
                        gameId={gameId}
                        onClick={() => {
                          if (!waiting) setRedirect(`/room/${gameId}`);
                        }}
                      />
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <div className={classes.actionButtons}>
              <Tooltip
                arrow
                placement="top"
                title={
                  "Create a new game, which will appear in the lobby. " +
                  "You can also invite your friends to join by link! (Ctrl+Enter)"
                }
              >
                <Button
                  variant="contained"
                  fullWidth
                  color="primary"
                  onClick={() => newRoom("public")}
                  disabled={waiting}
                >
                  New Game
                </Button>
              </Tooltip>
              <Tooltip
                arrow
                placement="top"
                title={
                  "Create a new private game. Only players you share " +
                  "the link with will be able to join. (Shift+Enter)"
                }
              >
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => newRoom("private")}
                  disabled={waiting}
                >
                  New Private Game
                </Button>
              </Tooltip>
            </div>
          </Grid>
        </Box>
      </Grid>
      <Typography variant="body1" align="center" style={{ padding: "16px 0" }}>
        <InternalLink to="/help">Help</InternalLink> •{" "}
        <InternalLink to="/about">About</InternalLink> •{" "}
        <InternalLink to="/conduct">Conduct</InternalLink> •{" "}
        <Link
          target="_blank"
          rel="noopener"
          href="https://github.com/eltoder/setwithfriends"
        >
          GitHub
        </Link>{" "}
        •{" "}
        <Link target="_blank" rel="noopener" href="https://discord.gg/XbjJyc9">
          Discord
        </Link>
      </Typography>
    </Container>
  );
}

export default LobbyPage;
