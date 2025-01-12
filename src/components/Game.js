import { useContext, useMemo } from "react";

import Divider from "@material-ui/core/Divider";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import { animated, useSprings } from "@react-spring/web";

import { generateCards } from "../game";
import ResponsiveSetCard from "../components/ResponsiveSetCard";
import useDimensions from "../hooks/useDimensions";
import useKeydown, { getModifierState } from "../hooks/useKeydown";
import { SettingsContext } from "../context";

const gamePadding = 8;

function Game({
  deck,
  boardSize,
  faceDown,
  onClick,
  onClear,
  selected,
  gameMode,
  answer,
  lastSet,
  showShortcuts,
  showRemaining = true,
}) {
  const cardArray = useMemo(() => generateCards(gameMode), [gameMode]);
  const { keyboardLayout, layoutOrientation, cardOrientation } =
    useContext(SettingsContext);
  const isHorizontal = cardOrientation === "horizontal";
  const isLandscape = layoutOrientation === "landscape";
  const [gameDimensions, gameEl] = useDimensions();

  let board = deck.slice(0, boardSize);
  const unplayed = deck.slice(boardSize);
  if (lastSet) {
    board = lastSet.concat(board);
  }

  const lineSpacing = lastSet?.length ? 2 * gamePadding : 0;

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

  // Compute coordinate positions of each card, in and out of play
  const cards = new Map();
  for (const c of cardArray) {
    cards.set(c, {
      positionX: gameWidth,
      positionY: gameHeight / 2 - cardHeight / 2,
      opacity: 0,
      inplay: false,
    });
  }

  for (let i = 0; i < board.length; i++) {
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
      positionY = positionY + (i >= 3 ? lineSpacing : 0);
    } else {
      positionX = positionX + (i >= 3 ? lineSpacing : 0);
    }
    cards.set(board[i], {
      positionX,
      positionY,
      opacity: 1,
      inplay: true,
    });
  }
  for (const c of unplayed) {
    cards.set(c, {
      positionX: -cardWidth,
      positionY: gameHeight / 2 - cardHeight / 2,
      opacity: 0,
      inplay: false,
    });
  }

  const rotateAmount = isHorizontal ? "90deg" : "0deg";

  const springProps = useSprings(
    cardArray.length,
    cardArray.map((c) => ({
      to: {
        transform: `translate(${cards.get(c).positionX}px, ${
          cards.get(c).positionY
        }px) rotate(${rotateAmount})`,
        opacity: cards.get(c).opacity,
      },
      config: {
        tension: 64,
        friction: 14,
      },
    }))
  );

  // Keyboard shortcuts
  const shortcuts = isLandscape
    ? keyboardLayout.horizontalLayout
    : keyboardLayout.verticalLayout;
  useKeydown((event) => {
    const mod = getModifierState(event);
    if (mod !== "" && mod !== "Shift") {
      return;
    }
    // Ignore CapsLock: make key case depend only on Shift.
    const key =
      mod === "Shift" ? event.key.toUpperCase() : event.key.toLowerCase();
    if (key === "escape" || key === " ") {
      event.preventDefault();
      onClear();
    } else if (key.length === 1) {
      const index = shortcuts.indexOf(key);
      if (index >= 0) {
        event.preventDefault();
        if (index < board.length) onClick(board[index]);
      }
    }
  });

  const lastSetLineStyle = isLandscape
    ? {
        left:
          (isHorizontal ? cardHeight : cardWidth) +
          gamePadding +
          lineSpacing / 2,
      }
    : {
        top:
          (isHorizontal ? cardWidth : cardHeight) +
          gamePadding +
          lineSpacing / 2,
      };

  return (
    <Paper
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: gameHeight + (showRemaining ? 19 : 0),
        transition: "height 0.75s",
      }}
      ref={gameEl}
    >
      {showRemaining && (
        <Typography
          variant="caption"
          align="center"
          style={{
            position: "absolute",
            left:
              isLandscape && lastSet?.length
                ? gamePadding + (isHorizontal ? cardHeight : cardWidth) / 2
                : 0,
            bottom: gamePadding,
            width: "100%",
          }}
        >
          <strong>{unplayed.length}</strong> cards remaining in the deck
        </Typography>
      )}
      {lastSet?.length ? (
        <Divider
          orientation={isLandscape ? "vertical" : "horizontal"}
          variant="fullWidth"
          absolute={true}
          style={lastSetLineStyle}
        />
      ) : null}
      {cardArray.map((card, idx) => (
        <animated.div
          key={card}
          style={{
            position: "absolute",
            ...springProps[idx],
            display: springProps[idx].opacity.to((x) =>
              x > 0 ? "block" : "none"
            ),
            zIndex: springProps[idx].opacity.to((x) => (x === 1 ? "auto" : 1)),
          }}
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
              <span style={{ transform: `rotate(-${rotateAmount})` }}>
                {shortcuts[board.indexOf(card)]}
              </span>
            </div>
          ) : (
            <ResponsiveSetCard
              value={card}
              width={cardWidth}
              hinted={answer?.includes(card)}
              active={selected?.includes(card)}
              faceDown={
                faceDown && cards.get(card).opacity && !selected?.includes(card)
              }
              onClick={cards.get(card).inplay ? () => onClick(card) : null}
            />
          )}
        </animated.div>
      ))}
    </Paper>
  );
}

export default Game;
