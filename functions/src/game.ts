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
  | "ultra9"
  | "megaset"
  | "ghostset";

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

/** Check if three cards form a set. */
export function checkSet(a: string, b: string, c: string) {
  for (let i = 0; i < a.length; i++) {
    if ((a.charCodeAt(i) + b.charCodeAt(i) + c.charCodeAt(i)) % 3 !== 0)
      return null;
  }
  return [a, b, c];
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

/** Find a set in an unordered collection of cards, if any, depending on mode. */
export function findSet(deck: string[], gameMode: GameMode, old?: string[]) {
  const setType = modes[gameMode].setType;
  if (setType === "Set") {
    const deckSet = new Set(
      gameMode === "setchain" && old!.length > 0 ? old : deck
    );
    for (let i = 0; i < deck.length; i++) {
      for (let j = i + 1; j < deck.length; j++) {
        const c = conjugateCard(deck[i], deck[j]);
        if (deckSet.has(c)) {
          return [c, deck[i], deck[j]];
        }
      }
    }
  } else if (setType === "UltraSet") {
    const conjugates: Map<string, [string, string]> = new Map();
    for (let i = 0; i < deck.length; i++) {
      for (let j = i + 1; j < deck.length; j++) {
        const c = conjugateCard(deck[i], deck[j]);
        if (conjugates.has(c)) {
          return [...conjugates.get(c)!, deck[i], deck[j]];
        }
        conjugates.set(c, [deck[i], deck[j]]);
      }
    }
  } else if (setType === "GhostSet") {
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
  }
  return null;
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

/** Replay game event for normal, ultra and ghost modes */
function replayEventCommon(
  deck: Set<string>,
  event: GameEvent,
  history: GameEvent[]
) {
  const cards = [event.c1, event.c2, event.c3];
  if (event.c4) cards.push(event.c4);
  if (event.c5) cards.push(event.c5);
  if (event.c6) cards.push(event.c6);
  if (hasDuplicates(cards) || !validCards(deck, cards)) return false;
  deleteCards(deck, cards);
  return true;
}

/** Replay game event for setchain mode */
function replayEventChain(
  deck: Set<string>,
  event: GameEvent,
  history: GameEvent[]
) {
  const { c1, c2, c3 } = event;
  const allCards = [c1, c2, c3];
  const cards = history.length === 0 ? allCards : allCards.slice(1);
  if (hasDuplicates(allCards) || !validCards(deck, cards)) return false;
  if (history.length) {
    // One card (c1) should be taken from the previous set
    const prev = history[history.length - 1];
    if (![prev.c1, prev.c2, prev.c3].includes(c1)) return false;
  }
  deleteCards(deck, cards);
  return true;
}

const modes = {
  normal: {
    setType: "Set",
    traits: 4,
    replayFn: replayEventCommon,
  },
  junior: {
    setType: "Set",
    traits: 3,
    replayFn: replayEventCommon,
  },
  setchain: {
    setType: "Set",
    traits: 4,
    replayFn: replayEventChain,
  },
  ultraset: {
    setType: "UltraSet",
    traits: 4,
    replayFn: replayEventCommon,
  },
  ultra9: {
    setType: "UltraSet",
    traits: 4,
    replayFn: replayEventCommon,
  },
  megaset: {
    setType: "Set",
    traits: 5,
    replayFn: replayEventCommon,
  },
  ghostset: {
    setType: "GhostSet",
    traits: 4,
    replayFn: replayEventCommon,
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
  const history: GameEvent[] = [];
  const scores: Record<string, number> = {};
  const replayFn = modes[gameMode].replayFn;
  let finalTime = 0;
  for (const event of events) {
    if (replayFn(deck, event, history)) {
      history.push(event);
      scores[event.user] = (scores[event.user] ?? 0) + 1;
      finalTime = event.time;
    }
  }

  let lastSet: string[] = [];
  if (gameMode === "setchain" && history.length > 0) {
    const lastEvent = history[history.length - 1];
    lastSet = [lastEvent.c1, lastEvent.c2, lastEvent.c3];
  }

  return { lastSet, deck, finalTime, scores };
}
