import clsx from "clsx";
import { memo } from "react";

import { makeStyles, useTheme } from "@material-ui/core/styles";

import { cardTraits } from "../game";

const useStyles = makeStyles((theme) => ({
  card: {
    width: 160,
    height: 100,
    background: "#fff",
    border: `1px solid ${theme.palette.text.primary}`,
    borderRadius: 6,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    margin: 6,
    backgroundColor: theme.setCard.background,
    transition: "box-shadow 0.15s",
    "&:hover": {
      boxShadow: "0px 0px 5px 3px #bbb",
    },
  },
  selected: {
    boxShadow: "0px 0px 5px 3px #4b9e9e !important",
  },
  active: {
    cursor: "pointer",
  },
  smallCard: {
    width: 38,
    height: 24,
    margin: 3,
    border: "1px solid lightgray",
    borderRadius: 2,
    "&:hover": {
      boxShadow: "0px 0px 2px 1px #bbb",
    },
  },
  symbol: {
    margin: 3,
  },
  smallSymbol: {
    margin: 1,
  },
}));

const SHAPES = ["squiggle", "oval", "diamond", "hourglass"];
const MASKS = ["", "", "url(#mask-stripes)", "url(#mask-checkers)"];

function Symbol(props) {
  const classes = useStyles();
  const color = props.color;
  const shape = SHAPES[props.shape];
  const shade = props.shade;
  const width = props.size === "sm" ? 7.1 : 33.6;
  return (
    <svg
      className={clsx(classes.symbol, {
        [classes.smallSymbol]: props.size === "sm",
      })}
      width={width}
      height={width * 2}
      viewBox="0 0 200 400"
    >
      {shade !== 1 && (
        <use href={"#" + shape} fill={color} mask={MASKS[shade]} />
      )}
      <use href={"#" + shape} stroke={color} fill="none" strokeWidth={18} />
    </svg>
  );
}

function SetCard(props) {
  const classes = useStyles();
  const theme = useTheme();
  const { color, shape, shade, border, number } = cardTraits(props.value);

  const COLORS = [
    theme.setCard.purple,
    theme.setCard.green,
    theme.setCard.red,
    theme.setCard.orange,
  ];
  const BORDERS =
    props.size === "sm"
      ? ["2px solid", "2px dotted", "3px double"]
      : ["3px solid", "4px dotted", "6px double"];

  return (
    <div
      className={clsx(classes.card, {
        [classes.selected]: props.selected,
        [classes.active]: props.onClick,
        [classes.smallCard]: props.size === "sm",
      })}
      style={{ border: BORDERS[border] }}
      onClick={props.onClick}
    >
      {Array.from(Array(number + 1), (_, i) => (
        <Symbol
          key={i}
          color={COLORS[color]}
          shape={shape}
          shade={shade}
          size={props.size}
        />
      ))}
    </div>
  );
}

export default memo(SetCard);
