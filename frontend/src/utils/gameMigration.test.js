import test from "node:test";
import assert from "node:assert/strict";

import { migrateGame } from "./gameMigration.js";

test("migrateGame returns a safe default for invalid input", () => {
  assert.deepEqual(migrateGame(null, "training"), {
    title: "Новая игра",
    categories: [],
    gameMode: "training",
    modeSettings: {}
  });
});

test("migrateGame normalizes legacy and partial question data", () => {
  const result = migrateGame({
    title: "Demo",
    categories: [
      {
        questions: [
          {
            image: "legacy.png",
            time: "45",
            price: "300"
          },
          {
            situation: { title: "Case" },
            question: "Q",
            questionImage: "explicit.png",
            answer: "A",
            answerImage: "answer.png",
            explanation: { text: "Because" },
            time: 0,
            price: "bad"
          }
        ]
      }
    ]
  });

  assert.equal(result.title, "Demo");
  assert.equal(result.gameMode, "custom");
  assert.deepEqual(result.modeSettings, {});
  assert.equal(result.categories[0].name, "Раздел");

  assert.deepEqual(result.categories[0].questions[0], {
    situation: { title: "", description: "", image: "" },
    question: "",
    questionImage: "legacy.png",
    answer: "",
    answerImage: "",
    explanation: { title: "", text: "", image: "" },
    time: 45,
    price: 300
  });

  assert.deepEqual(result.categories[0].questions[1], {
    situation: { title: "Case", description: "", image: "" },
    question: "Q",
    questionImage: "explicit.png",
    answer: "A",
    answerImage: "answer.png",
    explanation: { title: "", text: "Because", image: "" },
    time: 30,
    price: 100
  });
});

test("migrateGame creates independent nested objects for each question", () => {
  const result = migrateGame({
    categories: [
      {
        questions: [
          {
            situation: { title: "First", description: "One", image: "" },
            explanation: { title: "Exp 1", text: "Alpha", image: "" }
          },
          {
            situation: { title: "Second", description: "Two", image: "" },
            explanation: { title: "Exp 2", text: "Beta", image: "" }
          }
        ]
      }
    ]
  });

  result.categories[0].questions[0].situation.title = "Changed";
  result.categories[0].questions[0].explanation.text = "Changed text";

  assert.equal(result.categories[0].questions[1].situation.title, "Second");
  assert.equal(result.categories[0].questions[1].explanation.text, "Beta");
});

test("migrateGame falls back to empty arrays for invalid category lists", () => {
  const result = migrateGame({
    categories: [
      null,
      { name: "Round 1", questions: "not-an-array" }
    ]
  });

  assert.deepEqual(result.categories, [
    { name: "Раздел", questions: [] },
    { name: "Round 1", questions: [] }
  ]);
});
