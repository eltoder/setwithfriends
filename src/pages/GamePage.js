import { useState, useEffect, useMemo, useContext } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import Snackbar from "@material-ui/core/Snackbar";
import Tooltip from "@material-ui/core/Tooltip";
import { Redirect } from "react-router-dom";
import useSound from "use-sound";

import SnackContent from "../components/SnackContent";
import firebase, { createGame, finishGame } from "../firebase";
import useFirebaseRef from "../hooks/useFirebaseRef";
import useKeydown from "../hooks/useKeydown";
import Game from "../components/Game";
import User from "../components/User";
import Loading from "../components/Loading";
import NotFoundPage from "./NotFoundPage";
import LoadingPage from "./LoadingPage";
import GameSidebar from "../components/GameSidebar";
import Chat from "../components/Chat";
import { SettingsContext, UserContext } from "../context";
import {
  removeCard,
  checkSet,
  checkSetUltra,
  findSet,
  computeState,
  hasHint,
  cardsInSet,
} from "../game";
import foundSfx from "../assets/successfulSetSound.mp3";
import failSfx from "../assets/failedSetSound.mp3";

const useStyles = makeStyles((theme) => ({
  sideColumn: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    [theme.breakpoints.up("md")]: {
      maxHeight: 543,
    },
    [theme.breakpoints.down("sm")]: {
      maxHeight: 435,
    },
    [theme.breakpoints.down("xs")]: {
      maxHeight: 400,
    },
  },
  mainColumn: {
    display: "flex",
    alignItems: "center",
  },
  doneOverlay: {
    position: "absolute",
    width: "calc(100% - 16px)",
    height: "calc(100% - 16px)",
    borderRadius: 4,
    background: "rgba(0, 0, 0, 0.5)",
    transition: "opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    zIndex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  doneModal: {
    padding: theme.spacing(3),
    textAlign: "center",
  },
}));

function GamePage({ match }) {
  const user = useContext(UserContext);
  const { volume } = useContext(SettingsContext);
  const gameId = match.params.id;
  const classes = useStyles();

  const [waiting, setWaiting] = useState(false);
  const [redirect, setRedirect] = useState(null);
  const [selected, setSelected] = useState([]);
  const [snack, setSnack] = useState({ open: false });
  const [numHints, setNumHints] = useState(0);

  const [game, loadingGame] = useFirebaseRef(`games/${gameId}`);
  const [gameData, loadingGameData] = useFirebaseRef(`gameData/${gameId}`);
  const [playSuccess] = useSound(foundSfx);
  const [playFail] = useSound(failSfx);

  // Reset card selection and number of hints on update to game data
  useEffect(() => {
    setSelected([]);
    setNumHints(0);
  }, [gameData]);

  // Terminate the game if no sets are remaining
  const [finished, setFinished] = useState({ gameId: "", error: "" });
  useEffect(() => {
    if (finished.gameId === gameId) {
      // Attempt to finish the game a few times before giving up
      (async () => {
        const numRetries = 8;
        for (let i = 0; i < numRetries; i++) {
          try {
            await finishGame({ gameId });
            break;
          } catch (error) {
            if (i === numRetries - 1) {
              setFinished({ gameId, error: error + "" });
            } else {
              const delay = 100 * Math.pow(2, i);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }
      })();
    }
  }, [finished.gameId, gameId]);

  useKeydown((event) => {
    if (event.key === "Enter" && event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      if (game?.status === "done" && !(spectating || waiting)) {
        handlePlayAgain();
      }
    }
  });

  const gameMode = game?.mode || "normal";
  const { current, scores, lastEvents, history, boardSize } = useMemo(() => {
    return gameData ? computeState(gameData, gameMode) : {};
  }, [gameData, gameMode]);

  if (redirect) return <Redirect push to={redirect} />;

  if (loadingGame || loadingGameData) {
    return <LoadingPage />;
  }

  if (!game || !gameData) {
    return <NotFoundPage />;
  }

  if (game.status === "waiting") {
    return (
      <Container>
        <Box p={4}>
          <Typography variant="h4" align="center">
            Waiting for the game to start...
          </Typography>
        </Box>
      </Container>
    );
  }

  const spectating = !game.users || !(user.id in game.users);
  const maxNumHints = cardsInSet(gameMode);
  const leaderboard = Object.keys(game.users).sort(
    (u1, u2) =>
      (scores[u2] || 0) - (scores[u1] || 0) ||
      (lastEvents[u1] || 0) - (lastEvents[u2] || 0)
  );

  function handleSet(cards) {
    const event = { c1: cards[0], c2: cards[1], c3: cards[2] };
    if (cards.length === 4) event.c4 = cards[3];
    firebase.analytics().logEvent("find_set", event);
    firebase
      .database()
      .ref(`gameData/${gameId}/events`)
      .push({
        ...event,
        user: user.id,
        time: firebase.database.ServerValue.TIMESTAMP,
      });
  }

  let lastSet = [];
  if (gameMode === "setchain" && history.length > 0) {
    const { c1, c2, c3 } = history[history.length - 1];
    lastSet = [c1, c2, c3];
  }
  const answer = findSet(current.slice(0, boardSize), gameMode, lastSet);
  const hint = hasHint(game) && answer ? answer.slice(0, numHints) : null;
  const gameEnded = !answer || game.status === "done";
  if (
    !answer &&
    game.users &&
    user.id in game.users &&
    game.status === "ingame" &&
    finished.gameId !== gameId
  ) {
    setFinished({ gameId, error: "" });
  }

  function handleClick(card) {
    if (game.status !== "ingame") {
      return;
    }
    if (spectating) {
      setSnack({
        open: true,
        variant: "warning",
        message: "You are spectating!",
      });
      return;
    }
    setSelected((selected) => {
      if (selected.includes(card)) {
        return removeCard(selected, card);
      } else {
        if (gameMode === "normal") {
          const vals = [...selected, card];
          if (vals.length === 3) {
            if (checkSet(...vals)) {
              handleSet(vals);
              if (volume === "on") playSuccess();
              setSnack({
                open: true,
                variant: "success",
                message: "Found a set!",
              });
            } else {
              if (volume === "on") playFail();
              setSnack({
                open: true,
                variant: "error",
                message: "Not a set!",
              });
            }
            return [];
          } else {
            return vals;
          }
        } else if (gameMode === "ultraset" || gameMode === "ultra9") {
          const vals = [...selected, card];
          if (vals.length === 4) {
            let res = checkSetUltra(...vals);
            if (res) {
              handleSet(res);
              if (volume === "on") playSuccess();
              setSnack({
                open: true,
                variant: "success",
                message: "Found an UltraSet!",
              });
            } else {
              if (volume === "on") playFail();
              setSnack({
                open: true,
                variant: "error",
                message: "Not an UltraSet!",
              });
            }
            return [];
          } else {
            return vals;
          }
        } else if (gameMode === "setchain") {
          let vals = [];
          if (lastSet.includes(card)) {
            if (selected.length > 0 && lastSet.includes(selected[0])) {
              return [card, ...selected.slice(1)];
            } else {
              vals = [card, ...selected];
            }
          } else {
            vals = [...selected, card];
          }
          if (vals.length === 3) {
            if (lastSet.length > 0 && !lastSet.includes(vals[0])) {
              if (volume === "on") playFail();
              setSnack({
                open: true,
                variant: "error",
                message: "One card must be from the previous set!",
              });
            } else if (checkSet(...vals)) {
              handleSet(vals);
              if (volume === "on") playSuccess();
              setSnack({
                open: true,
                variant: "success",
                message: "Found a set chain!",
              });
            } else {
              if (volume === "on") playFail();
              setSnack({
                open: true,
                variant: "error",
                message: "Not a set chain!",
              });
            }
            return [];
          } else {
            return vals;
          }
        }
      }
    });
  }

  function handleClear() {
    setSelected([]);
  }

  function handleClose(event, reason) {
    if (reason === "clickaway") return;
    setSnack({ ...snack, open: false });
  }

  function handleAddHint() {
    setNumHints((numHints) => {
      if (numHints === maxNumHints) {
        return numHints;
      }
      return numHints + 1;
    });
  }

  async function handlePlayAgain() {
    const idx = gameId.lastIndexOf("-");
    let id = gameId,
      num = 0;
    if (gameId.slice(idx + 1).match(/[0-9]+/)) {
      id = gameId.slice(0, idx);
      num = parseInt(gameId.slice(idx + 1));
    }
    setWaiting(true);
    const newId = `${id}-${num + 1}`;
    const newGame = {
      gameId: newId,
      access: game.access,
      mode: game.mode,
      enableHint: game.enableHint,
    };
    firebase.analytics().logEvent("play_again", newGame);
    try {
      await createGame(newGame);
    } catch (error) {
      if (error.code !== "functions/already-exists") {
        alert(error.toString());
        setWaiting(false);
        return;
      }
    }
    setRedirect(`/room/${newId}`);
  }

  return (
    <Container>
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        open={snack.open}
        autoHideDuration={2000}
        onClose={handleClose}
      >
        <SnackContent
          variant={snack.variant || "info"}
          message={snack.message || ""}
          onClose={handleClose}
        />
      </Snackbar>
      <Grid container spacing={2}>
        <Box clone order={{ xs: 3, sm: 1 }}>
          <Grid item xs={12} sm={4} md={3} className={classes.sideColumn}>
            <Paper style={{ display: "flex", height: "100%", padding: 8 }}>
              <Chat
                title="Game Chat"
                messageLimit={200}
                gameId={gameId}
                history={history}
                startedAt={game.startedAt}
                gameMode={gameMode}
              />
            </Paper>
          </Grid>
        </Box>
        <Box clone order={{ xs: 1, sm: 2 }} position="relative">
          <Grid item xs={12} sm={8} md={6} className={classes.mainColumn}>
            {/* Backdrop, to be active when the game ends */}
            <div
              className={classes.doneOverlay}
              style={{
                opacity: gameEnded ? 1 : 0,
                visibility: gameEnded ? "visible" : "hidden",
              }}
            >
              <Paper elevation={3} className={classes.doneModal}>
                <Typography variant="h5" gutterBottom>
                  The game has ended.
                </Typography>
                {game.status !== "done" ? (
                  finished.error || <Loading />
                ) : (
                  <div>
                    <Typography variant="body1">
                      Winner: <User id={leaderboard[0]} />
                    </Typography>
                    {leaderboard.length >= 2 && (
                      <Typography variant="body2">
                        Runner-up: <User id={leaderboard[1]} />
                      </Typography>
                    )}
                    {!spectating && (
                      <Tooltip
                        placement="top"
                        title="Create or join a new game with the same settings. (Ctrl+Enter)"
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handlePlayAgain}
                          style={{ marginTop: 12 }}
                          disabled={waiting}
                        >
                          {waiting ? <Loading /> : "Play Again"}
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                )}
              </Paper>
            </div>

            {/* Game area itself */}
            <Game
              deck={current}
              boardSize={boardSize}
              selected={selected}
              onClick={handleClick}
              onClear={handleClear}
              gameMode={gameMode}
              lastSet={lastSet}
              answer={hint}
            />
          </Grid>
        </Box>
        <Box clone order={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} md={3} className={classes.sideColumn}>
            <GameSidebar
              game={game}
              scores={scores}
              leaderboard={leaderboard}
              endedAt={
                game.status === "done"
                  ? game.endedAt
                  : !answer && history.length > 0
                  ? history[history.length - 1].time
                  : 0
              }
            />
            <Box mt={1}>
              {hasHint(game) && (
                <Button
                  size="large"
                  variant="outlined"
                  color="primary"
                  fullWidth
                  disabled={numHints === maxNumHints || !hint || gameEnded}
                  onClick={handleAddHint}
                >
                  Add hint: {numHints}
                </Button>
              )}
            </Box>
          </Grid>
        </Box>
      </Grid>
    </Container>
  );
}

export default GamePage;
