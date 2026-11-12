import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { api, toUiPack } from "../api";

/* ---------- styles (scoped to .cc) — mirrors the mobile "Class Content" screens ---------- */
const CSS = `
.cc{width:100%;min-width:0;flex:1 1 auto;align-self:stretch;display:block;
 --navy:#0a3aa5;--ink:#2b2118;--brown:#a58b62;--muted:#6f6355;--cream:#f8f5ea;--sand:#f3ecdc;--line:#eadfc8;--purple:#9b4dd6;
 font-family:"Nunito","Baloo 2",system-ui,sans-serif;color:var(--ink);background:var(--cream);min-height:100%}
.cc *{box-sizing:border-box}
.cc h1,.cc h2,.cc h3,.cc .cc-hd{font-family:"Baloo 2","Nunito",system-ui,sans-serif}
.cc button{font:inherit;cursor:pointer}
.cc .cc-wrap{max-width:1000px;margin:0 auto}

/* blue header */
.cc .cc-head{position:relative;overflow:hidden;background:var(--navy);color:#fff;border-radius:0 0 34px 34px;padding:18px 18px 26px}
.cc .cc-rays{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.cc .cc-rays polygon{fill:rgba(255,255,255,.13)}
.cc .cc-head .cc-wrap{position:relative;display:flex;align-items:center;gap:18px}
.cc .cc-back{flex:none;display:flex;align-items:center;justify-content:center;width:50px;height:50px;border:0;border-radius:16px;background:rgba(255,255,255,.18);color:#fff}
.cc .cc-back:hover{background:rgba(255,255,255,.28)}
.cc .cc-head h1{margin:0;font-size:28px;line-height:1.15;font-weight:800}

.cc .cc-bodyw{padding:24px 14px 64px}

/* cards */
.cc .cc-card{background:#fff;border:2px solid var(--line);border-radius:30px;padding:24px;box-shadow:0 4px 12px rgba(120,100,50,.1)}
.cc .cc-ico{flex:none;display:flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:22px;background:var(--purple);color:#fff}
.cc .cc-ico.cc-sand{background:var(--sand);color:#a58b62}

/* 3D buttons */
.cc .cc-btn{display:flex;align-items:center;justify-content:center;width:100%;border:0;border-radius:26px;padding:16px 22px;font-family:"Baloo 2","Nunito",sans-serif;font-weight:700;font-size:19px;line-height:1.2;color:#fff;background:var(--b);box-shadow:0 5px 0 var(--d);transition:transform .08s,box-shadow .08s}
.cc .cc-btn:active:not(:disabled){transform:translateY(3px);box-shadow:0 2px 0 var(--d)}
.cc .cc-btn:disabled{opacity:.5;cursor:not-allowed}
.cc .cc-btn.blue{--b:#0a3aa5;--d:#00237a}
.cc .cc-btn.lblue{--b:#3a7bd5;--d:#0a3aa5}
.cc .cc-btn.green{--b:#2ea35a;--d:#1d6d33}
.cc .cc-btn.red{--b:#c22d49;--d:#8c1d33}

/* no pack */
.cc .cc-empty{text-align:center}
.cc .cc-empty .cc-ico{margin:0 auto 20px;width:92px;height:92px;border-radius:28px}
.cc .cc-empty p{margin:0 0 22px;font-size:18px;font-weight:600;color:var(--ink)}

/* pack assigned */
.cc .cc-top{display:flex;align-items:center;gap:16px}
.cc .cc-info{min-width:0;flex:1}
.cc .cc-info h3{margin:0;font-size:23px;font-weight:800;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cc .cc-meta{display:flex;align-items:center;gap:14px;margin-top:8px;flex-wrap:wrap}
.cc .cc-badge{display:inline-block;border-radius:999px;padding:6px 16px;font-size:14.5px;font-weight:700;background:var(--sand);color:#6f6355}
.cc .cc-ver{color:var(--muted);font-size:15px;font-weight:600}
.cc .cc-hr{height:2px;margin:20px 0;background:#f0e8d2;border:0}
.cc .cc-desc{margin:0 0 20px;color:var(--ink);font-size:17px;line-height:1.6;font-weight:600}
.cc .cc-two{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding-bottom:5px}

/* content management */
.cc .cc-label{margin:30px 4px 16px;font-size:15px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--brown)}
.cc .cc-row{display:flex;align-items:center;gap:18px;width:100%;text-align:left;padding:16px 22px;border:2px solid var(--line);border-radius:999px;background:#fff;box-shadow:0 4px 12px rgba(120,100,50,.1);color:var(--ink)}
.cc .cc-row:hover{border-color:#d9c9a3}
.cc .cc-row .cc-ico{width:56px;height:56px;border-radius:18px}
.cc .cc-row b{flex:1;font-size:20px;font-weight:700;font-family:"Nunito",system-ui,sans-serif}
.cc .cc-row svg.cc-chev{flex:none;color:#8a7757}

/* "Open Activity Management" bottom sheet */
.cc .cc-overlay{position:fixed;inset:0;z-index:70;background:rgba(20,20,20,.55);display:flex;align-items:flex-end;justify-content:center}
.cc .cc-sheet{width:100%;max-width:640px;max-height:92vh;display:flex;flex-direction:column;background:#f9f6ea;border-radius:34px 34px 0 0;padding:26px 22px 18px}
.cc .cc-sheet h2{margin:0 0 18px;font-size:25px;font-weight:800;color:var(--navy)}
.cc .cc-plist{display:flex;flex-direction:column;gap:14px;overflow-y:auto;min-height:0;padding:3px 3px 6px;margin:0 -3px}
.cc .cc-pitem{display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;text-align:left;background:#fff;border:2px solid var(--line);border-radius:26px;padding:16px 20px;color:var(--ink)}
.cc .cc-pitem span.n{min-width:0;font-size:19px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cc .cc-pitem span.s{flex:none;font-size:16.5px;font-weight:600;color:#8a7757}
.cc .cc-pitem.cc-sel{border:3px solid var(--navy);background:var(--sand);padding:15px 19px}
.cc .cc-sheet .cc-err{margin:12px 0 0;padding:10px 14px;border-radius:14px;background:#fdeaec;color:#b3253e;font-weight:700}
.cc .cc-snone{margin:6px 4px 10px;color:var(--muted);font-size:17px;font-weight:600}
.cc .cc-sact{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px;padding-bottom:5px}
.cc .cc-cancel{display:block;margin:8px auto 0;border:0;background:transparent;color:#8a7757;font-size:19px;font-weight:700;padding:10px 24px}

@media(min-width:700px){
 .cc .cc-head{padding:22px 32px 32px}
 .cc .cc-bodyw{padding:28px 32px 72px}
 .cc .cc-overlay{align-items:center;padding:20px}
 .cc .cc-sheet{border-radius:34px;max-height:86vh}
}
`;

const BookIcon = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
    <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" />
  </svg>
);
const BookmarkIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h12v18l-6-4.5L6 21z" />
  </svg>
);
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

export default function ClassContent() {
  const go = useNavigate();
  // packs / setPacks / activePackId come from the same outlet context your Activity Management page uses.
  // setActivePackId is the one thing I could not verify — if it does not exist the page still works
  // on screen (kept in local state) but the choice is not saved. See the note in the reply.
  const { packs = [], setPacks, activePackId, setActivePackId, klass } = useOutletContext();
  const hasSetter = typeof setActivePackId === "function";

  const [localId, setLocalId] = useState(null);
  const [how, setHow] = useState(""); // "copy" | "share" — decides the badge text
  const [sheet, setSheet] = useState(false);
  const [sel, setSel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const currentId = hasSetter ? activePackId : localId;
  const pack = packs.find((p) => p.id === currentId);

  const assign = (id) => (hasSetter ? setActivePackId(id) : setLocalId(id));

  // Saves the choice on the server so the mobile app (students) sees the same pack.
  const saveToClass = async (packId) => {
    if (!klass?.id) throw new Error("You need a class first. Create one in Class Overview.");
    if (packId) await api(`/classes/${klass.id}/pack`, { method: "PUT", body: { packId, mode: "link" } });
    else await api(`/classes/${klass.id}/pack`, { method: "DELETE" });
  };
  const openSheet = () => { setSel(currentId || null); setErr(""); setSheet(true); };
  const closeSheet = () => { setSheet(false); setErr(""); };
  const openAM = () => go("/dashboard/activity-management");

  const share = async () => {
    if (!sel) return;
    setErr("");
    setBusy(true);
    try {
      await saveToClass(sel);
      assign(sel);
      setHow("share");
      closeSheet();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };
  const makeCopy = async () => {
    if (!sel) return;
    setErr("");
    setBusy(true);
    try {
      const created = await api(`/packs/${sel}/duplicate`, { method: "POST" });
      const ui = toUiPack(created);
      await saveToClass(ui.id);
      if (typeof setPacks === "function") setPacks([ui, ...packs]);
      assign(ui.id);
      setHow("copy");
      closeSheet();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };
  const clearPack = async () => {
    setErr("");
    try {
      await saveToClass(null);
      assign(null);
      setHow("");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="cc">
      <style>{CSS}</style>

      {/* blue header */}
      <div className="cc-head">
        <svg className="cc-rays" viewBox="0 0 400 100" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
          <polygon points="196,0 204,0 208,100 192,100" />
          <polygon points="150,0 166,0 112,100 70,100" />
          <polygon points="234,0 250,0 330,100 288,100" />
        </svg>
        <div className="cc-wrap">
          <button className="cc-back" aria-label="Back" onClick={() => go(-1)}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <h1 className="cc-hd">Class Content</h1>
        </div>
      </div>

      <div className="cc-bodyw">
        <div className="cc-wrap">
          {pack ? (
            /* a pack is assigned */
            <div className="cc-card">
              <div className="cc-top">
                <div className="cc-ico"><BookIcon /></div>
                <div className="cc-info">
                  <h3 className="cc-hd" title={pack.name}>{pack.name}</h3>
                  <div className="cc-meta">
                    <span className="cc-badge">{how === "copy" ? "Your own copy" : cap(pack.status)}</span>
                    <span className="cc-ver">{pack.version}</span>
                  </div>
                </div>
              </div>
              <hr className="cc-hr" />
              <p className="cc-desc">Students play quizzes and jigsaw puzzles from this pack instead of the starter set.</p>
              <div className="cc-two">
                <button className="cc-btn blue" onClick={openSheet}>Change Pack</button>
                <button className="cc-btn red" onClick={clearPack}>Clear</button>
              </div>
            </div>
          ) : (
            /* no pack assigned */
            <div className="cc-card cc-empty">
              <div className="cc-ico cc-sand"><BookIcon size={42} /></div>
              <p>No pack assigned — playing the starter set</p>
              <div style={{ paddingBottom: 5 }}>
                <button className="cc-btn blue" onClick={openSheet}>Open Activity Management</button>
              </div>
            </div>
          )}

          <div className="cc-label">Content management</div>
          <button className="cc-row" onClick={openAM}>
            <span className="cc-ico"><BookmarkIcon /></span>
            <b>Activity Management</b>
            <svg className="cc-chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* choose a pack: Share it / Make a copy */}
      {sheet && (
        <div className="cc-overlay" onClick={closeSheet}>
          <div className="cc-sheet" onClick={(e) => e.stopPropagation()}>
            <h2 className="cc-hd">Open Activity Management</h2>

            <div className="cc-plist">
              {packs.length === 0 && <p className="cc-snone">No packs yet. Create one in Activity Management first.</p>}
              {packs.map((p) => (
                <button key={p.id} className={"cc-pitem" + (sel === p.id ? " cc-sel" : "")} onClick={() => setSel(p.id)}>
                  <span className="n" title={p.name}>{p.name}</span>
                  <span className="s">{p.status}</span>
                </button>
              ))}
            </div>

            {err && <div className="cc-err">{err}</div>}

            <div className="cc-sact">
              <button className="cc-btn green" disabled={!sel || busy} onClick={share}>Share it</button>
              <button className="cc-btn lblue" disabled={!sel || busy} onClick={makeCopy}>Make a copy</button>
            </div>
            <button className="cc-cancel" onClick={closeSheet}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}