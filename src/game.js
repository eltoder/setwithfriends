export const BASE_RATING = 1200;
export const SCALING_FACTOR = 800;

// xoshiro128** (Vigna & Blackman, 2018) PRNG implementaion taken from
// https://stackoverflow.com/a/47593316/5190601
function makeRandom(seed) {
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

export function checkSet(a, b, c) {
  for (let i = 0; i < a.length; i++) {
    if ((a.charCodeAt(i) + b.charCodeAt(i) + c.charCodeAt(i)) % 3 !== 0)
      return null;
  }
  return [a, b, c];
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
  let res;
  if (gameMode === "setchain" && lastSet.includes(card)) {
    // Move the card from lastSet to the front and remove one if it was already there
    res = [
      card,
      ...(deck.length > 0 && lastSet.includes(deck[0]) ? deck.slice(1) : deck),
    ];
  } else {
    res = [...deck, card];
  }
  return [res, res.length === modes[gameMode].cardsInSet];
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
    number: card.charCodeAt(traits - 1) - zeroCode,
  };
}

export function findSet(deck, gameMode = "normal", old) {
  const deckSet = new Set(deck);
  const ultraConjugates = {};
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      const c = conjugateCard(deck[i], deck[j]);
      if (
        gameMode === "normal" ||
        gameMode === "junior" ||
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
      } else if (gameMode === "ghostset") {
        for (let k = j + 1; k < deck.length; k++) {
          for (let l = k + 1; l < deck.length; l++) {
            for (let m = l + 1; m < deck.length; m++) {
              for (let n = m + 1; n < deck.length; n++) {
                if (
                  checkSetGhost(
                    deck[i],
                    deck[j],
                    deck[k],
                    deck[l],
                    deck[m],
                    deck[n]
                  )
                ) {
                  return [deck[i], deck[j], deck[k], deck[l], deck[m], deck[n]];
                }
              }
            }
          }
        }
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
  if (event.c5) cards.push(event.c5);
  if (event.c6) cards.push(event.c6);
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
    // Initial deck split
    boardSize: findBoardSize(current, gameMode, minBoardSize, []),
  };

  if (gameData.events) {
    // Array.sort() is guaranteed to be stable in since around 2018
    const events = Object.values(gameData.events).sort(
      (e1, e2) => e1.time - e2.time
    );
    const processFn = modes[gameMode].processFn;
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

export const modes = {
  normal: {
    name: "Normal",
    color: "purple",
    description: "Find 3 cards that form a Set.",
    setType: "Set",
    cardsInSet: 3,
    traits: 4,
    minBoardSize: 12,
    checkFn: checkSet,
    processFn: processEventCommon,
  },
  junior: {
    name: "Junior",
    color: "green",
    description:
      "A simplified version that only uses cards with solid shading.",
    setType: "Set",
    cardsInSet: 3,
    traits: 3,
    minBoardSize: 9,
    checkFn: checkSet,
    processFn: processEventCommon,
  },
  setchain: {
    name: "Set-Chain",
    color: "teal",
    description: "In every Set, you have to use 1 card from the previous Set.",
    setType: "Set",
    cardsInSet: 3,
    traits: 4,
    minBoardSize: 12,
    checkFn: checkSet,
    processFn: processEventChain,
  },
  ultraset: {
    name: "UltraSet",
    color: "pink",
    description:
      "Find 4 cards such that the first pair and the second pair form a Set with the same additional card.",
    setType: "UltraSet",
    cardsInSet: 4,
    traits: 4,
    minBoardSize: 12,
    checkFn: checkSetUltra,
    processFn: processEventCommon,
  },
  ultra9: {
    name: "Ultra9",
    color: "deepOrange",
    description:
      "Same as UltraSet, but only 9 cards are dealt at a time, unless they don't contain any sets.",
    setType: "UltraSet",
    cardsInSet: 4,
    traits: 4,
    minBoardSize: 9,
    checkFn: checkSetUltra,
    processFn: processEventCommon,
  },
  ghostset: {
    name: "GhostSet",
    color: "lightBlue",
    description:
      "Find 3 disjoint pairs of cards in which the cards needed to complete each Set also form a Set.",
    setType: "GhostSet",
    cardsInSet: 6,
    traits: 4,
    minBoardSize: 10,
    checkFn: checkSetGhost,
    processFn: processEventCommon,
  },
};
