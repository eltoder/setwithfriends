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

import animals from "./utils/animals.json";

const fixedDataset = englishDataset
  .removePhrasesIf((phrase) => phrase.metadata.originalWord === "dick")
  .addPhrase((phrase) =>
    phrase
      .setMetadata({ originalWord: "dick" })
      .addPattern(pattern`dick`)
      .addPattern(pattern`|dck|`)
      .addWhitelistedTerm("benedick")
      .addWhitelistedTerm("dickens")
  )
  .addPhrase((phrase) =>
    phrase.setMetadata({ originalWord: "fuck" }).addWhitelistedTerm("fick")
  );
export const badWords = new RegExpMatcher({
  ...fixedDataset.build(),
  ...englishRecommendedTransformers,
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

export function censorText(text) {
  return censor.applyTo(text, badWords.getAllMatches(text));
}

export function capitalizeFirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
