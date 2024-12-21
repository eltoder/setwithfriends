import { badWords } from "./util";

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
  });
});
