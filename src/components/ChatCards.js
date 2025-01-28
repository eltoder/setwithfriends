import { memo } from "react";

import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

import SetCard from "./SetCard";
import User from "./User";
import { cardsFromEvent, checkSetUltra, conjugateCard, modes } from "../game";
import { formatTime } from "../util";

const useStyles = makeStyles((theme) => ({
  logEntry: {
    margin: "0.2em 0",
    padding: "0 12px",
    textAlign: "center",
    background: theme.setFoundEntry,
  },
  logEntryText: {
    display: "flex",
    justifyContent: "center",
    whiteSpace: "nowrap",
  },
  setCards: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  cardsColumn: {
    display: "flex",
    flexDirection: "column",
  },
}));

function ChatCards({ item, gameMode, startedAt }) {
  const classes = useStyles();
  const setType = modes[gameMode].setType;
  let cards = cardsFromEvent(item);
  if (setType === "UltraSet") {
    // Arrange cards in pairs and add the 5th card
    cards = checkSetUltra(...cards) || cards.slice();
    cards.splice(2, 0, conjugateCard(cards[0], cards[1]), null);
  }

  return (
    <Tooltip arrow placement="left" title={formatTime(item.time - startedAt)}>
      <div className={classes.logEntry}>
        <div className={classes.logEntryText}>
          <Typography variant="subtitle2" style={{ marginRight: "0.2em" }}>
            {setType} found by
          </Typography>
          <User
            component={Typography}
            noWrap={true}
            variant="subtitle2"
            id={item.user}
          />
        </div>
        <div className={classes.setCards}>
          {setType === "Set" &&
            cards.map((card) => <SetCard key={card} size="sm" value={card} />)}
          {(setType === "UltraSet" || setType === "GhostSet") &&
            Array.from(Array(3), (_, i) => (
              <div key={i} className={classes.cardsColumn}>
                <SetCard size="sm" value={cards[i * 2]} />
                {cards[i * 2 + 1] && (
                  <SetCard size="sm" value={cards[i * 2 + 1]} />
                )}
              </div>
            ))}
        </div>
      </div>
    </Tooltip>
  );
}

export default memo(ChatCards);
