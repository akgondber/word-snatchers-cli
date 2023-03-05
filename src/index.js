import fs from "fs";
import { optional, func, assert, object, string, size } from "superstruct";
import { shuffle } from "fast-shuffle";
import log from "log-utils";
import PluginBase from "./PluginBase.js";

// const { shuffle } = fastShuffle;

const utils = {
  assert,
  object,
  size,
};

const isFn = (value) => {
  const type = Object.prototype.toString.call(value);

  return (
    type === "[object Function]" ||
    type === "[object GeneratorFunction]" ||
    type === "[object AsyncFunction]"
  );
};

const validateQuestionObject = (item) => {
  const Question = utils.object({
    definition: utils.size(string(), 5, 250),
    word: utils.size(string(), 2, 30),
    checkAnswer: optional(func()),
    getCorrectWord: optional(func()),
  });

  utils.assert(item, Question);
};

const readDataFile = (dataFile) => {
  return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
};

const shuffleWord = (word) => {
  const chars = word.split("");
  let shuffled = shuffle(chars);
  let result = shuffled.join("");

  while (result === word) {
    shuffled = shuffle(chars);
    result = shuffled.join("");
  }

  return result;
};

const successMsg = (msg) => {
  console.log(`${log.success} ${msg}`);
};

const errorMsg = (msg) => {
  console.log(`${log.error} ${msg}`);
};

export default readDataFile;
export {
  readDataFile,
  shuffleWord,
  validateQuestionObject,
  successMsg,
  errorMsg,
  utils,
  isFn,
  PluginBase,
};
