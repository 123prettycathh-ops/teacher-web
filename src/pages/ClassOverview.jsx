import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useLang } from "../i18n";
import { api } from "../api";

const colors = ["#b04aa0", "#2f5fb0", "#2ca05a", "#e08a2c", "#7a4fd6"];
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export default function ClassOverview() {
  const { t } = useLang();
  const { klass, setKlass, students, setStudents, reload } = useOutletContext();
  const code = klass?.code ?? "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(code);
  const [copied, setCopied] = useState(false);
  const [newName, setNewName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn) {
    setErr("");
    setBusy(true);
    try { await fn(); } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  const createClass = () => run(async () => {
    if (!newName.trim()) throw new Error("Type a class name first");
    await api("/classes", { method: "POST", body: { name: newName.trim() } });
    await reload();
  });

  const saveCode = (value) => run(async () => {
    const updated = await api(`/classes/${klass.id}/code`, { method: "PATCH", body: { code: value } });
    setKlass(updated);
  });

  function generate() {
    saveCode(Array.from({ length: 10 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join(""));
  }
  function share() {
    navigator.clipboard?.writeText("JuanWise Class Code: " + code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }
  async function save() {
    const v = draft.trim().toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(v)) { setErr("Class code must be exactly 10 letters or numbers"); return; }
    await saveCode(v);
    setEditing(false);
  }
  function remove(s) {
    if (!window.confirm(t("remove_confirm", { name: s.name }))) return;
    run(async () => {
      await api(`/classes/${klass.id}/members/${s.uid}`, { method: "DELETE" });
      setStudents(students.filter((x) => x.uid !== s.uid));
    });
  }

  if (!klass) {
    return (
      <div className="card center">
        <p>You don't have a class yet. Create one:</p>
        <input className="field" placeholder="Class name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <div className="actions" style={{ justifyContent: "center" }}>
          <button className="btn green" disabled={busy} onClick={createClass}>Create class</button>
        </div>
        {err && <p style={{ color: "#c0392b" }}>{err}</p>}
      </div>
    );
  }

  return (
    <>
      <div className="hero">
        <h1>{t("co_title")}</h1>
        <p>{t("co_sub")}</p>
        <span className="pill">{t("total", { n: students.length })}</span>
      </div>

      <div className="card center">
        <p className="label" style={{ marginTop: 0 }}>{t("class_code")}</p>
        {editing ? (
          <>
          <input className="field code-input" value={draft} maxLength={10} onChange={(e) => setDraft(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
            <div className="actions" style={{ justifyContent: "center" }}>
              <button className="btn green" disabled={busy} onClick={save}>{t("save")}</button>
              <button className="btn red" onClick={() => { setEditing(false); setDraft(code); setErr(""); }}>{t("cancel")}</button>
            </div>
          </>
        ) : (
          <>
            <div className="code">{code}</div>
            <div className="actions" style={{ justifyContent: "center" }}>
              <button className="btn navy" disabled={busy} onClick={generate}>{t("generate")}</button>
              <button className="btn blue icon-btn" title={t("edit_code")} onClick={() => { setDraft(code); setEditing(true); }}>✏️</button>
              <button className="btn green icon-btn" title={t("share_code")} onClick={share}>📤</button>
            </div>
            {copied && <p className="success">{t("copied", { code })}</p>}
          </>
        )}
        {err && <p style={{ color: "#c0392b" }}>{err}</p>}
      </div>

      <p className="label">{t("joined")}</p>
      <div className="grid">
        {students.map((s, i) => (
          <div className="card row" key={s.uid}>
            <div className="avatar" style={{ background: colors[i % colors.length] }}>
              {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="grow">
              <strong>{s.name}</strong>
              <div className="muted">@{s.user}</div>
            </div>
            <button className="x" title={t("remove")} onClick={() => remove(s)}>✕</button>
          </div>
        ))}
      </div>
      {students.length === 0 && <p className="muted">{t("no_students")}</p>}
    </>
  );
}