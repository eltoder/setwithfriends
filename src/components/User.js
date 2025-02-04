import { makeStyles, useTheme } from "@material-ui/core/styles";
import Security from "@material-ui/icons/Security";
import WhatshotIcon from "@material-ui/icons/Whatshot";

import useFirebaseRef from "../hooks/useFirebaseRef";
import useStats from "../hooks/useStats";
import { colors } from "../util";

const useStyles = makeStyles((theme) => ({
  rating: {
    display: "inline-block",
    width: "3em",
    marginRight: "0.5em",
    borderRadius: "5px",
    color: "white",
    backgroundColor: "dodgerblue",
    fontSize: "1em",
    textAlign: "center",
  },
}));

function User({
  id,
  style,
  component,
  render,
  forcePatron,
  showRating,
  ...other
}) {
  const theme = useTheme();
  const classes = useStyles();

  const [user, loading] = useFirebaseRef(`users/${id}`);
  const [stats, loadingStats] = useStats(showRating ? id : null);

  if (loading) {
    return null;
  }

  const Component = component || "span";
  const userEl = (
    <Component
      style={{
        color: colors.hasOwnProperty(user.color)
          ? colors[user.color][theme.palette.type === "dark" ? 100 : 900]
          : "inherit",
        fontWeight: 500,
        ...style,
      }}
      {...other}
    >
      {showRating && (
        <span className={classes.rating}>
          {loadingStats ? "⋯" : Math.round(stats[showRating].rating)}
        </span>
      )}
      {user.admin ? (
        <Security
          fontSize="inherit"
          style={{
            display: "inline",
            position: "relative",
            left: "-0.1em",
            top: "0.15em",
            color: "inherit",
          }}
        />
      ) : (
        (user.patron || forcePatron) && (
          <WhatshotIcon
            fontSize="inherit"
            style={{
              display: "inline",
              position: "relative",
              left: "-0.1em",
              top: "0.15em",
              color: "inherit",
            }}
          />
        )
      )}
      <span>{user.name}</span>
    </Component>
  );
  return render ? render(user, userEl) : userEl;
}

export default User;
