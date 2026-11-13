import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { CATS } from "../categories";
import { api } from "../api";
import { useLang } from "../i18n";

const TYPES = [
  ["multiple-choice", "Multiple Choice"],
  ["identification", "Identification"],
  ["enumeration", "Enumeration"],
];

const MIN_POOL = 10;
const MAX_ACCEPTED = 20;
const CHOICES = 4;

const clean = (s) => (s ?? "").trim() || null;
const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
const blankPair = () => ({ tl: "", en: "" });
const zip = (tlList, enList) => {
  const tl = Array.isArray(tlList) ? tlList : [];
  const en = Array.isArray(enList) ? enList : [];
  return Array.from({ length: Math.max(tl.length, en.length) }, (_, i) => ({ tl: tl[i] ?? "", en: en[i] ?? "" }));
};
const padTo = (rows, n) => [...rows, ...Array.from({ length: Math.max(0, n - rows.length) }, blankPair)];
const filled = (r) => r.tl.trim() && r.en.trim();

function fromApi(q) {
  const en = q.en ?? {};
  const tlChoices = Array.isArray(q.choices) ? q.choices : [];
  const enChoices = Array.isArray(en.choices) ? en.choices : [];
  return {
    type: q.type,
    imageUrl: q.miniLessonImageUrl ?? null,
    custom: q.isOverride,
    required: q.requiredAnswers ?? 3,
    choices: Array.from({ length: CHOICES }, (_, i) => ({ tl: tlChoices[i] ?? "", en: enChoices[i] ?? "" })),
    accepted: zip(q.acceptedAnswers, en.acceptedAnswers),
    pool: padTo(zip(q.answerPool, en.answerPool), MIN_POOL),
    tl: {
      question: q.question ?? "", hint: q.hint ?? "", explanation: q.explanation ?? "",
      miniLesson: q.miniLesson ?? "", answer: q.correctAnswer ?? "",
    },
    en: {
      question: en.question ?? "", hint: en.hint ?? "", explanation: en.explanation ?? "",
      miniLesson: en.miniLesson ?? "", answer: en.correctAnswer ?? "",
    },
  };
}

function toApi(d) {
  const common = (x) => ({
    question: x.question.trim(), hint: clean(x.hint), explanation: clean(x.explanation), miniLesson: clean(x.miniLesson),
  });
  const base = { type: d.type, ...common(d.tl), miniLessonImageUrl: d.imageUrl };

  if (d.type === "multiple-choice") {
    const tl = d.choices.map((c) => c.tl.trim());
    const en = d.choices.map((c) => c.en.trim());
    const i = tl.findIndex((c) => same(c, d.tl.answer));
    return { ...base, choices: tl, correctAnswer: tl[i], en: { ...common(d.en), choices: en, correctAnswer: en[i] } };
  }
  if (d.type === "identification") {
    const acc = d.accepted.filter(filled);
    return {
      ...base,
      correctAnswer: d.tl.answer.trim(),
      acceptedAnswers: acc.map((r) => r.tl.trim()),
      en: { ...common(d.en), correctAnswer: d.en.answer.trim(), acceptedAnswers: acc.map((r) => r.en.trim()) },
    };
  }
  const pool = d.pool.filter(filled);
  return {
    ...base,
    answerPool: pool.map((r) => r.tl.trim()),
    requiredAnswers: Number(d.required) || 1,
    en: { ...common(d.en), answerPool: pool.map((r) => r.en.trim()) },
  };
}

function check(d) {
  if (!d.tl.question.trim() || !d.en.question.trim()) return "Write the question in both English and Tagalog.";

  if (d.type === "multiple-choice") {
    if (d.choices.some((c) => !filled(c)))
      return "Fill in all 4 choices in both English and Tagalog.";
    if (!d.tl.answer.trim() || !d.en.answer.trim()) return "Write the correct answer in both English and Tagalog.";
    const i = d.choices.findIndex((c) => same(c.tl, d.tl.answer));
    if (i < 0) return "The Tagalog correct answer must match one of the Tagalog choices.";
    if (!same(d.choices[i].en, d.en.answer))
      return "The English correct answer must match the English choice in the same row.";
  }

  if (d.type === "identification") {
    if (!d.tl.answer.trim() || !d.en.answer.trim()) return "Write the correct answer in both English and Tagalog.";
    if (d.accepted.some((r) => (r.tl.trim() || r.en.trim()) && !filled(r)))
      return "Fill in each accepted answer in both English and Tagalog, or remove the empty one.";
  }

  if (d.type === "enumeration") {
    if (d.pool.some((r) => (r.tl.trim() || r.en.trim()) && !filled(r)))
      return "Fill in each pool answer in both English and Tagalog, or remove the incomplete one.";
    const n = d.pool.filter(filled).length;
    if (n < MIN_POOL) return `The Answer Pool needs at least ${MIN_POOL} answers (${n} filled).`;
    const req = Number(d.required);
    if (!req || req < 1) return "Required answers must be at least 1.";
    if (req > n) return "Required answers cannot be more than the number of pool answers.";
  }
  return "";
}

/* ---------- small building blocks ---------- */

function Clearable({ value, onChange, onClear, area, rows = 3, ...rest }) {
  const Tag = area ? "textarea" : "input";
  return (
    <div className="clear-wrap">
      <Tag className="field" value={value} onChange={(e) => onChange(e.target.value)} {...(area ? { rows } : {})} {...rest} />
      {value ? (
        <button type="button" className={"clear-x" + (area ? " top" : "")} aria-label="Clear" onClick={onClear ?? (() => onChange(""))}>✕</button>
      ) : null}
    </div>
  );
}

function Pair({ label, en, tl, onEn, onTl, area, rows = 3, enPh = "", tlPh = "" }) {
  return (
    <>
      <label className="f-label">{label}</label>
      <span className="hint">English</span>
      <Clearable area={area} rows={rows} value={en} onChange={onEn} placeholder={enPh} />
      <span className="hint">Tagalog</span>
      <Clearable area={area} rows={rows} value={tl} onChange={onTl} placeholder={tlPh} />
    </>
  );
}

function ColHeads() {
  return (
    <div className="cols">
      <span className="hint">English</span>
      <span className="hint">Tagalog</span>
    </div>
  );
}

/* ---------- page ---------- */

export default function QuestionEditor() {
  const { lang, t } = useLang();
  const { packId, catId, level, n } = useParams();
  const go = useNavigate();
  const { packs, refreshPacks } = useOutletContext();
  const pack = packs.find((p) => p.id === packId);
  const cat = CATS.find((c) => c.id === catId) ?? CATS[0];
  const path = `/packs/${packId}/questions/${cat.id}/${level}/${n}`;
  const backTo = "/dashboard/activity-management/" + packId + "/quiz?cat=" + cat.id + "&level=" + level;
  const fileRef = useRef(null);

  const [d, setD] = useState(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingType, setPendingType] = useState(null);

  const load = useCallback(async () => {
    try { setD(fromApi(await api(path))); } catch (e) { setErr(e.message); }
  }, [path]);
  useEffect(() => { load(); }, [load]);

  if (!d) return err ? <p style={{ color: "#c0392b" }}>{err}</p> : <p className="muted">Loading...</p>;

  const touch = () => { setNote(""); setErr(""); };
  const setTop = (patch) => { setD({ ...d, ...patch }); touch(); };
  const setField = (lng, key, v) => { setD({ ...d, [lng]: { ...d[lng], [key]: v } }); touch(); };

  // generic list helpers for choices / accepted / pool
  const setRow = (list, i, lng, v) =>
    setTop({ [list]: d[list].map((r, j) => (j === i ? { ...r, [lng]: v } : r)) });
  const delRow = (list, i) => setTop({ [list]: d[list].filter((_, j) => j !== i) });
  const addRow = (list) => setTop({ [list]: [...d[list], blankPair()] });

  const typeName = (v) => TYPES.find(([k]) => k === v)?.[1] ?? v;

  function askSwitch(v) {
    if (v !== d.type) setPendingType(v);
  }
  function confirmSwitch() {
    // clear the answers of the type we are leaving; question, hint, explanation, mini-lesson stay
    const patch = { type: pendingType };
    if (d.type === "multiple-choice") {
      patch.choices = Array.from({ length: CHOICES }, blankPair);
    } else if (d.type === "identification") {
      patch.accepted = [];
    } else {
      patch.pool = padTo([], MIN_POOL);
      patch.required = 3;
    }
    setD({ ...d, ...patch, tl: { ...d.tl, answer: "" }, en: { ...d.en, answer: "" } });
    setPendingType(null);
    touch();
  }

  function pickPicture(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErr("Please choose an image file.");
    if (file.size > 2 * 1024 * 1024) return setErr("Picture is too large (max 2 MB).");
    const r = new FileReader();
    r.onload = () => setTop({ imageUrl: r.result });
    r.readAsDataURL(file);
  }

  async function save() {
    const problem = check(d);
    if (problem) return setErr(problem);
    setBusy(true);
    try {
      await api(path, { method: "PUT", body: toApi(d) });
      refreshPacks?.();
      setNote("Saved.");
      setTimeout(() => go(backTo), 600);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  const poolFilled = d.pool.filter(filled).length;
  const acceptedFilled = d.accepted.filter(filled).length;

  return (
    <div className="cm qe" style={{ "--accent": cat.color }}>
      <Link to={backTo} className="back">{t("back_q")}</Link>

      <div className="cm-hero">
        <h1>{t("edit_q", { n })}</h1>
        <p>{lang === "tl" ? cat.nameTl : cat.name} · {t("level", { n: level })} · {pack ? pack.name : "Pack"}</p>
      </div>

      <div className="card">
        {note && <p className="success">{note}</p>}
        {err && <p className="error">{err}</p>}

        {/* Question type chips */}
        <label className="f-label">Question Type</label>
        <div className="chips">
          {TYPES.map(([v, name]) => (
            <button key={v} type="button" className={"chip" + (d.type === v ? " on" : "")} onClick={() => askSwitch(v)}>
              {name}
            </button>
          ))}
        </div>

        {/* Mini-Lesson / Hint (shown before the question) */}
        <Pair label="Mini-Lesson / Hint" area en={d.en.hint} tl={d.tl.hint}
          enPh="Short explanation before the question..." tlPh="Short explanation before the question..."
          onEn={(v) => setField("en", "hint", v)} onTl={(v) => setField("tl", "hint", v)} />

        <Pair label="Question" en={d.en.question} tl={d.tl.question}
          enPh="Type the question..." tlPh="Type the question..."
          onEn={(v) => setField("en", "question", v)} onTl={(v) => setField("tl", "question", v)} />

        {/* ---------- Multiple choice ---------- */}
        {d.type === "multiple-choice" && (
          <>
            <label className="f-label">Choices</label>
            <ColHeads />
            {d.choices.map((c, i) => (
              <div className="pair-row" key={i}>
                <input className="field" placeholder={`Choice ${i + 1}`} value={c.en} onChange={(e) => setRow("choices", i, "en", e.target.value)} />
                <div className="clear-wrap">
                  <input className="field" placeholder={`Choice ${i + 1}`} value={c.tl} onChange={(e) => setRow("choices", i, "tl", e.target.value)} />
                  {c.tl ? (
                    <button type="button" className="clear-x" aria-label="Clear" onClick={() => setRow("choices", i, "tl", "")}>✕</button>
                  ) : null}
                </div>
              </div>
            ))}

            <Pair label="Correct Answer" en={d.en.answer} tl={d.tl.answer}
              enPh="Correct answer..." tlPh="Correct answer..."
              onEn={(v) => setField("en", "answer", v)} onTl={(v) => setField("tl", "answer", v)} />
            <p className="hint">Type it exactly like one of the choices above.</p>
          </>
        )}

        {/* ---------- Identification ---------- */}
        {d.type === "identification" && (
          <>
            <Pair label="Correct Answer" en={d.en.answer} tl={d.tl.answer}
              enPh="Correct answer..." tlPh="Correct answer..."
              onEn={(v) => setField("en", "answer", v)} onTl={(v) => setField("tl", "answer", v)} />

            <div className="row between">
              <label className="f-label">Other Accepted Answers</label>
              <span className="count">{acceptedFilled}/{MAX_ACCEPTED}</span>
            </div>
            <p className="hint">Optional. Other ways of writing the same answer (e.g. a different spelling) that will also count as correct.</p>
            {d.accepted.length > 0 && <ColHeads />}
            {d.accepted.map((r, i) => (
              <div className="pair-row" key={i}>
                <input className="field" placeholder="Accepted answer" value={r.en} onChange={(e) => setRow("accepted", i, "en", e.target.value)} />
                <div className="clear-wrap">
                  <input className="field" placeholder="Accepted answer" value={r.tl} onChange={(e) => setRow("accepted", i, "tl", e.target.value)} />
                  <button type="button" className="clear-x" aria-label="Remove" onClick={() => delRow("accepted", i)}>✕</button>
                </div>
              </div>
            ))}
            {d.accepted.length < MAX_ACCEPTED && (
              <button type="button" className="dashed" onClick={() => addRow("accepted")}>+ Add an Accepted Answer</button>
            )}
          </>
        )}

        {/* ---------- Enumeration ---------- */}
        {d.type === "enumeration" && (
          <>
            <label className="f-label">How Many Answers the Player Must Give (Required Answers)</label>
            <Clearable value={String(d.required)} onChange={(v) => setTop({ required: v.replace(/\D/g, "") })} inputMode="numeric" />
            <p className="hint">This becomes the number of "tabs" / input boxes the player sees. It must not exceed the size of the Answer Pool below.</p>

            <div className="row between">
              <label className="f-label">Answer Pool (min. {MIN_POOL} possible answers)</label>
              <span className={"count" + (poolFilled >= MIN_POOL ? " ok" : "")}>{poolFilled} filled</span>
            </div>
            <ColHeads />
            {d.pool.map((r, i) => (
              <div className="pool-row" key={i}>
                <input className="field" placeholder={`Pool answer ${i + 1}`} value={r.en} onChange={(e) => setRow("pool", i, "en", e.target.value)} />
                <input className="field" placeholder={`Pool answer ${i + 1}`} value={r.tl} onChange={(e) => setRow("pool", i, "tl", e.target.value)} />
                <button type="button" className="del" aria-label="Remove answer" onClick={() => delRow("pool", i)}>✕</button>
              </div>
            ))}
            <button type="button" className="dashed" onClick={() => addRow("pool")}>+ Add a Pool Answer</button>
          </>
        )}

        <Pair label="Explanation (after the correct answer)" area rows={3} en={d.en.explanation} tl={d.tl.explanation}
          enPh="Why the answer is correct..." tlPh="Why the answer is correct..."
          onEn={(v) => setField("en", "explanation", v)} onTl={(v) => setField("tl", "explanation", v)} />

        <Pair label="Mini-Lesson" area rows={4} en={d.en.miniLesson} tl={d.tl.miniLesson}
          enPh="Type the mini-lesson..." tlPh="Type the mini-lesson..."
          onEn={(v) => setField("en", "miniLesson", v)} onTl={(v) => setField("tl", "miniLesson", v)} />

        {/* Lesson picture */}
        <label className="f-label">Lesson Picture</label>
        <p className="hint">
          This shows up in Mini-Lessons once the student finishes the activity. It never appears while the question is being answered, so it cannot give the answer away.
        </p>
        <div className="pic-box">
          {d.imageUrl
            ? <img src={d.imageUrl} alt="Lesson" />
            : <span>No picture — the category's default picture will be used.</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPicture} />
        <button type="button" className="btn accent block" onClick={() => fileRef.current?.click()}>
          {d.imageUrl ? "Change Picture" : "Choose a Picture"}
        </button>
        {d.imageUrl && (
          <button type="button" className="btn light block" onClick={() => setTop({ imageUrl: null })}>Remove Picture</button>
        )}

        <div className="actions-col">
          <button className="btn accent block big" disabled={busy} onClick={save}>Save the Question</button>
          <Link to={backTo} className="cancel">{t("cancel")}</Link>
        </div>
      </div>

      {pendingType && (
        <div className="dlg-overlay" onClick={() => setPendingType(null)}>
          <div className="dlg" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Switch to {typeName(pendingType)}?</h3>
            <p>
              The question, hint, explanation, and mini-lesson stay. The answers for the current type ({typeName(d.type)}) will be cleared.
              Nothing is saved until you tap Save the Question.
            </p>
            <div className="dlg-actions">
              <button type="button" onClick={confirmSwitch}>Switch and clear</button>
              <button type="button" onClick={() => setPendingType(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}