export const BASE_RATING = 1200;
export const SCALING_FACTOR = 800;

// xoshiro128** (Vigna & Blackman, 2018) PRNG implementaion taken from
// https://stackoverflow.com/a/47593316/5190601
function makeRandom(seed) {
  if (seed === "local") {
    return Math.random;
  }
  if (!seed.startsWith("v1:")) {
    throw new Error(`Unknown seed version: ${seed}`);
  }
  let a = parseInt(seed.slice(3, 11), 16) >>> 0;
  let b = parseInt(seed.slice(11, 19), 16) >>> 0;
  let c = parseInt(seed.slice(19, 27), 16) >>> 0;
  let d = parseInt(seed.slice(27, 35), 16) >>> 0;
  return () => {
    let t = b << 9,
      r = b * 5;
    r = ((r << 7) | (r >>> 25)) * 9;
    c ^= a;
    d ^= b;
    b ^= c;
    a ^= d;
    c ^= t;
    d = (d << 11) | (d >>> 21);
    return (r >>> 0) / 4294967296.0;
  };
}

function makeCards(symbols, traits) {
  if (traits === 1) return symbols;
  return makeCards(symbols, traits - 1).flatMap((lhs) =>
    symbols.map((s) => lhs + s)
  );
}

export function generateCards(gameMode) {
  return makeCards(["0", "1", "2"], modes[gameMode].traits);
}

export function generateDeck(gameMode, seed) {
  const deck = generateCards(gameMode);
  // Fisher-Yates
  const random = makeRandom(seed);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  return deck;
}

/** Returns the unique card c such that {a, b, c} form a set. */
export function conjugateCard(a, b) {
  const zeroCode = "0".charCodeAt(0);
  let c = "";
  for (let i = 0; i < a.length; i++) {
    const an = a.charCodeAt(i) - zeroCode,
      bn = b.charCodeAt(i) - zeroCode;
    const lastNum = an === bn ? an : 3 - an - bn;
    c += String.fromCharCode(zeroCode + lastNum);
  }
  return c;
}

export function checkSetNormal(a, b, c) {
  for (let i = 0; i < a.length; i++) {
    if ((a.charCodeAt(i) + b.charCodeAt(i) + c.charCodeAt(i)) % 3 !== 0)
      return null;
  }
  return [a, b, c];
}

export function checkSetUltra(a, b, c, d) {
  if (conjugateCard(a, b) === conjugateCard(c, d)) return [a, b, c, d];
  if (conjugateCard(a, c) === conjugateCard(b, d)) return [a, c, b, d];
  if (conjugateCard(a, d) === conjugateCard(b, c)) return [a, d, b, c];
  return null;
}

export function checkSetGhost(a, b, c, d, e, f) {
  for (let i = 0; i < a.length; i++) {
    const sum =
      a.charCodeAt(i) +
      b.charCodeAt(i) +
      c.charCodeAt(i) +
      d.charCodeAt(i) +
      e.charCodeAt(i) +
      f.charCodeAt(i);
    if (sum % 3 !== 0) return null;
  }
  return [a, b, c, d, e, f];
}

export function addCard(deck, card, gameMode, lastSet) {
  const setType = modes[gameMode].setType;
  const chain = modes[gameMode].chain;
  const setSize = setTypes[setType].size;
  // Special case for the regular set-chain modes: if you select a second card
  // from lastSet, we unselect the first one
  const cards =
    chain === 1 && lastSet.includes(card)
      ? [...deck.filter((c) => !lastSet.includes(c)), card]
      : [...deck, card];
  if (cards.length < setSize) {
    return { kind: "pending", cards };
  }
  const doChain = chain && lastSet.length > 0;
  if (doChain) {
    const fromLast = cards.reduce((s, c) => s + lastSet.includes(c), 0);
    if (fromLast !== chain) {
      const noun = chain > 1 ? "cards" : "card";
      return {
        kind: "error",
        cards,
        error: `${chain} ${noun} must be from the previous set`,
      };
    }
  }
  const set = setTypes[setType].checkFn(...cards);
  if (!set) {
    return { kind: "error", cards, error: `Not a ${setType}` };
  }
  if (doChain) {
    // Align with lastSet to reduce movement of cards
    for (const [i, card] of lastSet.entries()) {
      const idx = set.indexOf(card);
      if (idx >= 0 && idx !== i) {
        set[idx] = set[i];
        set[i] = card;
      }
    }
  }
  return { kind: "set", cards: set, setType };
}

export function removeCard(deck, card) {
  let i = deck.indexOf(card);
  return [...deck.slice(0, i), ...deck.slice(i + 1)];
}

export function cardTraits(card) {
  const zeroCode = "0".charCodeAt(0);
  const traits = card.length;
  return {
    color: card.charCodeAt(0) - zeroCode,
    shape: card.charCodeAt(1) - zeroCode,
    shade: traits < 4 ? 0 : card.charCodeAt(2) - zeroCode,
    border: traits < 5 ? -1 : card.charCodeAt(3) - zeroCode,
    number: card.charCodeAt(traits - 1) - zeroCode,
  };
}

function findSetNormal(deck, gameMode, old) {
  const deckSet = new Set(deck);
  const first = modes[gameMode].chain && old.length > 0 ? old : deck;
  for (let i = 0; i < first.length; i++) {
    for (let j = first === deck ? i + 1 : 0; j < deck.length; j++) {
      const c = conjugateCard(first[i], deck[j]);
      if (deckSet.has(c)) {
        return [first[i], deck[j], c];
      }
    }
  }
  return null;
}

function findSetUltra(deck, gameMode, old) {
  const cutoff = modes[gameMode].chain ? old.length : 0;
  let cards, conjugates;
  if (cutoff > 0) {
    cards = old.concat(deck);
    conjugates = [new Map(), null, null, null].fill(new Map(), 1, 3);
  } else {
    cards = deck;
    conjugates = Array(4).fill(new Map());
  }
  for (let i = 0; i < cards.length - 1; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const c = conjugateCard(cards[i], cards[j]);
      const idx = (+(i < cutoff) << 1) | +(j < cutoff);
      const res = conjugates[idx] && conjugates[idx].get(c);
      if (res) {
        return [...res, cards[i], cards[j]];
      }
      if (conjugates[3 - idx]) {
        conjugates[3 - idx].set(c, [cards[i], cards[j]]);
      }
    }
  }
  return null;
}

function findSetGhost(deck, gameMode, old) {
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      for (let k = j + 1; k < deck.length; k++) {
        for (let l = k + 1; l < deck.length; l++) {
          for (let m = l + 1; m < deck.length; m++) {
            for (let n = m + 1; n < deck.length; n++) {
              const cand = checkSetGhost(
                deck[i],
                deck[j],
                deck[k],
                deck[l],
                deck[m],
                deck[n]
              );
              if (cand) return cand;
            }
          }
        }
      }
    }
  }
  return null;
}

export function findSet(deck, gameMode, old) {
  return setTypes[modes[gameMode].setType].findFn(deck, gameMode, old);
}

export function eventFromCards(cards) {
  const fields = ["c1", "c2", "c3", "c4", "c5", "c6"];
  return Object.fromEntries(cards.map((c, i) => [fields[i], c]));
}

export function cardsFromEvent(event) {
  const cards = [event.c1, event.c2, event.c3];
  if (event.c4) cards.push(event.c4);
  if (event.c5) cards.push(event.c5);
  if (event.c6) cards.push(event.c6);
  return cards;
}

function findBoardSize(deck, gameMode, minBoardSize, old) {
  let len = Math.min(deck.length, minBoardSize);
  while (len < deck.length && !findSet(deck.slice(0, len), gameMode, old))
    len += 3 - (len % 3);
  return len;
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

function processEvent(internalGameState, event) {
  const { used, chain, history } = internalGameState;
  const allCards = cardsFromEvent(event);
  let cards;
  if (chain && history.length > 0) {
    const prev = cardsFromEvent(history[history.length - 1]);
    cards = allCards.filter((c) => !prev.includes(c));
    if (allCards.length - cards.length !== chain) return;
  } else {
    cards = allCards;
  }
  if (hasDuplicates(allCards) || hasUsedCards(used, cards)) return;
  processValidEvent(internalGameState, event, cards);
  updateBoard(internalGameState, cards, allCards);
}

export function computeState(gameData, gameMode) {
  if (!modes.hasOwnProperty(gameMode)) {
    throw new Error(`invalid gameMode: ${gameMode}`);
  }
  const scores = {}; // scores of all users
  const used = {}; // set of cards that have been taken
  const history = []; // list of valid events in time order
  // remaining cards in the game
  const current = gameData.deck
    ? gameData.deck.slice()
    : generateDeck(gameMode, gameData.seed);
  const lastEvents = {}; // time of the last event for each user
  const minBoardSize = modes[gameMode].minBoardSize;
  const internalGameState = {
    used,
    current,
    scores,
    history,
    lastEvents,
    gameMode,
    minBoardSize,
    chain: modes[gameMode].chain,
    boardSize: findBoardSize(current, gameMode, minBoardSize, []),
  };

  if (gameData.events) {
    // Array.sort() is guaranteed to be stable in since around 2018
    const events = Object.values(gameData.events).sort(
      (e1, e2) => e1.time - e2.time
    );
    for (const event of events) {
      processEvent(internalGameState, event);
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

const setTypes = {
  Set: {
    size: 3,
    checkFn: checkSetNormal,
    findFn: findSetNormal,
  },
  UltraSet: {
    size: 4,
    checkFn: checkSetUltra,
    findFn: findSetUltra,
  },
  GhostSet: {
    size: 6,
    checkFn: checkSetGhost,
    findFn: findSetGhost,
  },
};

export const modes = {
  normal: {
    name: "Normal",
    color: "purple",
    description: "Find 3 cards that form a Set.",
    setType: "Set",
    traits: 4,
    chain: 0,
    minBoardSize: 12,
  },
  junior: {
    name: "Junior",
    color: "green",
    description:
      "A simplified version that only uses cards with solid shading.",
    setType: "Set",
    traits: 3,
    chain: 0,
    minBoardSize: 9,
  },
  setchain: {
    name: "Set-Chain",
    color: "teal",
    description: "In every Set, you have to use 1 card from the previous Set.",
    setType: "Set",
    traits: 4,
    chain: 1,
    minBoardSize: 12,
  },
  ultraset: {
    name: "UltraSet",
    color: "pink",
    description:
      "Find 4 cards such that the first pair and the second pair form a Set with the same additional card.",
    setType: "UltraSet",
    traits: 4,
    chain: 0,
    minBoardSize: 12,
  },
  ultrachain: {
    name: "UltraSet-Chain",
    color: "orange",
    description:
      "In every UltraSet, you have to use one pair from the previous Set.",
    setType: "UltraSet",
    traits: 4,
    chain: 2,
    minBoardSize: 12,
  },
  ultra9: {
    name: "Ultra9",
    color: "deepOrange",
    description:
      "Same as UltraSet, but only 9 cards are dealt at a time, unless they don't contain any sets.",
    setType: "UltraSet",
    traits: 4,
    chain: 0,
    minBoardSize: 9,
  },
  megaset: {
    name: "MegaSet",
    color: "lime",
    description: "Each card has 5 traits instead of 4.",
    setType: "Set",
    traits: 5,
    chain: 0,
    minBoardSize: 16,
  },
  ghostset: {
    name: "GhostSet",
    color: "lightBlue",
    description:
      "Find 3 disjoint pairs of cards such that the cards that complete them to Sets themselves form a Set.",
    setType: "GhostSet",
    traits: 4,
    chain: 0,
    minBoardSize: 10,
  },
  memory: {
    name: "Memory",
    color: "red",
    description: "Cards are dealt face down and are turned up 3 at a time.",
    setType: "Set",
    traits: 4,
    chain: 0,
    minBoardSize: 21,
  },
};
