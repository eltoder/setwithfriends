import { useContext } from "react";

import Divider from "@material-ui/core/Divider";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import { animated, useTransition } from "@react-spring/web";

import ResponsiveSetCard from "../components/ResponsiveSetCard";
import useDimensions from "../hooks/useDimensions";
import useKeydown, { getModifierState } from "../hooks/useKeydown";
import { SettingsContext } from "../context";

const gamePadding = 8;

function Game({
  board,
  onClick,
  onClear,
  selected,
  answer,
  lastSet,
  faceDown,
  showShortcuts,
  remaining = -1,
}) {
  const { keyboardLayout, layoutOrientation, cardOrientation } =
    useContext(SettingsContext);
  const isHorizontal = cardOrientation === "horizontal";
  const isLandscape = layoutOrientation === "landscape";
  const [gameDimensions, gameEl] = useDimensions();

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
  const rotateAmount = isHorizontal ? "90deg" : "0deg";
  // NOTE: put rotate() into useTransition() instead of adding it to style
  // outside to get a nice animation when the setting changes.
  const cardProps = (card) => {
    const i = board.indexOf(card);
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
      positionY += i >= lastSet?.length ? lineSpacing : 0;
    } else {
      positionX += i >= lastSet?.length ? lineSpacing : 0;
    }
    return {
      left: positionX,
      top: positionY,
      transform: `rotate(${rotateAmount})`,
      opacity: 1,
    };
  };
  const transitions = useTransition(board, {
    from: {
      left: -cardWidth,
      top: gameHeight / 2 - cardHeight / 2,
      transform: `rotate(${rotateAmount})`,
      opacity: 0,
    },
    enter: cardProps,
    update: cardProps,
    leave: {
      left: gameWidth,
      top: gameHeight / 2 - cardHeight / 2,
      transform: `rotate(${rotateAmount})`,
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
              isLandscape && lastSet?.length
                ? gamePadding + (isHorizontal ? cardHeight : cardWidth) / 2
                : 0,
            bottom: gamePadding,
            width: "100%",
          }}
        >
          <strong>{remaining}</strong> cards remaining in the deck
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
      {transitions((style, card) => (
        <animated.div
          style={{
            position: "absolute",
            zIndex: style.opacity.to((x) => (x === 1 ? "auto" : 1)),
            ...style,
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
                faceDown && !selected?.includes(card) && board.includes(card)
              }
              onClick={() => onClick(card)}
            />
          )}
        </animated.div>
      ))}
    </Paper>
  );
}

export default Game;
