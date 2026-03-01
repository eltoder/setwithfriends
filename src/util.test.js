import { badWords, formatANoun, formatTime, parseDuration } from "./util";

describe("bad words filter", () => {
  it("sort of works", () => {
    expect(badWords.hasMatch("Rona Wang")).toBe(false);
    expect(badWords.hasMatch("queer")).toBe(false);
    expect(badWords.hasMatch("lesbian")).toBe(false);
    expect(badWords.hasMatch("gay")).toBe(false);
    expect(badWords.hasMatch("fuck")).toBe(true);
    expect(badWords.hasMatch("cunting")).toBe(true);
    expect(badWords.hasMatch("retard")).toBe(true);
    expect(badWords.hasMatch("ducks")).toBe(false);
    expect(badWords.hasMatch("deck")).toBe(false);
    expect(badWords.hasMatch("fick")).toBe(false);
    expect(badWords.hasMatch("fickle")).toBe(false);
    expect(badWords.hasMatch("a\u200dsshole")).toBe(true);
    expect(badWords.hasMatch("45s")).toBe(false);
  });
});

it("formatANoun works", () => {
  expect(formatANoun("Set")).toBe("a Set");
  expect(formatANoun("UltraSet")).toBe("an UltraSet");
  expect(formatANoun("GhostSet")).toBe("a GhostSet");
  expect(formatANoun("4Set")).toBe("a 4Set");
});

it("parseDuration works", () => {
  expect(parseDuration("2w")).toBe(2 * 7 * 24 * 3600);
  expect(parseDuration("3d")).toBe(3 * 24 * 3600);
  expect(parseDuration("1.5h")).toBe(1.5 * 3600);
  expect(parseDuration("20m")).toBe(20 * 60);
  expect(parseDuration("300s")).toBe(300);
  expect(parseDuration("1h30m")).toBe(1.5 * 3600);
  expect(parseDuration("1w1d1h1m")).toBe((8 * 24 + 1) * 3600 + 60);
  expect(parseDuration("1d1w")).toBe(null);
  expect(parseDuration("300")).toBe(null);
  expect(parseDuration("")).toBe(null);
});

it("formatTime works", () => {
  const check = (ms, expected) => {
    expect(formatTime(ms)).toBe(expected);
    expect(formatTime(ms, true)).toBe(expected.slice(0, -3));
  };
  check(-12345, "00:00.00");
  check(0, "00:00.00");
  check(999, "00:00.99");
  check(12349, "00:12.34");
  check(59999, "00:59.99");
  check(123000, "02:03.00");
  check(123459, "02:03.45");
  check(1234599, "20:34.59");
  check(3599999, "59:59.99");
  check(3600000, "01:00:00.00");
  check(3725669, "01:02:05.66");
  check(37256699, "10:20:56.69");
  check(372566999, "4:07:29:26.99");
});
