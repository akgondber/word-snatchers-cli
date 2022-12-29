import fs from "fs";
import { assert, object, string, size } from "superstruct";
import fastShuffle from "fast-shuffle";
import log from "log-utils";

const { shuffle } = fastShuffle;

const utils = {
  assert,
  object,
  size,
};

const validateQuestionObject = (item) => {
  const Question = utils.object({
    definition: utils.size(string(), 5, 250),
    word: utils.size(string(), 2, 30),
  });

  utils.assert(item, Question);
};

const readDataFile = (dataFile) => {
  return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
};

const shuffleWord = (word) => {
  const chars = word.split("");
  const shuffled = shuffle(chars);
  return shuffled.join("");
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
};
