#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import cac from "cac";
import c from "ansi-colors";
import log from "log-utils";
import {
  readDataFile,
  validateQuestionObject,
  shuffleWord,
} from "./src/index.js";
import Readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cli = cac();

cli.option("--file [file]", "Use some specified data file for questions data", {
  default: path.join(__dirname, "data", "default.json"),
});

cli
  .command("", "Start a new round of word snatchers game")
  .action((options) => {
    const readline = Readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const data = readDataFile(options.file);
    const items = data.items;
    let questionNumber = 0;

    const state = [];
    const ask = (question) => {
      validateQuestionObject(question);
      const msg = `
Definition: ${c.red(question.definition)}
Letters: ${c.cyan(shuffleWord(question.word))}
            `;
      console.clear();
      readline.question(`${msg}\n`, (name) => {
        const correct = name === question.word;

        state.push({
          number: questionNumber + 1,
          correct,
          answer: name,
          correctWord: question.word,
        });
        console.log(`${correct ? log.ok(" Correct") : `${log.error} Wrong`}!`);

        setTimeout(() => {
          console.clear();

          if (questionNumber < items.length - 1) {
            questionNumber = questionNumber + 1;
            ask(items[questionNumber]);
          } else {
            readline.close();
            const correctAnswerCount = state.reduce(
              (acc, obj) => (obj.correct ? acc + 1 : acc),
              0
            );
            state.map((curr, index) => {
              setTimeout(() => {
                console.clear();
                console.log(
                  `Summary: ${correctAnswerCount} correct answers out of ${state.length}.\n\n`
                );

                const obj = items[curr.number - 1];
                const askedQuestion = `#${index}
Definition: ${c.gray(obj.definition)}`;

                const { answer, correct } = curr;
                const status = correct ? log.success : log.error;
                let answerPanel = `${status} ${answer}`;
                const { word } = obj;

                if (!correct) {
                  answerPanel = `${answerPanel}\n${log.success} ${word}`;
                }

                console.log(`${askedQuestion}\n\n${answerPanel}`);
              }, index * 4000);
            });
          }
        }, 3000);
      });
    };
    ask(items[0]);
  });

cli.help();
cli.version("1.0.3");

cli.parse();
