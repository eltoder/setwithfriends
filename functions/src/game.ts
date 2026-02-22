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

type Random = () => number;

// xoshiro128** (Vigna & Blackman, 2018) PRNG implementaion taken from
// https://stackoverflow.com/a/47593316/5190601
function makeRandom(seed: string) {
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

function makeCards(symbols: string[], traits: number): string[] {
  if (traits === 1) return symbols;
  return makeCards(symbols, traits - 1).flatMap((lhs) =>
    symbols.map((s) => lhs + s)
  );
}

function shuffleCards(deck: string[], count: number, random: Random) {
  // Fisher-Yates
  for (let i = Math.min(count, deck.length) - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  return deck;
}

function generateDeck(gameMode: GameMode, random: Random | null) {
  const symbols = Array.from(
    Array(setTypes[modes[gameMode].setType].variants),
    (_, i) => i + ""
  );
  const deck = makeCards(symbols, modes[gameMode].traits);
  return new Set(random ? shuffleCards(deck, deck.length, random) : deck);
}

/** Return the unique card c such that {a, b, c} form a set. */
function conjugateCard(a: string, b: string) {
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
function conjugateCard4Set(a: string, b: string, c: string) {
  let d = "";
  for (let i = 0; i < a.length; i++) {
    d += String.fromCharCode(
      a.charCodeAt(i) ^ b.charCodeAt(i) ^ c.charCodeAt(i)
    );
  }
  return d;
}

/** Check if three cards form a set. */
function checkSetNormal(a: string, b: string, c: string) {
  for (let i = 0; i < a.length; i++) {
    if ((a.charCodeAt(i) + b.charCodeAt(i) + c.charCodeAt(i)) % 3) return null;
  }
  return [a, b, c];
}

/** Check if four cards form an ultraset */
function checkSetUltra(a: string, b: string, c: string, d: string) {
  if (conjugateCard(a, b) === conjugateCard(c, d)) return [a, b, c, d];
  if (conjugateCard(a, c) === conjugateCard(b, d)) return [a, c, b, d];
  if (conjugateCard(a, d) === conjugateCard(b, c)) return [a, d, b, c];
  return null;
}

/** Check if six cards form a ghostset */
function checkSetGhost(
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
    if (sum % 3) return null;
  }
  return [a, b, c, d, e, f];
}

/** Check if four cards form a 4Set */
function checkSet4Set(a: string, b: string, c: string, d: string) {
  for (let i = 0; i < a.length; i++) {
    if (a.charCodeAt(i) ^ b.charCodeAt(i) ^ c.charCodeAt(i) ^ d.charCodeAt(i))
      return null;
  }
  return [a, b, c, d];
}

function* findSetNormal(deck: string[], gameMode: GameMode, state: FindState) {
  const deckSet = new Set(deck);
  const first =
    modes[gameMode].chain && state.lastSet!.length > 0 ? state.lastSet! : deck;
  for (let i = 0; i < first.length; i++) {
    for (let j = first === deck ? i + 1 : 0; j < deck.length; j++) {
      const c = conjugateCard(first[i], deck[j]);
      if (deckSet.has(c)) {
        yield [first[i], deck[j], c];
      }
    }
  }
}

function* findSetUltra(deck: string[], gameMode: GameMode, state: FindState) {
  const cutoff = modes[gameMode].chain ? state.lastSet!.length : 0;
  const deckSet = new Set(deck);
  let first, second, prevSet;
  if (!cutoff) {
    first = second = deck;
  } else {
    second = state.lastSet!;
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
          checkSet!.has(c2) &&
          c2 !== first[i] &&
          c2 !== second[j] &&
          c2 !== deck[k]
        ) {
          yield [first[i], second[j], deck[k], c2];
        }
      }
    }
  }
}

function* findSetGhost(deck: string[], gameMode: GameMode, state: FindState) {
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
              if (cand) yield cand;
            }
          }
        }
      }
    }
  }
}

function* findSet4Set(deck: string[], gameMode: GameMode, state: FindState) {
  const deckSet = new Set(deck);
  const first =
    modes[gameMode].chain && state.lastSet!.length > 0 ? state.lastSet! : deck;
  for (let i = 0; i < first.length; i++) {
    for (let j = i + 1; j < first.length; j++) {
      for (let k = first === deck ? j + 1 : 0; k < deck.length; k++) {
        const c = conjugateCard4Set(first[i], first[j], deck[k]);
        if (deckSet.has(c)) {
          yield [first[i], first[j], deck[k], c];
        }
      }
    }
  }
}

/** Find a set in an unordered collection of cards, if any, depending on mode. */
export function findSet(deck: string[], gameMode: GameMode, state: FindState) {
  const foundSets = modes[gameMode].puzzle && state.foundSets;
  const sets = setTypes[modes[gameMode].setType].findFn(deck, gameMode, state);
  for (const set of sets) {
    if (!(foundSets && foundSets.has(set.sort().join("|")))) {
      return set;
    }
  }
  return null;
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
  const board: string[] = [];
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
  "4set": {
    setType: "4Set",
    traits: 4,
    chain: 0,
    puzzle: false,
    minBoardSize: 15,
  },
  "4setjr": {
    setType: "4Set",
    traits: 3,
    chain: 0,
    puzzle: false,
    minBoardSize: 11,
  },
  "4setjrchain": {
    setType: "4Set",
    traits: 3,
    chain: 2,
    puzzle: false,
    minBoardSize: 11,
  },
  puzzle: {
    setType: "Set",
    traits: 4,
    chain: 0,
    puzzle: true,
    minBoardSize: 12,
  },
  ultra9puzzle: {
    setType: "UltraSet",
    traits: 4,
    chain: 0,
    puzzle: true,
    minBoardSize: 9,
  },
  "4setjrpuzzle": {
    setType: "4Set",
    traits: 3,
    chain: 0,
    puzzle: true,
    minBoardSize: 11,
  },
  shuffle: {
    setType: "Set",
    traits: 4,
    chain: 0,
    puzzle: false,
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
  const random = puzzle ? makeRandom(gameData.child("seed").val()) : null;
  const current = generateDeck(gameMode, random);
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
