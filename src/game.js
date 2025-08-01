import { formatANoun, formatCount } from "./util";

export const BASE_RATING = 1200;
export const SCALING_FACTOR = 800;

// xoshiro128** (Vigna & Blackman, 2018) PRNG implementaion taken from
// https://stackoverflow.com/a/47593316/5190601
export function makeRandom(seed) {
  if (!seed.startsWith("v1:")) {
    throw new Error(`Unknown seed version: ${seed}`);
  }
  let a = parseInt(seed.slice(3, 11), 16) >>> 0;
  let b = parseInt(seed.slice(11, 19), 16) >>> 0;
  let c = parseInt(seed.slice(19, 27), 16) >>> 0;
  let d = parseInt(seed.slice(27, 35), 16) >>> 0;
  return () => {
    const t = b << 9;
    let r = b * 5;
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

function shuffleCards(deck, count, random) {
  // Fisher-Yates
  for (let i = Math.min(count, deck.length) - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  return deck;
}

export function generateDeck(gameMode, random) {
  const symbols = Array.from(
    Array(setTypes[modes[gameMode].setType].variants),
    (_, i) => i + ""
  );
  const deck = makeCards(symbols, modes[gameMode].traits);
  return shuffleCards(deck, deck.length, random);
}

/** Return the unique card c such that {a, b, c} form a set. */
export function conjugateCard(a, b) {
  const zeroCode = "0".charCodeAt(0);
  let c = "";
  for (let i = 0; i < a.length; i++) {
    const an = a.charCodeAt(i),
      bn = b.charCodeAt(i);
    c += String.fromCharCode(an === bn ? an : zeroCode * 3 + 3 - an - bn);
  }
  return c;
}

/** Return the unique card d such that {a, b, c, d} form a 4Set. */
export function conjugateCard4Set(a, b, c) {
  let d = "";
  for (let i = 0; i < a.length; i++) {
    d += String.fromCharCode(
      a.charCodeAt(i) ^ b.charCodeAt(i) ^ c.charCodeAt(i)
    );
  }
  return d;
}

export function checkSetNormal(a, b, c) {
  for (let i = 0; i < a.length; i++) {
    if ((a.charCodeAt(i) + b.charCodeAt(i) + c.charCodeAt(i)) % 3) return null;
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
    if (sum % 3) return null;
  }
  return [a, b, c, d, e, f];
}

export function checkSet4Set(a, b, c, d) {
  for (let i = 0; i < a.length; i++) {
    if (a.charCodeAt(i) ^ b.charCodeAt(i) ^ c.charCodeAt(i) ^ d.charCodeAt(i))
      return null;
  }
  return [a, b, c, d];
}

export function addCard(deck, card, gameMode, findState) {
  const setType = modes[gameMode].setType;
  const chain = modes[gameMode].chain;
  const setSize = setTypes[setType].size;
  const { lastSet, foundSets } = findState;
  // Special case for the regular set-chain modes: if you select a second card
  // from lastSet, we unselect the first one; also, this card goes to the front
  const cards =
    chain === 1 && lastSet.includes(card)
      ? [card, ...deck.filter((c) => !lastSet.includes(c))]
      : [...deck, card];
  if (cards.length < setSize) {
    return { kind: "pending", cards };
  }
  if (chain && lastSet.length > 0) {
    const fromLast = cards.reduce((s, c) => s + lastSet.includes(c), 0);
    if (fromLast !== chain) {
      return {
        kind: "error",
        cards,
        error: `${formatCount(chain, "card")} must be from the previous ${setType}`,
      };
    }
  }
  const set = setTypes[setType].checkFn(...cards);
  if (!set) {
    return { kind: "error", cards, error: `Not ${formatANoun(setType)}` };
  }
  if (modes[gameMode].puzzle && foundSets.has(set.slice().sort().join("|"))) {
    return { kind: "error", cards, error: `This ${setType} was already found` };
  }
  // In ultra-chain, align set with lastSet to reduce movement of cards
  if (chain > 1) {
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

function findSetNormal(deck, gameMode, state) {
  const deckSet = new Set(deck);
  const first =
    modes[gameMode].chain && state.lastSet.length > 0 ? state.lastSet : deck;
  const foundSets = modes[gameMode].puzzle && state.foundSets;
  for (let i = 0; i < first.length; i++) {
    for (let j = first === deck ? i + 1 : 0; j < deck.length; j++) {
      const c = conjugateCard(first[i], deck[j]);
      if (deckSet.has(c)) {
        const set = [first[i], deck[j], c];
        if (!(foundSets && foundSets.has(set.sort().join("|")))) {
          return set;
        }
      }
    }
  }
  return null;
}

function findSetUltra(deck, gameMode, state) {
  const foundSets = modes[gameMode].puzzle && state.foundSets;
  const cutoff = modes[gameMode].chain ? state.lastSet.length : 0;
  const deckSet = new Set(deck);
  let first, second, prevSet;
  if (!cutoff) {
    first = second = deck;
  } else {
    second = state.lastSet;
    first = second.concat(deck);
    prevSet = new Set(second);
  }
  for (let i = 0; i < first.length; i++) {
    const checkSet = !cutoff || i < cutoff ? deckSet : prevSet;
    for (let j = !cutoff || i < cutoff ? i + 1 : 0; j < second.length; j++) {
      const c1 = conjugateCard(first[i], second[j]);
      for (let k = second === deck ? j + 1 : 0; k < deck.length; k++) {
        const c2 = conjugateCard(c1, deck[k]);
        if (
          checkSet.has(c2) &&
          c2 !== first[i] &&
          c2 !== second[j] &&
          c2 !== deck[k]
        ) {
          const set = [first[i], second[j], deck[k], c2];
          if (!(foundSets && foundSets.has(set.sort().join("|")))) {
            return set;
          }
        }
      }
    }
  }
  return null;
}

function findSetGhost(deck, gameMode, state) {
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

function findSet4Set(deck, gameMode, state) {
  const deckSet = new Set(deck);
  const first =
    modes[gameMode].chain && state.lastSet.length > 0 ? state.lastSet : deck;
  const foundSets = modes[gameMode].puzzle && state.foundSets;
  for (let i = 0; i < first.length; i++) {
    for (let j = i + 1; j < first.length; j++) {
      for (let k = first === deck ? j + 1 : 0; k < deck.length; k++) {
        const c = conjugateCard4Set(first[i], first[j], deck[k]);
        if (deckSet.has(c)) {
          const set = [first[i], first[j], deck[k], c];
          if (!(foundSets && foundSets.has(set.sort().join("|")))) {
            return set;
          }
        }
      }
    }
  }
  return null;
}

export function findSet(deck, gameMode, state) {
  return setTypes[modes[gameMode].setType].findFn(deck, gameMode, state);
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

function findBoardSize(deck, gameMode, minBoardSize, state) {
  let len = Math.min(deck.length, minBoardSize);
  while (len < deck.length && !findSet(deck.slice(0, len), gameMode, state)) {
    len += 3 - (len % 3);
  }
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
  const { current, used, boardSize, minBoardSize } = internalGameState;
  // optimize removing all cards on the board
  if (cards.length === boardSize) {
    current.splice(0, boardSize);
  } else {
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
  for (const c of cards) {
    used[c] = true;
  }
}

function processValidEvent(internalGameState, event, cards) {
  const { scores, lastEvents, history } = internalGameState;
  scores[event.user] = (scores[event.user] || 0) + 1;
  lastEvents[event.user] = event.time;
  history.push(event);
}

function updateBoard(internalGameState, event, cards) {
  const { current, gameMode, boardSize, minBoardSize, findState } =
    internalGameState;
  if (internalGameState.shuffle) {
    shuffleCards(current, boardSize, internalGameState.random);
  }
  // in puzzle modes only advance after all sets were found
  if (internalGameState.puzzle) {
    const board = current.slice(0, boardSize);
    if (findSet(board, gameMode, findState)) return;
    findState.foundSets.clear();
    cards = board;
    // add a synthetic event to show in chat that the board changed
    const { history } = internalGameState;
    let i;
    for (i = history.length - 2; i >= 0; i--) {
      if (history[i].kind === "board_done") break;
    }
    history.push({
      time: event.time,
      kind: "board_done",
      count: history.length - 1 - i,
    });
  }
  // remove cards, preserving positions when possible
  removeCards(internalGameState, cards);
  // find the new board size
  const minSize = Math.max(boardSize - cards.length, minBoardSize);
  const newSize = findBoardSize(current, gameMode, minSize, findState);
  internalGameState.boardSize = newSize;
}

function processEvent(internalGameState, event) {
  const { used, chain, puzzle, findState } = internalGameState;
  const allCards = cardsFromEvent(event);
  let cards;
  if (chain && findState.lastSet.length > 0) {
    cards = allCards.filter((c) => !findState.lastSet.includes(c));
    if (allCards.length - cards.length !== chain) return;
  } else {
    cards = allCards;
  }
  if (hasDuplicates(allCards) || hasUsedCards(used, cards)) return;
  if (puzzle) {
    const prevFound = findState.foundSets.size;
    findState.foundSets.add(allCards.slice().sort().join("|"));
    if (prevFound === findState.foundSets.size) return;
  }
  if (chain) {
    findState.lastSet = allCards;
  }
  processValidEvent(internalGameState, event, cards);
  updateBoard(internalGameState, event, cards);
}

export function computeState(gameData, gameMode) {
  if (!modes.hasOwnProperty(gameMode)) {
    throw new Error(`invalid gameMode: ${gameMode}`);
  }
  const scores = {}; // scores of all users
  const used = {}; // set of cards that have been taken
  const history = []; // list of valid events in time order
  const random =
    gameData.random ?? (gameData.seed && makeRandom(gameData.seed));
  // remaining cards in the game
  const current = gameData.deck
    ? gameData.deck.slice()
    : generateDeck(gameMode, random);
  const lastEvents = {}; // time of the last event for each user
  const minBoardSize = modes[gameMode].minBoardSize;
  const chain = modes[gameMode].chain;
  const puzzle = modes[gameMode].puzzle;
  const shuffle = modes[gameMode].shuffle;
  const findState = {
    lastSet: chain ? [] : undefined,
    foundSets: puzzle ? new Set() : undefined,
  };
  const internalGameState = {
    used,
    current,
    scores,
    history,
    lastEvents,
    gameMode,
    minBoardSize,
    chain,
    puzzle,
    shuffle,
    findState,
    random,
    boardSize: findBoardSize(current, gameMode, minBoardSize, findState),
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
    findState,
  };
}

const setTypes = {
  Set: {
    variants: 3,
    size: 3,
    checkFn: checkSetNormal,
    findFn: findSetNormal,
  },
  UltraSet: {
    variants: 3,
    size: 4,
    checkFn: checkSetUltra,
    findFn: findSetUltra,
  },
  GhostSet: {
    variants: 3,
    size: 6,
    checkFn: checkSetGhost,
    findFn: findSetGhost,
  },
  "4Set": {
    variants: 4,
    size: 4,
    checkFn: checkSet4Set,
    findFn: findSet4Set,
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
    description: "In every Set you have to use 1 card from the previous Set.",
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
      "In every UltraSet you have to use 2 cards from the previous Set.",
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
  "4set": {
    name: "4Set",
    color: "amber",
    description: "Find 4 cards that form a 4Set.",
    setType: "4Set",
    traits: 4,
    chain: 0,
    minBoardSize: 15,
  },
  "4setjr": {
    name: "4Set Junior",
    color: "amber",
    description: "Find 4 cards that form a 4Set.",
    setType: "4Set",
    traits: 3,
    chain: 0,
    minBoardSize: 11,
  },
  "4setjrchain": {
    name: "4Set Jr-Chain",
    color: "red",
    description:
      "In every 4Set you have to use 2 cards from the previous 4Set.",
    setType: "4Set",
    traits: 3,
    chain: 2,
    minBoardSize: 11,
  },
  puzzle: {
    name: "Puzzle",
    color: "cyan",
    description: "Find all Sets on the board before moving to the next board.",
    setType: "Set",
    traits: 4,
    chain: 0,
    puzzle: true,
    minBoardSize: 12,
  },
  ultra9puzzle: {
    name: "Ultra9 Puzzle",
    color: "orange",
    description:
      "Find all UltraSets on the board before moving to the next board.",
    setType: "UltraSet",
    traits: 4,
    chain: 0,
    puzzle: true,
    minBoardSize: 9,
  },
  "4setjrpuzzle": {
    name: "4Set Jr-Puzzle",
    color: "indigo",
    description: "Find all 4Sets on the board before moving to the next board.",
    setType: "4Set",
    traits: 3,
    chain: 0,
    puzzle: true,
    minBoardSize: 11,
  },
  shuffle: {
    name: "Shuffle",
    color: "blue",
    description: "Cards are shuffled after each Set.",
    setType: "Set",
    traits: 4,
    chain: 0,
    shuffle: true,
    minBoardSize: 12,
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
