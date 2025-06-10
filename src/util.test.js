import { badWords, parseDuration } from "./util";

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
  });
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
