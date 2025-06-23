import moment from "moment";
import {
  RegExpMatcher,
  TextCensor,
  englishDataset,
  englishRecommendedTransformers,
  fixedPhraseCensorStrategy,
  pattern,
} from "obscenity";

import amber from "@material-ui/core/colors/amber";
import blue from "@material-ui/core/colors/blue";
import cyan from "@material-ui/core/colors/cyan";
import deepOrange from "@material-ui/core/colors/deepOrange";
import deepPurple from "@material-ui/core/colors/deepPurple";
import green from "@material-ui/core/colors/green";
import indigo from "@material-ui/core/colors/indigo";
import lightBlue from "@material-ui/core/colors/lightBlue";
import lightGreen from "@material-ui/core/colors/lightGreen";
import lime from "@material-ui/core/colors/lime";
import orange from "@material-ui/core/colors/orange";
import pink from "@material-ui/core/colors/pink";
import purple from "@material-ui/core/colors/purple";
import red from "@material-ui/core/colors/red";
import teal from "@material-ui/core/colors/teal";
import yellow from "@material-ui/core/colors/yellow";

import animals from "./utils/animals.json";

function isPunctuation(charCode) {
  return (
    (charCode >= 33 && charCode <= 47) ||
    (charCode >= 58 && charCode <= 64) ||
    (charCode >= 91 && charCode <= 96) ||
    (charCode >= 0x2000 && charCode <= 0x206f)
  );
}

const fixedDataset = englishDataset
  .addPhrase((phrase) =>
    phrase.setMetadata({ originalWord: "ass" }).addWhitelistedTerm("45s")
  )
  .addPhrase((phrase) =>
    phrase
      .setMetadata({ originalWord: "brainrot" })
      .addPattern(pattern`skibidi`)
      .addPattern(pattern`|riz`)
      .addPattern(pattern`gyat`)
      .addPattern(pattern`sigma`)
      .addPattern(pattern`xook[s]`)
      .addPattern(pattern`zook[s]`)
      .addPattern(pattern`xoink`)
      .addPattern(pattern`xooink`)
      .addPattern(pattern`xioix`)
      .addPattern(pattern`xiooix`)
      .addPattern(pattern`admits`)
      .addPattern(pattern`lebron`)
      .addPattern(pattern`lebroon`)
  );
// Work-around for:
// https://github.com/jo3-l/obscenity/issues/100
// https://github.com/jo3-l/obscenity/pull/101
function createSimpleTransformer(transformer) {
  return { type: 0 /* TransformerType.Simple */, transform: transformer };
}
export const badWords = new RegExpMatcher({
  ...fixedDataset.build(),
  ...englishRecommendedTransformers,
  blacklistMatcherTransformers: [
    ...englishRecommendedTransformers.blacklistMatcherTransformers,
    createSimpleTransformer((c) => (!isPunctuation(c) ? c : undefined)),
  ],
});
const censor = new TextCensor().setStrategy(fixedPhraseCensorStrategy("🤬"));

export const colors = {
  red,
  pink,
  purple,
  deepPurple,
  indigo,
  blue,
  lightBlue,
  cyan,
  teal,
  green,
  lightGreen,
  lime,
  yellow,
  amber,
  orange,
  deepOrange,
};

export const standardLayouts = {
  QWERTY: {
    verticalLayout: "123qweasdzxcrtyfghvbnuiojklm,.",
    horizontalLayout: "qazwsxedcrfvtgbyhnujmik,ol.p;/",
  },
  AZERTY: {
    verticalLayout: '&é"azeqsdwxcrtyfghvbnuiojkl,;:',
    horizontalLayout: "aqwzsxedcrfvtgbyhnuj,ik;ol:pm!",
  },
  QWERTZ: {
    verticalLayout: "123qweasdyxcrtzfghvbnuiojklm,.",
    // ö is from the German layout; other languages have different letters
    horizontalLayout: "qaywsxedcrfvtgbzhnujmik,ol.pö-",
  },
  Dvorak: {
    verticalLayout: "123',.aoe;qjpyfuidkxbgcrhtnmwv",
    horizontalLayout: "'a;,oq.ejpukyixfdbghmctwrnvlsz",
  },
  Colemak: {
    verticalLayout: "123qwfarszxcpgjtdhvbkluyneim,.",
    horizontalLayout: "qazwrxfscptvgdbjhklnmue,yi.;o/",
  },
  Workman: {
    verticalLayout: "123qdrashzxmwbjtgycvkfupneol,.",
    horizontalLayout: "qazdsxrhmwtcbgvjykfnlue,po.;i/",
  },
  Neo: {
    verticalLayout: "123xvluiaüöäcwkeospzbhgfnrtm,.",
    horizontalLayout: "xuüviölaäcepwozksbhnmgr,ft.qdj",
  },
};

export function generateColor() {
  const colorsArray = Object.keys(colors);
  return colorsArray[Math.floor(Math.random() * colorsArray.length)];
}

export function getColor(color, theme) {
  const c = colors.hasOwnProperty(color) ? colors[color] : indigo;
  return c[theme.palette.type === "dark" ? 100 : 900];
}

export function generateName() {
  return "Anonymous " + animals[Math.floor(Math.random() * animals.length)];
}

export function formatTime(t, hideSubsecond) {
  t = Math.max(t, 0);
  const hours = Math.floor(t / (3600 * 1000));
  const rest = t % (3600 * 1000);
  const format = hideSubsecond ? "mm:ss" : "mm:ss.SS";
  return (hours ? `${hours}:` : "") + moment.utc(rest).format(format);
}

export function formatCount(count, singular, plural = null) {
  const noun = count === 1 ? singular : (plural ?? singular + "s");
  return `${count} ${noun}`;
}

export function formatANoun(word) {
  const a = /^[aeiou]/i.test(word) ? "an" : "a"; // crud heuristic
  return `${a} ${word}`;
}

export function censorText(text) {
  return censor.applyTo(text, badWords.getAllMatches(text));
}

export function capitalizeFirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDateTime(timestamp) {
  const d = new Date(timestamp);
  const opts = { dateStyle: "medium", timeStyle: "short", hour12: false };
  return d.toLocaleString(undefined, opts);
}

const trimRegex =
  /^[\p{White_Space}\p{Default_Ignorable_Code_Point}]+|[\p{White_Space}\p{Default_Ignorable_Code_Point}]+$/gu;

export function unicodeTrim(str) {
  return str.replace(trimRegex, "");
}

export function parseDuration(spec) {
  const units = [7 * 24 * 3600, 24 * 3600, 3600, 60, 1];
  const re =
    /^(?:(\d+(?:\.\d+)?)w)?(?:(\d+(?:\.\d+)?)d)?(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?$/i;
  const m = re.exec(spec);
  return !m || !m[0]
    ? null
    : units
        .map((v, i) => (m[i + 1] ? parseFloat(m[i + 1]) * v : 0))
        .reduce((a, c) => a + c);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
