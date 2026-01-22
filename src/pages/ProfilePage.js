import { useEffect, useMemo, useState } from "react";
import { Redirect } from "react-router-dom";

import Container from "@material-ui/core/Container";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import EqualizerIcon from "@material-ui/icons/Equalizer";

import Loading from "../components/Loading";
import ProfileGamesTable from "../components/ProfileGamesTable";
import ProfileName from "../components/ProfileName";
import Subheading from "../components/Subheading";
import UserStatistics from "../components/UserStatistics";
import firebase from "../firebase";
import { computeState, modes } from "../game";
import useFirebaseRefs from "../hooks/useFirebaseRefs";
import useStats from "../hooks/useStats";
import LoadingPage from "./LoadingPage";

const datasetVariants = {
  all: {
    label: "All Games",
    filterFn: (game) => true,
  },
  solo: {
    label: "Solo Games",
    filterFn: (game) => Object.keys(game.users).length === 1,
  },
  multiplayer: {
    label: "Multiplayer Games",
    filterFn: (game) => Object.keys(game.users).length > 1,
  },
};

const gameModes = {
  all: { name: "All Modes" },
  ...modes,
};

const useStyles = makeStyles((theme) => ({
  statsHeading: {
    // Pixel-perfect corrections for icon alignment
    paddingTop: 4,
    [theme.breakpoints.down("xs")]: {
      paddingTop: 3,
    },
  },
  divider: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  mainGrid: {
    marginBottom: theme.spacing(1),
  },
}));

function mergeGameData(game, gameData) {
  const { scores } = computeState(gameData, game.mode || "normal");
  const topScore = Math.max(0, ...Object.values(scores));
  return {
    ...game,
    ...gameData,
    topScore,
    scores,
  };
}

function ProfilePage({ match }) {
  const userId = match.params.id;
  const classes = useStyles();

  const [games, setGames] = useState(null);
  useEffect(() => {
    const query = firebase
      .database()
      .ref(`/userGames/${userId}`)
      .orderByValue()
      .limitToLast(100);
    const update = (snapshot) => {
      query.off("value", update);
      setGames(snapshot.val() ?? {});
    };
    query.on("value", update);
    return () => {
      query.off("value", update);
    };
  }, [userId]);

  const [stats, loadingStats] = useStats(userId);
  const [redirect, setRedirect] = useState(null);
  const [variant, setVariant] = useState("all");
  const [modeVariant, setModeVariant] = useState("all");

  const handleClickGame = (gameId) => {
    setRedirect(`/room/${gameId}`);
  };

  const gameIds = useMemo(() => (games ? Object.keys(games) : []), [games]);
  const [gameVals, loadingGameVals] = useFirebaseRefs(
    useMemo(() => gameIds.map((gameId) => `games/${gameId}`), [gameIds]),
    true
  );
  const [gameDataVals, loadingGameDataVals] = useFirebaseRefs(
    useMemo(() => gameIds.map((gameId) => `gameData/${gameId}`), [gameIds]),
    true
  );

  if (redirect) {
    return <Redirect push to={redirect} />;
  }

  let gamesData = null;
  if (!loadingGameVals && !loadingGameDataVals) {
    gamesData = {};
    for (let i = 0; i < gameIds.length; i++) {
      const game = gameVals[i];
      if (!game || !gameDataVals[i]) {
        continue;
      }
      if (
        game.status === "done" &&
        (modeVariant === "all" || (game.mode || "normal") === modeVariant) &&
        datasetVariants[variant].filterFn(game)
      ) {
        gamesData[gameIds[i]] = mergeGameData(game, gameDataVals[i]);
      }
    }
  }

  return (
    <Container>
      <Paper style={{ padding: 16 }}>
        <Grid container className={classes.mainGrid}>
          <Grid item xs={12} md={4}>
            <ProfileName userId={userId} />
          </Grid>
          <Divider
            orientation="vertical"
            variant="middle"
            flexItem
            className={classes.divider}
          />
          <Grid item xs={12} style={{ flex: 1 }} p={1}>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <div style={{ display: "flex" }}>
                <Subheading className={classes.statsHeading}>
                  Statistics
                </Subheading>
                <EqualizerIcon />
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Select
                  value={modeVariant}
                  onChange={(event) => setModeVariant(event.target.value)}
                  style={{ marginRight: "1em" }}
                  color="secondary"
                >
                  {Object.entries(gameModes).map(([key, { name }]) => (
                    <MenuItem key={key} value={key}>
                      <Typography variant="body2">{name}</Typography>
                    </MenuItem>
                  ))}
                </Select>
                <Select
                  value={variant}
                  onChange={(event) => setVariant(event.target.value)}
                  color="secondary"
                >
                  {Object.entries(datasetVariants).map(([key, { label }]) => (
                    <MenuItem key={key} value={key}>
                      <Typography variant="body2">{label}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </div>
            {loadingStats ? (
              <Loading />
            ) : (
              <UserStatistics stats={stats[modeVariant]} variant={variant} />
            )}
          </Grid>
        </Grid>
        <Subheading style={{ textAlign: "left" }}>Finished Games</Subheading>
        <ProfileGamesTable
          userId={userId}
          handleClickGame={handleClickGame}
          gamesData={gamesData}
        />
      </Paper>
    </Container>
  );
}

export default ProfilePage;
