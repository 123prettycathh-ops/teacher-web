export const TYPES = [
  ["mc", "Multiple choice", "Students choose one correct answer."],
  ["enum", "Enumeration", "Students supply several answers."],
  ["ident", "Identification", "Students type one answer."],
];

export const makeDefault = (cat) => ({
  type: "ident",
  question: "Anong paksa ang tinatalakay sa araling ito?",
  answer: cat.word,
  choices: ["", ""],
  correct: 0,
  hint: "",
  explanation: "",
  lesson: "",
  custom: false,
});

export function answerText(q) {
  if (q.type === "mc") return q.choices[q.correct] || "—";
  if (q.type === "enum") return q.choices.filter(Boolean).join(", ") || "—";
  return q.answer || "—";
}

export const qKey = (catId, level, n) => catId + "|" + level + "|" + n;