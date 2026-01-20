import { useContext, useEffect, useState } from "react";
import { Redirect, useHistory } from "react-router-dom";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import DoneIcon from "@material-ui/icons/Done";
import LinkIcon from "@material-ui/icons/Link";

import Chat from "../components/Chat";
import GameSettings from "../components/GameSettings";
import RoomUserList from "../components/RoomUserList";
import SimpleInput from "../components/SimpleInput";
import Subheading from "../components/Subheading";
import { UserContext } from "../context";
import firebase from "../firebase";
import useFirebaseRef from "../hooks/useFirebaseRef";
import useKeydown, { getModifierState } from "../hooks/useKeydown";
import { capitalizeFirst } from "../util";
import LoadingPage from "./LoadingPage";
import NotFoundPage from "./NotFoundPage";

const useStyles = makeStyles((theme) => ({
  subpanel: {
    background: theme.palette.background.panel,
    padding: theme.spacing(1),
    borderRadius: 4,
  },
  shareLink: {
    display: "flex",
    alignItems: "center",
    "& > input": {
      flexGrow: 1,
      color: theme.palette.secondary.main,
    },
  },
  chatPanel: {
    display: "flex",
    flexDirection: "column",
    height: 400,
    padding: 8,
  },
}));

function RoomPage({ match, location }) {
  const user = useContext(UserContext);
  const gameId = match.params.id;
  const classes = useStyles();
  const history = useHistory();

  const [copiedLink, setCopiedLink] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [game, loadingGame] = useFirebaseRef(`games/${gameId}`);

  useEffect(() => {
    if (
      !leaving &&
      game?.status === "waiting" &&
      (!game.users || !(user.id in game.users))
    ) {
      const updates = {
        [`games/${gameId}/users/${user.id}`]:
          firebase.database.ServerValue.TIMESTAMP,
        [`userGames/${user.id}/${gameId}`]: game.createdAt,
      };
      firebase
        .database()
        .ref()
        .update(updates)
        .then(() => firebase.analytics().logEvent("join_game", { gameId }))
        .catch((reason) => {
          console.warn(`Failed to join game (${reason})`);
        });
    }
  }, [user.id, game, gameId, leaving]);

  useKeydown((event) => {
    const mod = getModifierState(event);
    if (event.key === "Enter" && mod === "Control") {
      event.preventDefault();
      startGame();
    }
  });

  if (loadingGame) {
    return <LoadingPage />;
  }

  if (!game) {
    return <NotFoundPage />;
  }

  if (game.status !== "waiting" && !leaving) {
    return <Redirect to={`/game/${gameId}`} />;
  }

  // Current href, without the query string or hash
  const link = window.location.origin + location.pathname;

  function handleCopy() {
    navigator.clipboard.writeText(link).then(() => setCopiedLink(true));
  }

  function startGame() {
    if (leaving || user.id !== game?.host) {
      return;
    }
    firebase.database().ref(`games/${gameId}`).update({
      status: "ingame",
      startedAt: firebase.database.ServerValue.TIMESTAMP,
    });
  }

  function leaveGame() {
    setLeaving(true);
    const updates = {
      [`games/${gameId}/users/${user.id}`]: null,
      [`userGames/${user.id}/${gameId}`]: null,
    };
    firebase
      .database()
      .ref()
      .update(updates)
      .then(() => history.push("/"))
      .catch((reason) => {
        console.warn(`Failed to leave game (${reason})`);
        setLeaving(false);
      });
  }

  return (
    <Container>
      <Grid container spacing={2}>
        <Box clone order={{ xs: 2, sm: 1 }}>
          <Grid item xs={12} sm={4} md={3}>
            <Paper className={classes.chatPanel}>
              <Chat
                title="Game Chat"
                messageLimit={200}
                gameId={gameId}
                isPlaying={true}
                showMessageTimes
              />
            </Paper>
          </Grid>
        </Box>
        <Box clone order={{ xs: 1, sm: 2 }}>
          <Grid item xs={12} sm={8} md={9}>
            <Paper style={{ padding: 16 }}>
              <Typography variant="h4" gutterBottom>
                Waiting Room{" "}
                <Tooltip
                  placement="right"
                  title={
                    game.access === "public"
                      ? "Anyone can join this game."
                      : "Only players with the link can join this game."
                  }
                >
                  <span style={{ opacity: 0.4 }}>
                    [{capitalizeFirst(game.access)}]
                  </span>
                </Tooltip>
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} md={6}>
                  <div className={classes.subpanel}>
                    <Subheading>Players</Subheading>
                    <RoomUserList game={game} gameId={gameId} />
                  </div>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <div className={classes.subpanel}>
                        <Subheading>Game Settings</Subheading>
                        <GameSettings
                          game={game}
                          gameId={gameId}
                          userId={user.id}
                        />
                      </div>
                    </Grid>
                    <Grid item xs={12}>
                      <div className={classes.subpanel}>
                        <Subheading>Inviting Friends</Subheading>
                        <Typography variant="body1">
                          To invite someone to play, share this URL:
                          <span className={classes.shareLink}>
                            <SimpleInput
                              readOnly
                              value={link}
                              onFocus={(event) => event.target.select()}
                            />
                            <Tooltip
                              placement="top"
                              title={copiedLink ? "Link copied" : "Copy link"}
                            >
                              <IconButton onClick={handleCopy}>
                                {copiedLink ? <DoneIcon /> : <LinkIcon />}
                              </IconButton>
                            </Tooltip>
                          </span>
                        </Typography>
                      </div>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Box marginTop={2}>
                {user.id === game.host ? (
                  <Tooltip
                    arrow
                    title={
                      "Make sure everyone is in the waiting room! Additional players " +
                      "won't be able to join after the game has started. (Ctrl+Enter)"
                    }
                  >
                    <Button
                      size="large"
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={startGame}
                    >
                      Start game
                    </Button>
                  </Tooltip>
                ) : (
                  <Tooltip
                    arrow
                    title="Currently waiting for the host to start the game. You can leave by pressing this button."
                  >
                    <Button
                      size="large"
                      variant="outlined"
                      fullWidth
                      disabled={leaving}
                      onClick={leaveGame}
                    >
                      Leave game
                    </Button>
                  </Tooltip>
                )}
              </Box>
            </Paper>
          </Grid>
        </Box>
      </Grid>
    </Container>
  );
}

export default RoomPage;
