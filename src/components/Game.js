import { useContext, useEffect, useMemo, useState } from "react";

import Divider from "@material-ui/core/Divider";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import { animated, to, useTransition } from "@react-spring/web";

import ResponsiveSetCard from "../components/ResponsiveSetCard";
import { SettingsContext } from "../context";
import useDimensions from "../hooks/useDimensions";
import useKeydown, { getKeyState } from "../hooks/useKeydown";

const useStyles = makeStyles({
  staticCard: {
    position: "absolute",
  },
  movingCard: {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 1,
    "& > div": {
      backgroundColor: "transparent !important",
    },
  },
});

const gamePadding = 8;

function addLastSet(board, lastSet) {
  if (lastSet?.length) {
    const n = lastSet?.length % 3;
    if (n > 0) {
      lastSet = [...lastSet, null];
      if (n === 1) lastSet.splice(-3, 0, null);
    }
    board = lastSet.concat(board);
  }
  return [board, lastSet];
}

function Game({
  board,
  onClick,
  onClear,
  selected,
  answer,
  lastSet,
  lastKeptSet,
  faceDown,
  showShortcuts,
  remaining = -1,
}) {
  const classes = useStyles();
  const { keyboardLayout, layoutOrientation, cardOrientation } =
    useContext(SettingsContext);
  const isHorizontal = cardOrientation === "horizontal";
  const isLandscape = layoutOrientation === "landscape";
  const [gameDimensions, gameEl] = useDimensions();
  const [movingCards, setMovingCards] = useState(null);

  const lastKeptCards = lastKeptSet?.join("|");
  useEffect(() => {
    setMovingCards(lastKeptCards?.split("|").map((card) => " " + card));
    if (lastKeptCards) {
      const timer = setTimeout(() => setMovingCards(null), 0);
      return () => clearTimeout(timer);
    }
  }, [lastKeptCards]);

  [board, lastSet] = useMemo(
    () => addLastSet(board, lastSet),
    [board, lastSet]
  );

  const lastSetSize = lastSet?.length ?? 0;
  const lastSetRows = Math.ceil(lastSetSize / 3);
  const lineSpacing = lastSetSize ? 2 * gamePadding : 0;

  // Calculate widths and heights in pixels to fit cards in the game container
  // (The default value for `gameWidth` is a hack since we don't know the
  //  actual dimensions of the game container on initial render)
  const gameWidth = gameDimensions ? gameDimensions.width : 200;
  const numCards = board.length;

  const rows = isLandscape ? 3 : Math.max(Math.ceil(numCards / 3), 4);
  const cols = isLandscape ? Math.max(Math.ceil(numCards / 3), 4) : 3;

  let cardWidth, cardHeight, gameHeight;
  if (!isHorizontal) {
    if (!isLandscape) {
      cardWidth = Math.floor((gameWidth - 2 * gamePadding) / cols);
      cardHeight = Math.round(cardWidth / 1.6);
      gameHeight = cardHeight * rows + 2 * gamePadding + lineSpacing;
    } else {
      cardWidth = Math.floor(
        (gameWidth - 2 * gamePadding - lineSpacing) / cols
      );
      cardHeight = Math.round(cardWidth / 1.6);
      gameHeight = cardHeight * rows + 2 * gamePadding;
    }
  } else {
    if (!isLandscape) {
      cardHeight = Math.floor((gameWidth - 2 * gamePadding) / cols);
      cardWidth = Math.round(cardHeight * 1.6);
      gameHeight = cardWidth * rows + 2 * gamePadding + lineSpacing;
    } else {
      cardHeight = Math.floor(
        (gameWidth - 2 * gamePadding - lineSpacing) / cols
      );
      cardWidth = Math.round(cardHeight * 1.6);
      gameHeight = cardWidth * rows + 2 * gamePadding;
    }
  }
  const margin = Math.round(cardWidth * 0.035);
  const rotateAmount = isHorizontal ? 90 : 0;
  // NOTE: put rotate into useTransition() instead of adding it to the style
  // outside to get a nice animation when cardOrientation changes.
  const cardProps = (card) => {
    const i = board.indexOf(card?.trimLeft());
    let positionX, positionY;
    let r, c;
    if (!isLandscape) {
      [r, c] = [Math.floor(i / 3), i % 3];
    } else {
      [r, c] = [i % 3, Math.floor(i / 3)];
    }
    if (!isHorizontal) {
      positionX = cardWidth * c + gamePadding;
      positionY = cardHeight * r + gamePadding;
    } else {
      const delta = (cardWidth - cardHeight) / 2; // accounting for rotation
      positionX = cardHeight * c + gamePadding - delta;
      positionY = cardWidth * r + gamePadding + delta;
    }
    if (!isLandscape) {
      positionY += i >= lastSetSize ? lineSpacing : 0;
    } else {
      positionX += i >= lastSetSize ? lineSpacing : 0;
    }
    return {
      left: positionX,
      top: positionY,
      rotate: rotateAmount,
      opacity: 1,
    };
  };
  const transitions = useTransition(movingCards?.concat(board) || board, {
    from: (card) =>
      card?.startsWith(" ")
        ? cardProps(card)
        : {
            left: -cardWidth,
            top: gameHeight / 2 - cardHeight / 2,
            rotate: rotateAmount,
            opacity: 0,
          },
    enter: cardProps,
    update: cardProps,
    leave: {
      left: gameWidth,
      top: gameHeight / 2 - cardHeight / 2,
      rotate: rotateAmount,
      opacity: 0,
    },
    config: {
      tension: 64,
      friction: 14,
    },
  });

  // Keyboard shortcuts
  const shortcuts = isLandscape
    ? keyboardLayout.horizontalLayout
    : keyboardLayout.verticalLayout;
  useKeydown((event) => {
    const { key, modifier } = getKeyState(event);
    if (modifier !== "" && modifier !== "Shift") {
      return;
    }
    if (key === "escape" || key === " ") {
      event.preventDefault();
      onClear();
    } else if (key.length === 1) {
      const index = shortcuts.indexOf(key);
      if (index >= 0) {
        event.preventDefault();
        if (board[index]) onClick(board[index]);
      }
    }
  });

  const lastSetLineStyle = isLandscape
    ? {
        left:
          (isHorizontal ? cardHeight : cardWidth) * lastSetRows +
          gamePadding +
          lineSpacing / 2,
      }
    : {
        top:
          (isHorizontal ? cardWidth : cardHeight) * lastSetRows +
          gamePadding +
          lineSpacing / 2,
      };

  return (
    <Paper
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: gameHeight + (remaining >= 0 ? 19 : 0),
        transition: "height 0.75s",
      }}
      ref={gameEl}
    >
      {remaining >= 0 && (
        <Typography
          variant="caption"
          align="center"
          style={{
            position: "absolute",
            left:
              isLandscape && lastSetSize
                ? gamePadding + (isHorizontal ? cardHeight : cardWidth) / 2
                : 0,
            bottom: gamePadding,
            width: "100%",
          }}
        >
          <strong>{remaining}</strong> cards remaining in the deck
        </Typography>
      )}
      {lastSetSize ? (
        <Divider
          orientation={isLandscape ? "vertical" : "horizontal"}
          variant="fullWidth"
          absolute={true}
          style={lastSetLineStyle}
        />
      ) : null}
      {transitions(
        (style, card) =>
          card && (
            <animated.div
              className={to([style.left, style.top], () =>
                style.left.idle && style.top.idle
                  ? classes.staticCard
                  : classes.movingCard
              )}
              style={style}
            >
              {showShortcuts ? (
                <div
                  style={{
                    width: cardWidth - margin * 2,
                    height: cardHeight - margin * 2,
                    margin: margin,
                    borderRadius: margin,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid",
                    fontWeight: "bold",
                  }}
                >
                  <span style={{ transform: `rotate(${-rotateAmount}deg)` }}>
                    {shortcuts[board.indexOf(card)]}
                  </span>
                </div>
              ) : (
                <ResponsiveSetCard
                  value={card.trimLeft()}
                  width={cardWidth}
                  hinted={answer?.includes(card)}
                  active={selected?.includes(card)}
                  faceDown={
                    faceDown === "all" ||
                    (faceDown &&
                      !selected?.includes(card) &&
                      board.includes(card))
                  }
                  onClick={() => onClick(card)}
                />
              )}
            </animated.div>
          )
      )}
    </Paper>
  );
}

export default Game;
