import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Redirect } from "react-router-dom";
import useSound from "use-sound";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Snackbar from "@material-ui/core/Snackbar";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

import failSfx1 from "../assets/failedSetSound1.mp3";
import failSfx2 from "../assets/failedSetSound2.mp3";
import failSfx3 from "../assets/failedSetSound3.mp3";
import foundSfx from "../assets/successfulSetSound.mp3";
import Chat from "../components/Chat";
import Game from "../components/Game";
import GameSidebar from "../components/GameSidebar";
import Loading from "../components/Loading";
import SnackContent from "../components/SnackContent";
import User from "../components/User";
import { SettingsContext, UserContext } from "../context";
import firebase, { createGame, finishGame } from "../firebase";
import {
  addCard,
  cardsFromEvent,
  computeState,
  eventFromCards,
  findSet,
  generateDeck,
  makeRandom,
  modes,
  removeCard,
} from "../game";
import useFirebaseRef from "../hooks/useFirebaseRef";
import useKeydown, { getKeyState } from "../hooks/useKeydown";
import { formatANoun, sleep } from "../util";
import LoadingPage from "./LoadingPage";
import NotFoundPage from "./NotFoundPage";

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
    alignItems: "top",
  },
  snackbar: {
    [theme.breakpoints.down("sm")]: {
      bottom: 4,
    },
  },
  doneOverlay: {
    position: "absolute",
    width: "calc(100% - 16px)",
    height: "calc(100% - 16px)",
    borderRadius: 4,
    background: "rgba(0, 0, 0, 0.5)",
    transition: "opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    zIndex: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  doneModal: {
    padding: theme.spacing(3),
    textAlign: "center",
  },
}));

function getNextGameId(gameId) {
  const idx = gameId.lastIndexOf("-");
  let id = gameId,
    num = 0;
  if (gameId.slice(idx + 1).match(/[0-9]+/)) {
    id = gameId.slice(0, idx);
    num = parseInt(gameId.slice(idx + 1));
  }
  return `${id}-${num + 1}`;
}

function ensureConnected() {
  return new Promise((resolve) => {
    const ref = firebase.database().ref(".info/connected");
    let wasConnected = true;
    const update = (snap) => {
      if (snap.val() === true) {
        ref.off("value", update);
        resolve(wasConnected);
      } else {
        wasConnected = false;
      }
    };
    ref.on("value", update);
  });
}

function GamePage({ match }) {
  const user = useContext(UserContext);
  const { volume, notifications, focusMode } = useContext(SettingsContext);
  const gameId = match.params.id;
  const nextGameId = useMemo(() => getNextGameId(gameId), [gameId]);
  const classes = useStyles();

  const [waiting, setWaiting] = useState(false);
  const [redirect, setRedirect] = useState(null);
  const [selected, setSelected] = useState([]);
  const clearSelected = useRef(false);
  const [snack, setSnack] = useState({ open: false });

  const [game, loadingGame] = useFirebaseRef(`games/${gameId}`);
  const [gameData, loadingGameData] = useFirebaseRef(`gameData/${gameId}`);
  const spectating = !(game?.users && user.id in game.users);
  const [hasNextGame] = useFirebaseRef(
    spectating && game?.status === "done" ? `games/${nextGameId}/status` : null
  );
  const [playSuccess] = useSound(foundSfx);
  const [playFail1] = useSound(failSfx1);
  const [playFail2] = useSound(failSfx2);
  const [playFail3] = useSound(failSfx3);
  const playFail = () =>
    [playFail1, playFail2, playFail3][Math.floor(Math.random() * 3)]();

  // Reset card selection on update to game events
  const numEvents = Object.keys(gameData?.events || {}).length;
  useEffect(() => {
    setSelected([]);
    clearSelected.current = false;
  }, [numEvents]);

  // Terminate the game if no sets are remaining
  const [finished, setFinished] = useState({ gameId: "", error: "" });
  useEffect(() => {
    if (finished.gameId === gameId) {
      // Attempt to finish the game a few times before giving up
      (async () => {
        const numRetries = 10;
        for (let i = 0; i < numRetries; i++) {
          try {
            await finishGame({ gameId });
            break;
          } catch (error) {
            if (i === numRetries - 1) {
              setFinished({ gameId, error: error + "" });
            } else if (await ensureConnected()) {
              await sleep(100 * Math.pow(1.5, i));
            }
          }
        }
      })();
    }
  }, [finished.gameId, gameId]);

  useKeydown((event) => {
    const { key, modifier } = getKeyState(event);
    if (modifier === "Control") {
      if (key === "enter") {
        event.preventDefault();
        handlePlayAgain();
      }
    } else if (modifier === "Control|Shift") {
      if (key === "P") {
        event.preventDefault();
        togglePause();
      } else if (key === "Q") {
        event.preventDefault();
        setRedirect("/");
      }
    }
  });

  const gameMode = game?.mode || "normal";
  const { random, deck } = useMemo(() => {
    const random = gameData?.seed && makeRandom(gameData.seed);
    return {
      random,
      deck: gameData?.deck ?? (random && generateDeck(gameMode, random)),
    };
  }, [gameMode, gameData?.deck, gameData?.seed]);

  const {
    current,
    scores,
    lastEvents,
    history,
    board,
    answer,
    findState,
    lastKeptSet,
  } = useMemo(() => {
    if (!gameData) return {};
    const state = computeState({ ...gameData, random, deck }, gameMode);
    const { current, boardSize, findState, history } = state;
    const board = current.slice(0, boardSize);
    const answer = findSet(board, gameMode, findState);
    const lastKeptSet =
      modes[gameMode].puzzle &&
      history.length &&
      !history[history.length - 1].kind
        ? cardsFromEvent(history[history.length - 1])
        : null;
    return { ...state, board, answer, lastKeptSet };
  }, [gameMode, gameData, random, deck]);

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

  const numHints = gameData.hints ?? 0;
  const paused = gameData.pause?.start && !gameData.pause.end;
  const leaderboard = Object.keys(game.users).sort(
    (u1, u2) =>
      (scores[u2] || 0) - (scores[u1] || 0) ||
      (lastEvents[u1] || 0) - (lastEvents[u2] || 0)
  );

  function handleSet(cards) {
    const event = eventFromCards(cards);
    firebase.analytics().logEvent("find_set", event);
    if (numHints) {
      firebase.database().ref(`gameData/${gameId}/hints`).remove();
    }
    firebase
      .database()
      .ref(`gameData/${gameId}/events`)
      .push({
        ...event,
        user: user.id,
        time: firebase.database.ServerValue.TIMESTAMP,
      });
  }

  const hint = game.enableHint && answer ? answer.slice(0, numHints) : null;
  const gameEnded = !answer || game.status === "done";
  const shouldFocus = focusMode === "on" && !spectating && !gameEnded;
  if (
    !answer &&
    !spectating &&
    game.status === "ingame" &&
    finished.gameId !== gameId
  ) {
    setFinished({ gameId, error: "" });
  }

  function handleClick(card) {
    if (gameEnded || paused) {
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
      if (clearSelected.current) {
        selected = [];
        clearSelected.current = false;
      }
      if (selected.includes(card)) {
        return gameMode === "memory" ? selected : removeCard(selected, card);
      }
      const state = addCard(selected, card, gameMode, findState);
      switch (state.kind) {
        case "pending":
          return state.cards;
        case "set":
          handleSet(state.cards);
          if (volume === "on") playSuccess();
          if (notifications === "on") {
            setSnack({
              open: true,
              variant: "success",
              message: `Found ${formatANoun(state.setType)}`,
            });
          }
          return [];
        case "error":
          if (volume === "on") playFail();
          if (notifications === "on") {
            setSnack({
              open: true,
              variant: "error",
              message: state.error,
            });
          }
          if (gameMode === "memory") {
            clearSelected.current = true;
            return state.cards;
          }
          return [];
        // no default
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
    if (!game.enableHint || gameEnded || paused) {
      return;
    }
    firebase
      .database()
      .ref(`gameData/${gameId}/hints`)
      .set(numHints + 1);
  }

  function togglePause() {
    if (!game.enableHint || gameEnded) {
      return;
    }
    firebase
      .database()
      .ref(`gameData/${gameId}/pause`)
      .transaction((pause) => {
        pause ??= {};
        if (pause.end) {
          pause.previous = (pause.previous ?? 0) + (pause.end - pause.start);
          pause.start = pause.end = null;
        }
        pause[pause.start ? "end" : "start"] =
          firebase.database.ServerValue.TIMESTAMP;
        return pause;
      });
  }

  async function handlePlayAgain() {
    if (game?.status !== "done" || (spectating && !hasNextGame) || waiting) {
      return;
    }
    if (!spectating) {
      setWaiting(true);
      const newGame = {
        gameId: nextGameId,
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
    }
    setRedirect(`/room/${nextGameId}`);
  }

  return (
    <Container>
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        classes={{ root: classes.snackbar }}
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
            {shouldFocus || (
              <Paper style={{ display: "flex", height: "100%", padding: 8 }}>
                <Chat
                  title="Game Chat"
                  messageLimit={200}
                  gameId={gameId}
                  history={history}
                  startedAt={game.startedAt}
                  gameMode={gameMode}
                  isPlaying={!spectating}
                />
              </Paper>
            )}
          </Grid>
        </Box>
        <Box clone order={{ xs: 1, sm: 2 }} position="relative">
          <Grid item xs={12} sm={8} md={6} className={classes.mainColumn}>
            {/* Backdrop; active when the game ends or is paused */}
            <div
              className={classes.doneOverlay}
              style={{ display: gameEnded || paused ? "flex" : "none" }}
            >
              <Paper elevation={3} className={classes.doneModal}>
                <Typography variant="h5" gutterBottom>
                  The game {gameEnded ? "has ended" : "is paused"}.
                </Typography>
                {!gameEnded ? null : game.status !== "done" ? (
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
                    {(!spectating || hasNextGame) && (
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
                          {waiting ? (
                            <Loading />
                          ) : spectating ? (
                            "Next Game"
                          ) : (
                            "Play Again"
                          )}
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                )}
              </Paper>
            </div>

            {/* Game area itself */}
            <Game
              board={board}
              selected={selected}
              onClick={handleClick}
              onClear={handleClear}
              lastSet={findState.lastSet}
              lastKeptSet={lastKeptSet}
              answer={hint}
              remaining={current.length - board.length}
              faceDown={paused ? "all" : gameMode === "memory" ? "deal" : ""}
            />
          </Grid>
        </Box>
        <Box clone order={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} md={3} className={classes.sideColumn}>
            {shouldFocus || (
              <Box order={{ xs: 2, md: 1 }} style={{ maxHeight: "100%" }}>
                <GameSidebar
                  game={game}
                  scores={scores}
                  leaderboard={leaderboard}
                  pause={gameData.pause}
                  endedAt={
                    game.status === "done"
                      ? game.endedAt
                      : !answer && history.length > 0
                        ? history[history.length - 1].time
                        : 0
                  }
                />
              </Box>
            )}
            {game.enableHint && (
              <Box order={{ xs: 1, md: 2 }}>
                <Box mt={{ xs: 0, md: 2 }} mb={1}>
                  <Button
                    size="large"
                    variant="contained"
                    fullWidth
                    disabled={user.id !== game.host || gameEnded}
                    onClick={togglePause}
                  >
                    {paused ? "Resume" : "Pause"} Game
                  </Button>
                </Box>
                <Box mb={2}>
                  <Button
                    size="large"
                    variant="contained"
                    fullWidth
                    disabled={
                      user.id !== game.host ||
                      paused ||
                      gameEnded ||
                      numHints >= answer.length
                    }
                    onClick={handleAddHint}
                  >
                    Add hint: {numHints}
                  </Button>
                </Box>
              </Box>
            )}
          </Grid>
        </Box>
      </Grid>
    </Container>
  );
}

export default GamePage;
