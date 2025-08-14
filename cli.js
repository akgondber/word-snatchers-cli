#!/usr/bin/env node

import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import cac from "cac";
import axios from "axios";
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
import { reverseTopicMappings } from "./constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execP = promisify(exec);
const cli = cac();
let roundNumber;

cli.option("--file [file]", "Use some specified data file for questions data", {
  default: path.join(__dirname, "data", "default.json"),
});

cli.option(
  "--suite [suite]",
  "Use specified suite (several game rounds from all json files inside the directory) to run questions from",
);

cli.option(
  "--suite-folder [suite]",
  "Use specified suite (several game rounds from all json files inside the directory) to run questions from",
  {
    default: path.join(__dirname, "data", "suite"),
  },
);

cli.option("--topic [topic]", "Use specific topic");

cli.option("--suite-item [suiteItem]", "Use specified suite by its name");

cli.option("--plugin <plugin>", "Use plugin as a source of questions");

cli.option("--http <http>", "Use http resource as a source of questions");
cli.option(
  "--answer-display-time",
  "How long to display each answer in summary when game was finished (in seconds)",
  {
    default: 7,
  },
);
cli.option("--round-number <roundNumber>", "Round number");

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

    if (options.roundNumber) {
      roundNumber = options.roundNumber;
    }

    if (options.suite) {
      const { suiteItem, suiteFolder } = options;
      let files;

      if (suiteItem) {
        files = [
          path.join(
            suiteFolder,
            suiteItem.endsWith(".json") ? suiteItem : `${suiteItem}.json`,
          ),
        ];
      } else {
        let folderToLook = suiteFolder;
        if (options.topic) {
          if (options.topic in reverseTopicMappings) {
            folderToLook = path.join(
              folderToLook,
              reverseTopicMappings[options.topic],
            );
          } else {
            folderToLook = path.join(folderToLook, options.topic);
          }
        }
        if (options.topic) {
          files = await FileHound.create()
            .paths(folderToLook)
            .ext("json")
            .find();
          if (files.length > 0)
            files = [files[Math.floor(Math.random() * files.length)]];
        } else {
          files = await FileHound.create()
            .paths(folderToLook)
            .ext("json")
            .find();
        }
      }
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
              }),
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
          `It seems like a specified plugin \`${options.plugin}\` has not been installed globally.`,
        );
      }
    } else if (options.http) {
      await runFromHttp(options.http);
    } else {
      await runGameRounds([options.file]);
    }
  });

const state = [];

const populateState = (obj) => {
  try {
    obj.map(validateQuestionObject);
  } catch (err) {
    errorMsg(
      `An error occured while getting question from a source:\n   ${err.message}\n`,
    );
    console.log(
      `${log.info}. Please check that question objects in a source have required keys.`,
    );
    process.exit(1);
  }

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
          0,
        );

        curr.map((questionItem, questionIndex) => {
          passed++;
          setTimeout(
            () => {
              console.clear();
              let summaryMsg = "";
              if (state.length > 1) {
                summaryMsg += `Round #${index + 1} results.\n`;
              }
              summaryMsg += `Summary: ${c.bold(
                correctAnswerCount,
              )} correct answer(s) out of ${c.bold(curr.length)}.\n\n`;

              console.log(summaryMsg);

              const askedQuestion = `${c.bgBlue.bold(
                ` #${questionIndex + 1} `,
              )} Definition: ${c.gray(questionItem.definition)}`;

              const { word, answer, correct } = questionItem;
              const status = correct ? log.success : log.error;
              let answerPanel = `${status} ${answer}`;

              if (!correct) {
                answerPanel = `${answerPanel}\n${log.success} ${word}`;
              }

              console.log(`${askedQuestion}\n\n${answerPanel}`);
            },
            // passed * 40 * 500
            passed === 1 ? 500 : passed * correctAnswerDisplayTime * 500,
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
  await startGame(items);
};

const runFromHttp = async (resourceOrResources) => {
  const resp = await axios.get(resourceOrResources);
  await startGame(resp.data);
};

const startGame = async (items) => {
  populateStateFromItems(items);
  initReadline();
  await askRecursive(state[0].items[0]);
};

const populateStateFromItems = (items) => {
  if (items.every(Array.isArray)) {
    if (roundNumber !== undefined) {
      const curr = items[roundNumber - 1];
      populateNthRound(curr, 1);
    } else {
      items.map((itemList, i) => {
        populateNthRound(itemList, i + 1);
      });
    }
  } else {
    populateNthRound(items, 1);
  }
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

const populateNthRound = (items, n) => {
  if ("items" in items[0]) {
    populateState(items[0].items, n);
  } else {
    populateState(items, n);
  }
};

cli.help();
cli.version("4.1.0");

cli.parse();
