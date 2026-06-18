import test from "node:test";
import assert from "node:assert/strict";

import { HOST_SIGNAL, getTrainingDurationMs, isHostSignalDuration } from "./trainingTiming.js";

test("isHostSignalDuration detects host-controlled timing", () => {
  assert.equal(isHostSignalDuration(HOST_SIGNAL), true);
  assert.equal(isHostSignalDuration(5), false);
});

test("getTrainingDurationMs returns null for host-controlled timing", () => {
  assert.equal(getTrainingDurationMs(HOST_SIGNAL, 5), null);
});

test("getTrainingDurationMs converts seconds and falls back for invalid values", () => {
  assert.equal(getTrainingDurationMs(7, 5), 7000);
  assert.equal(getTrainingDurationMs("9", 5), 9000);
  assert.equal(getTrainingDurationMs(undefined, 5), 5000);
});
