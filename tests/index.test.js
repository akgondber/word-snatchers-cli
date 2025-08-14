import fs from "fs";
import { test } from "uvu";
import { expect } from "expect";
import sinon from "sinon";
import log from "log-utils";
import {
  successMsg,
  errorMsg,
  readDataFile,
  validateQuestionObject,
  utils,
  isFn,
} from "../src/index.js";

const fakeFn = sinon.fake();
const spyFn = sinon.spy();

test.after.each(() => {
  sinon.restore();
});

test("readDataFile", () => {
  sinon.replace(JSON, "parse", fakeFn);
  const questionsFile = "C://fake/file.json";
  const dataFromFile = '{"foo": "bar"}';
  sinon.replace(fs, "readFileSync", sinon.fake.returns(dataFromFile));
  readDataFile(questionsFile);
  expect(fs.readFileSync.calledWith("C://fake/file.json")).toBeTruthy();
  expect(JSON.parse.calledWith(dataFromFile)).toBeTruthy();
});

test("validateQuestionObject", () => {
  const questionItem = { word: "a", definition: "Yn hcds sdcvd" };
  const sizeSpy = sinon.spy(utils, "size");
  sinon.replace(utils, "assert", spyFn);
  sinon.replace(utils, "object", spyFn);
  sinon.replace(utils, "size", sizeSpy);
  validateQuestionObject(questionItem);

  expect(utils.size.called).toBeTruthy();
  expect(utils.object.called).toBeTruthy();
  expect(utils.object.getCall(0).args[0]).toEqual(
    expect.objectContaining({
      definition: expect.anything(),
      word: expect.anything(),
    }),
  );

  expect(sizeSpy.callCount).toEqual(2);
  expect(sizeSpy.getCall(0).args).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "string" }),
      5,
      250,
    ]),
  );
  expect(sizeSpy.getCall(1).args).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "string" }),
      2,
      30,
    ]),
  );
});

test("successMsg", () => {
  const consoleSpy = sinon.spy();

  sinon.replaceGetter(log, "success", () => "successIcon");
  sinon.replace(console, "log", consoleSpy);

  successMsg("content");
  expect(consoleSpy.getCall(0).args[0]).toEqual("successIcon content");
});

test("errorMsg", () => {
  const consoleSpy = sinon.spy();

  sinon.replaceGetter(log, "error", () => "errorIcon");
  sinon.replace(console, "log", consoleSpy);

  errorMsg("content");
  expect(consoleSpy.getCall(0).args[0]).toEqual("errorIcon content");
});

test("isFn", () => {
  expect(isFn(null)).toEqual(false);
  expect(isFn(undefined)).toEqual(false);
  expect(isFn("some string")).toEqual(false);
  expect(isFn(102)).toEqual(false);

  expect(isFn(() => {})).toEqual(true);
});

test.run();
