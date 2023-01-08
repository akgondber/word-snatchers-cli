#!/usr/bin/env node

import path from "path";
import { fileURLToPath } from "url";
import cac from "cac";
import c from "ansi-colors";
import log from "log-utils";
import FileHound from "filehound";
import {
  readDataFile,
  validateQuestionObject,
  shuffleWord,
  successMsg,
  errorMsg,
} from "./src/index.js";
import Readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cli = cac();

cli.option("--file [file]", "Use some specified data file for questions data", {
  default: path.join(__dirname, "data", "default.json"),
});

cli.option(
  "--suite [suite]",
  "Use specified suite (several game rounds from all json files inside the directory) to run questions from"
);

cli.option(
  "--suite-folder [suite]",
  "Use specified suite (several game rounds from all json files inside the directory) to run questions from",
  {
    default: path.join(__dirname, "data", "suite"),
  }
);

let readline = Readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askP = (questionText) => {
  return new Promise((resolve) => {
    readline.question(questionText, resolve);
  });
};

cli
  .command("", "Start a new round of word snatchers game")
  .action(async (options) => {
    if (options.suite) {
      const { suiteFolder } = options;
      const files = await FileHound.create()
        .paths(suiteFolder)
        .ext("json")
        .find();
      await runGameRounds(files);
    } else {
      await runGameRounds([options.file]);
    }
  });

const state = [];
let curRoundIndex = 0;

const populateState = (obj) => {
  state.push({ items: obj });
};
const roundResults = [];

let curQuestionIndex = 0;
const askRecursive = async (question) => {
  validateQuestionObject(question);
  let init = "";
  if (state.length > 1) {
    init = `Round ${curRoundIndex + 1}; Question: #${curQuestionIndex + 1}\n`;
  }
  const msg =
    init +
    `
Definition: ${c.red(question.definition)}
Letters: ${c.cyan(shuffleWord(question.word))}
        `;

  const userAnswer = await askP(`${msg}\n`);
  const { word, definition } = question;
  const correct = word === userAnswer;
  roundResults[curRoundIndex] ||= [];
  roundResults[curRoundIndex].push({
    word,
    definition,
    answer: userAnswer,
    correct,
  });

  if (correct) {
    successMsg(userAnswer);
  } else {
    errorMsg(userAnswer);
  }

  curQuestionIndex++;

  if (curQuestionIndex + 1 > state[curRoundIndex].items.length) {
    if (curRoundIndex + 1 === state.length) {
      readline.close();
      let passed = 0;

      roundResults.map((curr, index) => {
        const correctAnswerCount = curr.reduce(
          (acc, obj) => (obj.correct ? acc + 1 : acc),
          0
        );

        curr.map((ele, roundIndex) => {
          passed++;
          setTimeout(() => {
            console.clear();
            let summaryMsg = "";
            if (state.length > 1) {
              summaryMsg += `Round #${index + 1}.\n`;
            }
            summaryMsg += `Summary: ${correctAnswerCount} correct answer(s) out of ${curr.length}.\n\n`;

            console.log(summaryMsg);

            const askedQuestion = `#${roundIndex + 1}
      Definition: ${c.gray(ele.definition)}`;

            const { word, answer, correct } = ele;
            const status = correct ? log.success : log.error;
            let answerPanel = `${status} ${answer}`;

            if (!correct) {
              answerPanel = `${answerPanel}\n${log.success} ${word}`;
            }

            console.log(`${askedQuestion}\n\n${answerPanel}`);
          }, passed * 2000);
        });
      });
      return;
    } else {
      curRoundIndex++;
      curQuestionIndex = 0;
    }
  }
  setTimeout(async () => {
    console.clear();
    await askRecursive(state[curRoundIndex].items[curQuestionIndex]);
  }, 500);
};

const runGameRounds = async (files) => {
  let roundNum = 1;
  files.map((file) => {
    const data = readDataFile(file);
    const items = data.items;
    populateState(items, roundNum);
  });
  console.clear();
  await askRecursive(state[0].items[0]);
};

cli.help();
cli.version("2.0.0");

cli.parse();
