import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useLang } from "../i18n";
import { api, toUiPack } from "../api";

/* ---------- styles (scoped to .am) — mirrors the mobile Activity Management screen ---------- */
const CSS = `
.am{width:100%;min-width:0;flex:1 1 auto;align-self:stretch;display:block;
 --blue:#3a7bd5;--ink:#2b2118;--muted:#7a6e60;--cream:#f5efdf;--line:#ece3cb;--field:#e6dcc0;--purple:#9b4dd6;
 font-family:"Nunito","Baloo 2",system-ui,sans-serif;color:var(--ink);background:var(--cream);min-height:100%}
.am *{box-sizing:border-box}
.am h1,.am h2,.am h3,.am .am-hd{font-family:"Baloo 2","Nunito",system-ui,sans-serif}
.am button{font:inherit;cursor:pointer}
.am .am-wrap{max-width:1000px;margin:0 auto}

/* blue header */
.am .am-head{background:var(--blue);color:#fff;border-radius:0 0 34px 34px;padding:16px 18px 28px}
.am .am-back{display:flex;align-items:center;justify-content:center;width:40px;height:40px;margin-left:-8px;border:0;border-radius:50%;background:transparent;color:#fff}
.am .am-back:hover{background:rgba(255,255,255,.18)}
.am .am-head h1{margin:6px 0 8px;font-size:30px;line-height:1.15;font-weight:800}
.am .am-head p{margin:0;font-size:17px;line-height:1.5;color:rgba(255,255,255,.95)}

.am .am-bodyw{padding:22px 14px 64px}

/* new pack (dashed) */
.am .am-new{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;padding:14px 20px;border:2px dashed var(--blue);border-radius:26px;background:transparent;color:var(--blue);font-size:20px;font-weight:600}
.am .am-new:hover{background:rgba(58,123,213,.07)}
.am .am-new:disabled{opacity:.55;cursor:not-allowed}
.am .am-err{margin:14px 0 0;padding:12px 16px;border-radius:16px;background:#fdeaec;color:#b3253e;font-weight:700}

/* cards */
.am .am-card{background:#fff;border:2px solid var(--line);border-radius:30px;padding:22px;min-width:0}
.am .am-card.am-use{border-color:var(--blue)}
.am .am-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:18px;margin-top:20px}

/* new pack form card */
.am .am-form h3{margin:0 0 14px;font-size:22px;font-weight:800}
.am .am-field{width:100%;border:2px solid var(--field);border-radius:22px;padding:14px 18px;font:inherit;font-size:18px;background:#fff;color:var(--ink)}
.am .am-field:focus{outline:none;border-color:var(--blue)}
.am .am-form .am-err{margin-top:12px}
.am .am-frow{display:flex;gap:12px;margin-top:14px}

/* pill buttons */
.am .am-btn{border:0;border-radius:999px;padding:13px 24px;font-weight:700;font-size:17px;line-height:1.2;color:#fff;background:var(--b);white-space:nowrap}
.am .am-btn:hover:not(:disabled){filter:brightness(.94)}
.am .am-btn:disabled{opacity:.45;cursor:not-allowed}
.am .am-btn.blue{--b:#3a7bd5}
.am .am-btn.purple{--b:#9b4dd6}
.am .am-btn.gray{--b:#8e8e96}
.am .am-btn.green{--b:#2ea35a}
.am .am-btn.red{--b:#c22d49}
.am .am-btn.outline{background:transparent;border:2px solid #c22d49;color:#c22d49;padding:11px 22px}

/* pack card content */
.am .am-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
.am .am-row h3{margin:0;font-size:23px;font-weight:800;line-height:1.3;min-width:0;overflow-wrap:anywhere}
.am .am-badge{flex:none;border-radius:999px;padding:7px 20px;font-size:16px;font-weight:700;color:#fff;background:#b0b0b0}
.am .am-badge.published{background:#2ea35a}
.am .am-badge.archived{background:#8e8e96}
.am .am-meta{margin:14px 0 18px;color:var(--muted);font-size:18px;font-weight:600}
.am .am-actions{display:flex;flex-wrap:wrap;gap:12px}
.am .am-empty{margin:24px 4px 0;color:var(--muted);font-size:17px;font-weight:600;text-align:center}

@media(min-width:700px){
 .am .am-head{padding:22px 32px 34px}
 .am .am-bodyw{padding:28px 32px 72px}
 .am .am-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
`;

export default function ActivityManagement() {
  const { t } = useLang();
  const { packs, setPacks, activePackId } = useOutletContext();
  const go = useNavigate();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  async function run(fn) {
    setErr("");
    setBusy(true);
    try { await fn(); } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  const replace = (updated) => setPacks(packs.map((p) => (p.id === updated.id ? toUiPack(updated) : p)));

  const openCreate = () => { setNewName(""); setErr(""); setCreating(true); };
  const closeCreate = () => { setCreating(false); setNewName(""); };

  const create = () => run(async () => {
    const name = newName.trim();
    if (!name) throw new Error("Please type a pack name");
    const created = await api("/packs", { method: "POST", body: { name } });
    setPacks([toUiPack(created), ...packs]);
    closeCreate();
  });
  const copy = (p) => run(async () => {
    const created = await api(`/packs/${p.id}/duplicate`, { method: "POST" });
    setPacks([toUiPack(created), ...packs]);
  });
  const publish = (p) => run(async () => replace(await api(`/packs/${p.id}/publish`, { method: "POST" })));
  const archive = (p) => run(async () => replace(await api(`/packs/${p.id}/archive`, { method: "POST" })));
  const remove = (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    run(async () => {
      await api(`/packs/${p.id}`, { method: "DELETE" });
      setPacks(packs.filter((x) => x.id !== p.id));
    });
  };

  return (
    <div className="am">
      <style>{CSS}</style>

      {/* blue header */}
      <div className="am-head">
        <div className="am-wrap">
          <button className="am-back" aria-label="Back" onClick={() => go(-1)}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <h1 className="am-hd">{t("am_title")}</h1>
          <p>{t("am_sub")}</p>
        </div>
      </div>

      <div className="am-bodyw">
        <div className="am-wrap">
          {/* New Pack: dashed button → inline form card */}
          {creating ? (
            <div className="am-card am-form">
              <h3 className="am-hd">New Pack</h3>
              <input
                className="am-field"
                autoFocus
                placeholder="Pack name..."
                maxLength={80}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") create(); }}
              />
              {err && <div className="am-err">{err}</div>}
              <div className="am-frow">
                <button className="am-btn blue" disabled={busy || !newName.trim()} onClick={create}>Create</button>
                <button className="am-btn gray" onClick={closeCreate}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="am-new" disabled={busy} onClick={openCreate}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="M12 7.5v9M7.5 12h9" />
              </svg>
              {t("new_pack")}
            </button>
          )}
          {err && !creating && <div className="am-err">{err}</div>}

          {/* packs */}
          <div className="am-grid">
            {packs.map((p) => (
              <div className={"am-card" + (p.id === activePackId ? " am-use" : "")} key={p.id}>
                <div className="am-row">
                  <h3 className="am-hd">{p.name}</h3>
                  <span className={"am-badge " + p.status}>{t("st_" + p.status)}</span>
                </div>
                <p className="am-meta">{p.version} · {p.id === activePackId ? t("in_use") : t("not_in_use")}</p>
                <div className="am-actions">
                  <button className="am-btn blue" onClick={() => go("/dashboard/activity-management/" + p.id + "/quiz")}>{t("edit_quiz")}</button>
                  <button className="am-btn purple" onClick={() => go("/dashboard/activity-management/" + p.id + "/jigsaw")}>{t("edit_jigsaw")}</button>
                  <button className="am-btn gray" disabled={busy} onClick={() => copy(p)}>{t("copy")}</button>
                  {p.status === "draft" && <button className="am-btn green" disabled={busy} onClick={() => publish(p)}>{t("publish")}</button>}
                  {p.status !== "archived" && <button className="am-btn red" disabled={busy} onClick={() => archive(p)}>{t("archive")}</button>}
                  <button className="am-btn outline" disabled={busy} onClick={() => remove(p)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          {packs.length === 0 && <p className="am-empty">No packs yet. Press the new pack button above.</p>}
        </div>
      </div>
    </div>
  );
}