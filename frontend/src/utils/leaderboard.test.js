import test from "node:test";
import assert from "node:assert/strict";

import { buildLeaderboard } from "./leaderboard.js";

test("buildLeaderboard sorts players by score descending and excludes the host", () => {
  const result = buildLeaderboard(
    [
      { id: "host", name: "Host" },
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
      { id: "p3", name: "Charlie" }
    ],
    { host: 999, p1: 100, p2: 300, p3: 200 },
    "host"
  );

  assert.deepEqual(
    result.map(({ id, score, rank }) => ({ id, score, rank })),
    [
      { id: "p2", score: 300, rank: 1 },
      { id: "p3", score: 200, rank: 2 },
      { id: "p1", score: 100, rank: 3 }
    ]
  );
});

test("buildLeaderboard uses deterministic ordering for equal scores", () => {
  const result = buildLeaderboard(
    [
      { id: "p2", name: "Boris" },
      { id: "p1", name: "Anna" },
      { id: "p3", name: "Anna" }
    ],
    { p1: 100, p2: 100, p3: 100 }
  );

  assert.deepEqual(
    result.map(({ id, rank }) => ({ id, rank })),
    [
      { id: "p1", rank: 1 },
      { id: "p3", rank: 2 },
      { id: "p2", rank: 3 }
    ]
  );
});

test("buildLeaderboard keeps every non-host participant, including players with zero scores", () => {
  const result = buildLeaderboard(
    [
      { id: "host", name: "Host" },
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
      { id: "p3", name: "Charlie" },
      { id: "p4", name: "Dora" },
      { id: "p5", name: "Eve" }
    ],
    { p1: 300, p2: 200, p3: 100, p4: 0, p5: 0 },
    "host"
  );

  assert.equal(result.length, 5);
  assert.deepEqual(
    result.map(({ id }) => id),
    ["p1", "p2", "p3", "p4", "p5"]
  );
});
