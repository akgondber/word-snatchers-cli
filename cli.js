#!/usr/bin/env node

import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import cac from "cac";
import c from "ansi-colors";
import log from "log-utils";
import FileHound from "filehound";
import Readline from "readline";
import { promisify } from "util";
import { resolve as moduleResolve } from "mlly";
import {
  readDataFile,
  validateQuestionObject,
  shuffleWord,
  successMsg,
  errorMsg,
  isFn,
} from "./src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execP = promisify(exec);
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

cli.option("--plugin <plugin>", "Use plugin as a source of questions");
cli.option(
  "--answer-display-time",
  "How long to display each answer in summary when game was finished (in seconds)",
  {
    default: 7,
  }
);

let readline;

const askP = (questionText) => {
  return new Promise((resolve) => {
    readline.question(questionText, resolve);
  });
};

let correctAnswerDisplayTime;

cli
  .command("", "Start a new round of word snatchers game")
  .action(async (options) => {
    correctAnswerDisplayTime = options.answerDisplayTime;

    if (correctAnswerDisplayTime < 1) {
      correctAnswerDisplayTime = 1;
    }

    if (options.suite) {
      const { suiteFolder } = options;
      const files = await FileHound.create()
        .paths(suiteFolder)
        .ext("json")
        .find();
      await runGameRounds(files);
    } else if (options.plugin) {
      const invert = (p) => new Promise((res, rej) => p.then(rej, res));
      const firstOf = (ps) => invert(Promise.all(ps.map(invert)));

      const resolvePlugin = async (globalDirLookupCmd) => {
        return new Promise(async (resolve, reject) => {
          try {
            const globalDirLookupResult = await execP(globalDirLookupCmd);
            resolve(
              await moduleResolve(options.plugin, {
                url: globalDirLookupResult.stdout,
              })
            );
          } catch (err) {
            reject(err);
          }
        });
      };
      try {
        const pathToPlugin = await firstOf([
          resolvePlugin("yarn global dir"),
          resolvePlugin("npm root -g"),
        ]);
        const { default: PluginKlass } = await import(pathToPlugin);
        const pluginInstance = new PluginKlass();
        runFromPlugin(pluginInstance);
      } catch (err) {
        errorMsg(
          `It seems like a specified plugin \`${options.plugin}\` has not been installed globally.`
        );
      }
    } else {
      await runGameRounds([options.file]);
    }
  });

const state = [];

const populateState = (obj) => {
  state.push({ items: obj });
};
const roundResults = [];

let curRoundIndex = 0;
let curQuestionIndex = 0;

const askRecursive = async (question) => {
  validateQuestionObject(question);
  console.clear();

  let init = "";
  if (state.length > 1) {
    init = `Round #${curRoundIndex + 1}; Question #${curQuestionIndex + 1}\n`;
  }
  const msg =
    init +
    `
Definition: ${c.red(question.definition)}
Letters: ${c.cyan(shuffleWord(question.word))}

Type your answer: `;

  const userAnswer = await askP(`${msg}`);
  const { definition } = question;
  const word = isFn(question.getCorrectWord)
    ? question.getCorrectWord()
    : question.word;
  const correct = isFn(question.checkAnswer)
    ? question.checkAnswer(userAnswer)
    : word === userAnswer;
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

        curr.map((ele, questionIndex) => {
          passed++;
          setTimeout(
            () => {
              console.clear();
              let summaryMsg = "";
              if (state.length > 1) {
                summaryMsg += `Round #${index + 1} results.\n`;
              }
              summaryMsg += `Summary: ${c.bold(
                correctAnswerCount
              )} correct answer(s) out of ${c.bold(curr.length)}.\n\n`;

              console.log(summaryMsg);

              const askedQuestion = `${c.bgBlue.bold(
                ` #${questionIndex + 1} `
              )} Definition: ${c.gray(ele.definition)}`;

              const { word, answer, correct } = ele;
              const status = correct ? log.success : log.error;
              let answerPanel = `${status} ${answer}`;

              if (!correct) {
                answerPanel = `${answerPanel}\n${log.success} ${word}`;
              }

              console.log(`${askedQuestion}\n\n${answerPanel}`);
            },
            passed === 1 ? 500 : passed * correctAnswerDisplayTime * 1000
          );
        });
      });
      return;
    } else {
      curRoundIndex++;
      curQuestionIndex = 0;
    }
  }
  setTimeout(async () => {
    await askRecursive(state[curRoundIndex].items[curQuestionIndex]);
  }, 500);
};

const runFromPlugin = async (pluginInstance) => {
  const items = pluginInstance.build();

  if (items.every(Array.isArray)) {
    items.map((itemList, i) => {
      if ("items" in itemList[0]) {
        populateState(itemList[0].items, i + 1);
      } else {
        populateState(itemList, i + 1);
      }
    });
  } else {
    if ("items" in items[0]) {
      populateState(items[0].items, 1);
    } else {
      populateState(items, 1);
    }
  }
  initReadline();
  await askRecursive(state[0].items[0]);
};

const initReadline = () => {
  readline = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
};

const runGameRounds = async (files) => {
  initReadline();
  let roundNum = 1;
  files.map((file) => {
    const data = readDataFile(file);
    const items = data.items;
    populateState(items, roundNum);
  });

  await askRecursive(state[0].items[0]);
};

cli.help();
cli.version("2.1.1");

cli.parse();
