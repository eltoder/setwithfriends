import * as admin from "firebase-admin";

interface GameEvent {
  time: number;
  user: string;
  c1: string;
  c2: string;
  c3: string;
  c4?: string;
  c5?: string;
  c6?: string;
}

export type GameMode =
  | "normal"
  | "junior"
  | "setchain"
  | "ultraset"
  | "ultrachain"
  | "ultra9"
  | "megaset"
  | "ghostset"
  | "memory";

type SetType = "Set" | "UltraSet" | "GhostSet";

interface GameModeInfo {
  setType: SetType;
  traits: number;
  chain: number;
}

/** Generates a random seed. */
export function generateSeed() {
  let s = "v1:";
  for (let i = 0; i < 4; i++) {
    s += ((Math.random() * 2 ** 32) >>> 0).toString(16).padStart(8, "0");
  }
  return s;
}

function makeCards(symbols: string[], traits: number): string[] {
  if (traits === 1) return symbols;
  return makeCards(symbols, traits - 1).flatMap((lhs) =>
    symbols.map((s) => lhs + s)
  );
}

function generateDeck(gameMode: GameMode) {
  const deck = makeCards(["0", "1", "2"], modes[gameMode].traits);
  return new Set(deck);
}

/** Returns the unique card c such that {a, b, c} form a set. */
function conjugateCard(a: string, b: string) {
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

/** Check if three cards form a set. */
export function checkSetNormal(a: string, b: string, c: string) {
  for (let i = 0; i < a.length; i++) {
    if ((a.charCodeAt(i) + b.charCodeAt(i) + c.charCodeAt(i)) % 3 !== 0)
      return null;
  }
  return [a, b, c];
}

/** Check if four cards form an ultraset */
export function checkSetUltra(a: string, b: string, c: string, d: string) {
  if (conjugateCard(a, b) === conjugateCard(c, d)) return [a, b, c, d];
  if (conjugateCard(a, c) === conjugateCard(b, d)) return [a, c, b, d];
  if (conjugateCard(a, d) === conjugateCard(b, c)) return [a, d, b, c];
  return null;
}

/** Check if six cards form a ghostset */
export function checkSetGhost(
  a: string,
  b: string,
  c: string,
  d: string,
  e: string,
  f: string
) {
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

function findSetNormal(deck: string[], gameMode: GameMode, old?: string[]) {
  const deckSet = new Set(deck);
  const first = modes[gameMode].chain && old!.length > 0 ? old! : deck;
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

function findSetUltra(deck: string[], gameMode: GameMode, old?: string[]) {
  const cutoff = modes[gameMode].chain ? old!.length : 0;
  let cards, conjugates: Array<Map<string, [string, string]> | null>;
  if (cutoff > 0) {
    cards = old!.concat(deck);
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
        conjugates[3 - idx]!.set(c, [cards[i], cards[j]]);
      }
    }
  }
  return null;
}

function findSetGhost(deck: string[], gameMode: GameMode, old?: string[]) {
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

/** Find a set in an unordered collection of cards, if any, depending on mode. */
export function findSet(deck: string[], gameMode: GameMode, old?: string[]) {
  return setTypes[modes[gameMode].setType].findFn(deck, gameMode, old);
}

/** Get the array of cards from a GameEvent */
function cardsFromEvent(event: GameEvent) {
  const cards = [event.c1, event.c2, event.c3];
  if (event.c4) cards.push(event.c4);
  if (event.c5) cards.push(event.c5);
  if (event.c6) cards.push(event.c6);
  return cards;
}

/** Check if all cards are distinct */
function hasDuplicates(cards: string[]) {
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i] === cards[j]) return true;
    }
  }
  return false;
}

/** Check if all cards exist in deck */
function validCards(deck: Set<string>, cards: string[]) {
  return cards.every((c) => deck.has(c));
}

/** Delete cards from deck */
function deleteCards(deck: Set<string>, cards: string[]) {
  for (const c of cards) deck.delete(c);
}

/** Replay game event */
function replayEvent(
  deck: Set<string>,
  event: GameEvent,
  chain: number,
  history: GameEvent[]
) {
  const allCards = cardsFromEvent(event);
  let cards;
  if (chain && history.length > 0) {
    const prev = cardsFromEvent(history[history.length - 1]);
    cards = allCards.filter((c) => !prev.includes(c));
    if (allCards.length - cards.length !== chain) return false;
  } else {
    cards = allCards;
  }
  if (hasDuplicates(allCards) || !validCards(deck, cards)) return false;
  deleteCards(deck, cards);
  return true;
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

const modes: Record<string, GameModeInfo> = {
  normal: {
    setType: "Set",
    traits: 4,
    chain: 0,
  },
  junior: {
    setType: "Set",
    traits: 3,
    chain: 0,
  },
  setchain: {
    setType: "Set",
    traits: 4,
    chain: 1,
  },
  ultraset: {
    setType: "UltraSet",
    traits: 4,
    chain: 0,
  },
  ultrachain: {
    setType: "UltraSet",
    traits: 4,
    chain: 2,
  },
  ultra9: {
    setType: "UltraSet",
    traits: 4,
    chain: 0,
  },
  megaset: {
    setType: "Set",
    traits: 5,
    chain: 0,
  },
  ghostset: {
    setType: "GhostSet",
    traits: 4,
    chain: 0,
  },
  memory: {
    setType: "Set",
    traits: 4,
    chain: 0,
  },
};

/**
 * Compute remaining cards (arbitrary order) left in the deck after some
 * events, as well as the time of the final valid event.
 */
export function replayEvents(
  gameData: admin.database.DataSnapshot,
  gameMode: GameMode
) {
  if (!modes.hasOwnProperty(gameMode)) {
    throw new Error(`invalid gameMode: ${gameMode}`);
  }
  const events: GameEvent[] = [];
  gameData.child("events").forEach((e) => {
    events.push(e.val());
  });
  // Array.sort() is guaranteed to be stable in Node.js, and the latest ES spec
  events.sort((e1, e2) => e1.time - e2.time);

  const deck = generateDeck(gameMode);
  const chain = modes[gameMode].chain;
  const history: GameEvent[] = [];
  const scores: Record<string, number> = {};
  let finalTime = 0;
  for (const event of events) {
    if (replayEvent(deck, event, chain, history)) {
      history.push(event);
      scores[event.user] = (scores[event.user] ?? 0) + 1;
      finalTime = event.time;
    }
  }

  const lastSet =
    chain && history.length > 0
      ? cardsFromEvent(history[history.length - 1])
      : [];

  return { lastSet, deck, finalTime, scores };
}
