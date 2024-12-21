export const BASE_RATING = 1200;
export const SCALING_FACTOR = 800;

export function generateCards(gameMode) {
  const deck = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        for (let l = 0; l < 3; l++) {
          deck.push(`${i}${j}${k}${l}`);
        }
      }
    }
  }
  return deck;
}

export function checkSet(a, b, c) {
  for (let i = 0; i < 4; i++) {
    if ((a.charCodeAt(i) + b.charCodeAt(i) + c.charCodeAt(i)) % 3 !== 0)
      return false;
  }
  return true;
}

/** Returns the unique card c such that {a, b, c} form a set. */
export function conjugateCard(a, b) {
  const zeroCode = "0".charCodeAt(0);
  let c = "";
  for (let i = 0; i < 4; i++) {
    const an = a.charCodeAt(i) - zeroCode,
      bn = b.charCodeAt(i) - zeroCode;
    const lastNum = an === bn ? an : 3 - an - bn;
    c += String.fromCharCode(zeroCode + lastNum);
  }
  return c;
}

export function checkSetUltra(a, b, c, d) {
  if (conjugateCard(a, b) === conjugateCard(c, d)) return [a, b, c, d];
  if (conjugateCard(a, c) === conjugateCard(b, d)) return [a, c, b, d];
  if (conjugateCard(a, d) === conjugateCard(b, c)) return [a, d, b, c];
  return null;
}

export function findSet(deck, gameMode = "normal", old) {
  const deckSet = new Set(deck);
  const ultraConjugates = {};
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      const c = conjugateCard(deck[i], deck[j]);
      if (
        gameMode === "normal" ||
        (gameMode === "setchain" && old.length === 0)
      ) {
        if (deckSet.has(c)) {
          return [deck[i], deck[j], c];
        }
      } else if (gameMode === "setchain") {
        if (old.includes(c)) {
          return [c, deck[i], deck[j]];
        }
      } else if (gameMode === "ultraset" || gameMode === "ultra9") {
        if (c in ultraConjugates) {
          return [...ultraConjugates[c], deck[i], deck[j]];
        }
        ultraConjugates[c] = [deck[i], deck[j]];
      }
    }
  }
  return null;
}

function findBoardSize(deck, gameMode = "normal", minBoardSize = 12, old) {
  let len = Math.min(deck.length, minBoardSize);
  while (len < deck.length && !findSet(deck.slice(0, len), gameMode, old))
    len += 3 - (len % 3);
  return len;
}

export function removeCard(deck, c) {
  let i = deck.indexOf(c);
  return [...deck.slice(0, i), ...deck.slice(i + 1)];
}

function hasDuplicates(cards) {
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i] === cards[j]) return true;
    }
  }
  return false;
}

function hasUsedCards(used, cards) {
  return cards.some((c) => used[c]);
}

function removeCards(internalGameState, cards) {
  const { current, minBoardSize } = internalGameState;
  const cutoff = Math.min(current.length - cards.length, minBoardSize);
  const cardIndexes = cards
    .map((c) => current.indexOf(c))
    .sort((a, b) => b - a);
  for (const [i, ci] of cardIndexes.entries()) {
    if (ci >= cutoff) {
      current.splice(ci, 1);
    } else {
      const len = cardIndexes.length - i;
      for (const [j, c] of current.splice(cutoff, len).entries()) {
        current[cardIndexes[cardIndexes.length - 1 - j]] = c;
      }
      break;
    }
  }
}

function processValidEvent(internalGameState, event, cards) {
  const { scores, lastEvents, history, used } = internalGameState;
  scores[event.user] = (scores[event.user] || 0) + 1;
  lastEvents[event.user] = event.time;
  history.push(event);
  for (const c of cards) {
    used[c] = true;
  }
}

function updateBoard(internalGameState, cards, old) {
  const { current, gameMode, boardSize, minBoardSize } = internalGameState;
  // remove cards, preserving positions when possible
  removeCards(internalGameState, cards);
  // find the new board size
  const minSize = Math.max(boardSize - cards.length, minBoardSize);
  internalGameState.boardSize = findBoardSize(current, gameMode, minSize, old);
}

function processEventCommon(internalGameState, event) {
  const { used } = internalGameState;
  const cards = [event.c1, event.c2, event.c3];
  if (event.c4) cards.push(event.c4);
  if (hasDuplicates(cards) || hasUsedCards(used, cards)) return;
  processValidEvent(internalGameState, event, cards);
  updateBoard(internalGameState, cards);
}

function processEventChain(internalGameState, event) {
  const { used, history } = internalGameState;
  const { c1, c2, c3 } = event;
  const allCards = [c1, c2, c3];
  const cards = history.length === 0 ? allCards : allCards.slice(1);
  if (hasDuplicates(allCards) || hasUsedCards(used, cards)) return;
  if (history.length) {
    // One card (c1) should be taken from the previous set
    const prev = history[history.length - 1];
    if (![prev.c1, prev.c2, prev.c3].includes(c1)) return;
  }
  processValidEvent(internalGameState, event, cards);
  updateBoard(internalGameState, cards, allCards);
}

export function computeState(gameData, gameMode = "normal") {
  const scores = {}; // scores of all users
  const used = {}; // set of cards that have been taken
  const history = []; // list of valid events in time order
  const current = gameData.deck.slice(); // remaining cards in the game
  const lastEvents = {}; // time of the last event for each user
  const minBoardSize = gameMode === "ultra9" ? 9 : 12;
  const internalGameState = {
    used,
    current,
    scores,
    history,
    lastEvents,
    gameMode,
    minBoardSize,
    // Initial deck split
    boardSize: findBoardSize(current, gameMode, minBoardSize, []),
  };

  if (gameData.events) {
    // Array.sort() is guaranteed to be stable in since around 2018
    const events = Object.values(gameData.events).sort(
      (e1, e2) => e1.time - e2.time
    );
    const processFn = modes[gameMode]?.processFn;
    if (!processFn) {
      throw new Error(`invalid gameMode ${gameMode}`);
    }
    for (const event of events) {
      processFn(internalGameState, event);
    }
  }

  return {
    current,
    scores,
    history,
    lastEvents,
    boardSize: internalGameState.boardSize,
  };
}

/** Returns true if a game actually has hints enabled. */
export function hasHint(game) {
  return (
    game.enableHint &&
    game.access === "private" &&
    Object.keys(game.users || {}).length === 1
  );
}

export function cardsInSet(gameMode) {
  return modes[gameMode]?.setType === "UltraSet" ? 4 : 3;
}

export const modes = {
  normal: {
    name: "Normal",
    color: "purple",
    description: "Find 3 cards that form a Set.",
    setType: "Set",
    processFn: processEventCommon,
  },
  setchain: {
    name: "Set-Chain",
    color: "teal",
    description: "In every Set, you have to use 1 card from the previous Set.",
    setType: "Set",
    processFn: processEventChain,
  },
  ultraset: {
    name: "UltraSet",
    color: "pink",
    description:
      "Find 4 cards such that the first pair and the second pair form a Set with the same additional card.",
    setType: "UltraSet",
    processFn: processEventCommon,
  },
  ultra9: {
    name: "Ultra9",
    color: "deepOrange",
    description:
      "Same as UltraSet, but only 9 cards are dealt at a time, unless they don't contain any sets.",
    setType: "UltraSet",
    processFn: processEventCommon,
  },
};
