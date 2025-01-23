import { useEffect, useRef, useState, useMemo, useContext, memo } from "react";

import Typography from "@material-ui/core/Typography";
import Tooltip from "@material-ui/core/Tooltip";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import MenuItem from "@material-ui/core/MenuItem";
import Menu from "@material-ui/core/Menu";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";

import User from "./User";
import InternalLink from "./InternalLink";
import SimpleInput from "./SimpleInput";
import Subheading from "./Subheading";
import Scrollbox from "./Scrollbox";
import ChatCards from "./ChatCards";
import ElapsedTime from "./ElapsedTime";
import firebase from "../firebase";
import { censorText } from "../util";
import autoscroll from "../utils/autoscroll";
import useFirebaseQuery from "../hooks/useFirebaseQuery";
import useStats from "../hooks/useStats";
import useStorage from "../hooks/useStorage";
import { UserContext } from "../context";
import emoji from "../utils/emoji";

const useStyles = makeStyles((theme) => ({
  chatPanel: {
    height: "var(--chat-height, auto)",
    display: "flex",
    flexDirection: "column",
  },
  chatHidden: {
    [theme.breakpoints.down("sm")]: {
      height: "auto !important",
    },
  },
  chatHeader: {
    transition: "text-shadow 0.5s",
    "&:hover": {
      cursor: "pointer",
      textShadow: "0 0 0.75px",
    },
  },
  chat: {
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    flexGrow: 1,
    overflowWrap: "anywhere",
    padding: "0 4px 4px 4px",
    scrollBehavior: "smooth",
  },
  vertIcon: {
    marginLeft: "auto",
    cursor: "pointer",
    "&:hover": {
      fill: "#f06292",
    },
    visibility: "hidden",
  },
  message: {
    "& > p": {
      margin: "0.15em 0",
    },
    "&:hover > $vertIcon": {
      visibility: "visible",
    },
  },
  messageTime: {
    color: "gray",
    fontSize: "xx-small",
    marginRight: "0.4em",
    verticalAlign: "middle",
  },
  mentioned: {
    backgroundColor: theme.mentioned.background,
    borderLeft: `solid 2px ${theme.mentioned.border}`,
    margin: "0 -4px",
    padding: "0 4px 0 2px",
  },
}));

const makeMentionRE = (username) => {
  username = username.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  username = username.replace(/^anonymous /i, "($&)?");
  return new RegExp(`@(all|${username})(\\W|$)`, "iu");
};

/** A chat sidebar element, opens lobby chat when the `gameId` prop is not set. */
function Chat({
  title,
  messageLimit,
  showMessageTimes,
  gameId,
  history,
  gameMode,
  startedAt,
}) {
  const user = useContext(UserContext);
  const classes = useStyles();
  const [stats, loadingStats] = useStats(gameId ? null : user.id);
  const chatDisabled =
    !gameId && (loadingStats || stats.all.all.totalSets < 55);

  const chatEl = useRef();
  useEffect(() => {
    return autoscroll(chatEl.current);
  }, []);

  const [input, setInput] = useState("");
  const [menuOpenIdx, setMenuOpenIdx] = useState(null);
  const [chatHidden, setChatHidden] = useStorage("chat-hidden", "no");
  const isHidden = chatHidden === "yes";

  const databasePath = gameId ? `chats/${gameId}` : "lobbyChat";
  const messagesQuery = useMemo(
    () =>
      firebase
        .database()
        .ref(databasePath)
        .orderByChild("time")
        .limitToLast(messageLimit),
    [databasePath, messageLimit]
  );
  const messages = useFirebaseQuery(isHidden ? null : messagesQuery);
  const mentionRE = useMemo(() => makeMentionRE(user.name), [user.name]);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      firebase
        .database()
        .ref(databasePath)
        .push({
          user: user.id,
          message: censorText(trimmed),
          time: firebase.database.ServerValue.TIMESTAMP,
        });
    }
    setInput("");
    chatEl.current.scrollToBottom();
  }

  function toggleChat() {
    setChatHidden(isHidden ? "no" : "yes");
  }

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClickVertIcon = (event, key) => {
    setAnchorEl(event.currentTarget);
    setMenuOpenIdx(key);
  };

  const handleDelete = (key) => {
    firebase.database().ref(databasePath).child(key).remove();
    handleClose();
  };

  const handleDeleteAll = async (uid) => {
    const messages = await firebase
      .database()
      .ref(databasePath)
      .orderByChild("user")
      .equalTo(uid)
      .once("value");
    const updates = {};
    messages.forEach((snap) => {
      updates[snap.key] = null;
    });
    firebase.database().ref(databasePath).update(updates);
    handleClose();
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMenuOpenIdx(null);
  };

  const items = messages;
  if (gameId && history) {
    for (let i = 0; i < history.length; i++) {
      items[`card@${i}`] = history[i];
    }
  }

  const timeTooltip = (time, elem) => {
    if (!showMessageTimes) {
      return elem;
    }
    return (
      <Tooltip arrow placement="left" title={<ElapsedTime value={time} />}>
        {elem}
      </Tooltip>
    );
  };

  const formatTime = (time) => {
    const opts = { timeStyle: "short", hour12: false };
    return (
      showMessageTimes && (
        <span className={classes.messageTime}>
          {new Date(time).toLocaleTimeString(undefined, opts)}
        </span>
      )
    );
  };

  const processText = (text) => {
    return text.replace(/:([a-z0-9_+-]+):/g, (m, n) => emoji[n] || m);
  };

  return (
    <section
      className={clsx(classes.chatPanel, { [classes.chatHidden]: isHidden })}
      style={{ flexGrow: 1, overflowY: "hidden" }}
    >
      <Subheading className={classes.chatHeader} onClick={toggleChat}>
        {title} {isHidden && "(Hidden)"}
      </Subheading>
      <Scrollbox className={classes.chat} ref={chatEl}>
        {Object.entries(items)
          .sort(([, a], [, b]) => a.time - b.time)
          .map(([key, item]) =>
            key.startsWith("card@") ? (
              <ChatCards
                key={key}
                item={item}
                gameMode={gameMode}
                startedAt={startedAt}
              />
            ) : (
              <div
                key={key}
                style={{ display: "flex", flexDirection: "row" }}
                className={clsx(classes.message, {
                  [classes.mentioned]: mentionRE.test(item.message),
                })}
              >
                {timeTooltip(
                  item.time,
                  <Typography variant="body2">
                    {formatTime(item.time)}
                    <User
                      id={item.user}
                      component={InternalLink}
                      to={`/profile/${item.user}`}
                      underline="none"
                    />
                    : {item.message}
                  </Typography>
                )}
                {user.admin && (
                  <MoreVertIcon
                    aria-controls="admin-menu"
                    color="inherit"
                    className={classes.vertIcon}
                    onClick={(e) => handleClickVertIcon(e, key)}
                  />
                )}

                <Menu
                  id="admin-menu"
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl) && key === menuOpenIdx}
                  onClose={handleClose}
                >
                  <MenuItem onClick={() => handleDelete(key)}>
                    Delete message
                  </MenuItem>
                  <MenuItem onClick={() => handleDeleteAll(item.user)}>
                    Delete all from user
                  </MenuItem>
                </Menu>
              </div>
            )
          )}
      </Scrollbox>
      {!isHidden && (
        <form onSubmit={handleSubmit}>
          <Tooltip
            arrow
            title={
              chatDisabled
                ? "New users cannot chat. Play a couple games first!"
                : ""
            }
          >
            <SimpleInput
              value={input}
              onChange={(e) => setInput(processText(e.target.value))}
              placeholder="Type a message..."
              maxLength={250}
              disabled={chatDisabled}
            />
          </Tooltip>
        </form>
      )}
    </section>
  );
}

export default memo(Chat);
