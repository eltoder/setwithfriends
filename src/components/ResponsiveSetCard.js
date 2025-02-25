import clsx from "clsx";
import { memo } from "react";

import { makeStyles, useTheme } from "@material-ui/core/styles";

import { cardTraits } from "../game";

const useStyles = makeStyles((theme) => ({
  symbol: {
    margin: 3,
  },
  card: {
    boxSizing: "border-box",
    border: `1px solid ${theme.palette.text.primary}`,
    display: "inline-flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: theme.setCard.background,
    transition:
      "box-shadow 0.15s, width 0.5s, height 0.5s, background-color 0.3s",
  },
  clickable: {
    cursor: "pointer",
    "@media(hover: hover) and (pointer: fine)": {
      "&:hover": {
        boxShadow: "0px 0px 5px 3px #bbb",
      },
    },
  },
  active: {
    boxShadow: "0px 0px 5px 3px #4b9e9e !important",
  },
  highlight: {
    backgroundColor: theme.setCard.highlight,
  },
  hintedOverlay: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundColor: theme.setCard.hinted,
  },
}));

const SHAPES = ["squiggle", "oval", "diamond", "triangle"];
const MASKS = ["", "", "url(#mask-striped)", "url(#mask-dotted)"];
const BORDERS = ["3px solid", "4px dotted", "6px double"];

function ResponsiveSymbol(props) {
  const classes = useStyles();
  const color = props.color;
  const shape = SHAPES[props.shape];
  const shade = props.shade;

  return (
    <svg
      className={classes.symbol}
      width={props.size}
      height={2 * props.size}
      viewBox="0 0 200 400"
      style={{ transition: "width 0.5s, height 0.5s" }}
    >
      <use
        href={"#" + shape}
        fill={shade === 1 ? "transparent" : color}
        mask={MASKS[shade]}
      />
      <use href={"#" + shape} stroke={color} fill="none" strokeWidth={18} />
    </svg>
  );
}

function ResponsiveSetCard(props) {
  const classes = useStyles();
  const theme = useTheme();

  // Black magic below to scale cards given any width
  const { width, value, onClick, hinted, active, highlight, faceDown } = props;
  const height = Math.round(width / 1.6);
  const margin = Math.round(width * 0.035);
  const contentWidth = width - 2 * margin;
  const contentHeight = height - 2 * margin;
  const { color, shape, shade, border, number } = cardTraits(value);

  const COLORS = [
    theme.setCard.purple,
    theme.setCard.green,
    theme.setCard.red,
    theme.setCard.orange,
  ];

  let extraStyle;
  if (faceDown) {
    const bgSize = contentWidth / 6;
    const c = theme.setCard.backColors;
    const grad = `radial-gradient(
      closest-side, transparent 0%, transparent 75%,
      ${c[1]} 76%, ${c[1]} 85%, ${c[4]} 86%, ${c[4]} 94%, ${c[5]} 95%, ${c[5]} 103%,
      ${c[2]} 104%, ${c[2]} 112%, ${c[0]} 113%, ${c[0]} 121%, ${c[5]} 122%, ${c[5]} 130%,
      ${c[3]} 131%, ${c[3]} 140%
    )`;
    extraStyle = {
      backgroundImage: `${grad}, ${grad}`,
      backgroundSize: `${bgSize}px ${bgSize}px`,
      backgroundColor: c[1],
      backgroundPosition: `0 0, ${bgSize / 2}px ${bgSize / 2}px`,
      backgroundClip: "content-box",
      padding: margin,
      outline: "1px solid",
      outlineOffset: -(margin + 1),
    };
  }

  return (
    <div
      className={clsx(classes.card, {
        [classes.clickable]: onClick,
        [classes.active]: active,
        [classes.highlight]: highlight,
      })}
      style={{
        ...extraStyle,
        position: "relative",
        width: contentWidth,
        height: contentHeight,
        margin: margin,
        borderRadius: margin,
        border: faceDown ? undefined : BORDERS[border],
      }}
      onClick={onClick}
    >
      {faceDown ||
        Array.from(Array(number + 1), (_, i) => (
          <ResponsiveSymbol
            key={i}
            color={COLORS[color]}
            shape={shape}
            shade={shade}
            size={Math.round(contentHeight * 0.35)}
          />
        ))}
      {hinted && (
        <div
          className={classes.hintedOverlay}
          style={{ borderRadius: margin }}
        />
      )}
    </div>
  );
}

export default memo(ResponsiveSetCard);
