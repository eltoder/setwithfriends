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

export type GameMode = keyof typeof modes;

type SetType = keyof typeof setTypes;

interface GameModeInfo {
  setType: SetType;
  traits: number;
  chain: number;
  puzzle: boolean;
  minBoardSize: number;
}

export interface FindState {
  lastSet?: string[];
  foundSets?: Set<string>;
}

interface InternalGameState {
  current: Set<string>;
  gameMode: GameMode;
  minBoardSize: number;
  chain: number;
  puzzle: boolean;
  findState: FindState;
  board?: string[];
}

/** Generates a random seed. */
export function generateSeed() {
  let s = "v1:";
  for (let i = 0; i < 4; i++) {
    s += ((Math.random() * 2 ** 32) >>> 0).toString(16).padStart(8, "0");
  }
  return s;
}

// xoshiro128** (Vigna & Blackman, 2018) PRNG implementaion taken from
// https://stackoverflow.com/a/47593316/5190601
function makeRandom(seed: string) {
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

function makeCards(symbols: string[], traits: number): string[] {
  if (traits === 1) return symbols;
  return makeCards(symbols, traits - 1).flatMap((lhs) =>
    symbols.map((s) => lhs + s)
  );
}

function generateDeck(gameMode: GameMode, seed: string | null) {
  const deck = makeCards(["0", "1", "2"], modes[gameMode].traits);
  if (seed) {
    // Fisher-Yates
    const random = makeRandom(seed);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const temp = deck[i];
      deck[i] = deck[j];
      deck[j] = temp;
    }
  }
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

function findSetNormal(deck: string[], gameMode: GameMode, state: FindState) {
  const deckSet = new Set(deck);
  const first =
    modes[gameMode].chain && state.lastSet!.length > 0 ? state.lastSet! : deck;
  const foundSets = modes[gameMode].puzzle && state.foundSets!;
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

function findSetUltra(deck: string[], gameMode: GameMode, state: FindState) {
  const cutoff = modes[gameMode].chain ? state.lastSet!.length : 0;
  let cards, conjugates: Array<Map<string, [string, string]> | null>;
  if (cutoff > 0) {
    cards = state.lastSet!.concat(deck);
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

function findSetGhost(deck: string[], gameMode: GameMode, state: FindState) {
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
export function findSet(deck: string[], gameMode: GameMode, state: FindState) {
  return setTypes[modes[gameMode].setType].findFn(deck, gameMode, state);
}

/** Get the array of cards from a GameEvent */
function cardsFromEvent(event: GameEvent) {
  const cards = [event.c1, event.c2, event.c3];
  if (event.c4) cards.push(event.c4);
  if (event.c5) cards.push(event.c5);
  if (event.c6) cards.push(event.c6);
  return cards;
}

function copyFrom<T>(src: Iterator<T>, dest: T[], count: number) {
  for (let i = 0; i < count; i++) {
    const r = src.next();
    if (r.done) break;
    dest.push(r.value);
  }
}

/** Return the board form the deck that has at least one set */
function findBoard(
  deck: Set<string>,
  gameMode: GameMode,
  minBoardSize: number,
  state: FindState
) {
  const deckIter = deck.values();
  let board: string[] = [];
  copyFrom(deckIter, board, minBoardSize);
  while (board.length < deck.size && !findSet(board, gameMode, state)) {
    copyFrom(deckIter, board, 3 - (board.length % 3));
  }
  return board;
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
function replayEvent(internalGameState: InternalGameState, event: GameEvent) {
  const { current, chain, puzzle, findState } = internalGameState;
  const allCards = cardsFromEvent(event);
  let cards;
  if (chain && findState.lastSet!.length > 0) {
    cards = allCards.filter((c) => !findState.lastSet!.includes(c));
    if (allCards.length - cards.length !== chain) return false;
  } else {
    cards = allCards;
  }
  if (hasDuplicates(allCards) || !validCards(current, cards)) return false;
  if (puzzle) {
    const prevFound = findState.foundSets!.size;
    findState.foundSets!.add(allCards.slice().sort().join("|"));
    if (prevFound === findState.foundSets!.size) return false;
  }
  if (chain) {
    findState.lastSet = allCards;
  }
  if (!puzzle) {
    deleteCards(current, cards);
  } else {
    // in puzzle modes only advance after all sets were found
    const { board, gameMode, minBoardSize } = internalGameState;
    if (!findSet(board!, gameMode, findState)) {
      findState.foundSets!.clear();
      deleteCards(current, board!);
      const newBoard = findBoard(current, gameMode, minBoardSize, findState);
      internalGameState.board = newBoard;
    }
  }
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

export const modes = {
  normal: {
    setType: "Set",
    traits: 4,
    chain: 0,
    puzzle: false,
    minBoardSize: 12,
  },
  junior: {
    setType: "Set",
    traits: 3,
    chain: 0,
    puzzle: false,
    minBoardSize: 9,
  },
  setchain: {
    setType: "Set",
    traits: 4,
    chain: 1,
    puzzle: false,
    minBoardSize: 12,
  },
  ultraset: {
    setType: "UltraSet",
    traits: 4,
    chain: 0,
    puzzle: false,
    minBoardSize: 12,
  },
  ultrachain: {
    setType: "UltraSet",
    traits: 4,
    chain: 2,
    puzzle: false,
    minBoardSize: 12,
  },
  ultra9: {
    setType: "UltraSet",
    traits: 4,
    chain: 0,
    puzzle: false,
    minBoardSize: 9,
  },
  megaset: {
    setType: "Set",
    traits: 5,
    chain: 0,
    puzzle: false,
    minBoardSize: 16,
  },
  ghostset: {
    setType: "GhostSet",
    traits: 4,
    chain: 0,
    puzzle: false,
    minBoardSize: 10,
  },
  puzzle: {
    setType: "Set",
    traits: 4,
    chain: 0,
    puzzle: true,
    minBoardSize: 12,
  },
  memory: {
    setType: "Set",
    traits: 4,
    chain: 0,
    puzzle: false,
    minBoardSize: 21,
  },
} satisfies Record<string, GameModeInfo>;

/**
 * Compute remaining cards (arbitrary order) left in the deck after some
 * events, as well as the time of the final valid event.
 */
export function replayEvents(
  gameData: admin.database.DataSnapshot,
  gameMode: GameMode
) {
  if (!modes.hasOwnProperty(gameMode)) {
    throw new Error(`Invalid gameMode: ${gameMode}`);
  }
  const events: GameEvent[] = [];
  gameData.child("events").forEach((e) => {
    events.push(e.val());
  });
  // Array.sort() is guaranteed to be stable in Node.js, and the latest ES spec
  events.sort((e1, e2) => e1.time - e2.time);

  const chain = modes[gameMode].chain;
  const puzzle = modes[gameMode].puzzle;
  const minBoardSize = modes[gameMode].minBoardSize;
  // no need to shuffle the deck in non-puzzle modes
  const seed = puzzle ? gameData.child("seed").val() : null;
  const current = generateDeck(gameMode, seed);
  const findState: FindState = {
    lastSet: chain ? [] : undefined,
    foundSets: puzzle ? new Set() : undefined,
  };
  const scores: Record<string, number> = {};
  const internalGameState = {
    current,
    gameMode,
    minBoardSize,
    chain,
    puzzle,
    findState,
    board: puzzle
      ? findBoard(current, gameMode, minBoardSize, findState)
      : undefined,
  };
  let finalTime = 0;
  for (const event of events) {
    if (replayEvent(internalGameState, event)) {
      scores[event.user] = (scores[event.user] ?? 0) + 1;
      finalTime = event.time;
    }
  }

  return { findState, current, finalTime, scores };
}
