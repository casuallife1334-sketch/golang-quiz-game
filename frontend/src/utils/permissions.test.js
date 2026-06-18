import test from "node:test";
import assert from "node:assert/strict";

import { canEndGame } from "./permissions.js";

test("canEndGame allows the host to end the game", () => {
  assert.equal(canEndGame({ isHost: true }), true);
});

test("canEndGame denies non-host players from ending the game", () => {
  assert.equal(canEndGame({ isHost: false }), false);
  assert.equal(canEndGame({}), false);
});
