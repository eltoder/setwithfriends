import * as admin from "firebase-admin";

interface GameEvent {
  time: number;
  user: string;
  c1: string;
  c2: string;
  c3: string;
  c4?: string;
}

export type GameMode = "normal" | "setchain" | "ultraset" | "ultra9";

/** Generates a random 81-card deck using a Fisher-Yates shuffle. */
export function generateDeck() {
  const deck: Array<string> = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        for (let l = 0; l < 3; l++) {
          deck.push(`${i}${j}${k}${l}`);
        }
      }
    }
  }
  // Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  return deck;
}

/** Check if three cards form a set. */
export function checkSet(a: string, b: string, c: string) {
  for (let i = 0; i < a.length; i++) {
    if ((a.charCodeAt(i) + b.charCodeAt(i) + c.charCodeAt(i)) % 3 !== 0)
      return false;
  }
  return true;
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

/** Find a set in an unordered collection of cards, if any, depending on mode. */
export function findSet(deck: string[], gameMode: GameMode, old?: string[]) {
  const deckSet = new Set(deck);
  const ultraConjugates: Record<string, [string, string]> = {};
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      const c = conjugateCard(deck[i], deck[j]);
      if (
        gameMode === "normal" ||
        (gameMode === "setchain" && old!.length === 0)
      ) {
        if (deckSet.has(c)) {
          return [deck[i], deck[j], c];
        }
      } else if (gameMode === "setchain") {
        if (old!.includes(c)) {
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

/** Replay game event for normal and ultra modes */
function replayEventCommon(
  deck: Set<string>,
  event: GameEvent,
  history: GameEvent[]
) {
  const cards = [event.c1, event.c2, event.c3];
  if (event.c4) cards.push(event.c4);
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
    replayFn: replayEventCommon,
  },
  setchain: {
    replayFn: replayEventChain,
  },
  ultraset: {
    replayFn: replayEventCommon,
  },
  ultra9: {
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
  const events: GameEvent[] = [];
  gameData.child("events").forEach((e) => {
    events.push(e.val());
  });
  // Array.sort() is guaranteed to be stable in Node.js, and the latest ES spec
  events.sort((e1, e2) => e1.time - e2.time);

  const deck: Set<string> = new Set(gameData.child("deck").val());
  const history: GameEvent[] = [];
  const scores: Record<string, number> = {};
  const replayFn = modes[gameMode]?.replayFn;
  if (!replayFn) {
    throw new Error(`invalid gameMode ${gameMode}`);
  }
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
