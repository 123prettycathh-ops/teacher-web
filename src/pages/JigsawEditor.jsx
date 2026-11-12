import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { CATS } from "../categories";
import { api, asList } from "../api";

const GRID = { 6: [3, 2], 9: [3, 3], 12: [4, 3] }; // [columns, rows]
const DEFAULT_PIECES = [6, 6, 9, 9, 12, 12]; // the game's default per activity number
const piecesOf = (d, a) => d.pieces || DEFAULT_PIECES[a - 1];
const blank = () => ({ name: "", pieces: "", tl: "", en: "", lessonTl: "", lessonEn: "", img: "" });
const EMPTY_LESSON = { img: "", en: "", tl: "" };
// an activity "has its own picture / content" once anything was added to it
const hasOwn = (d) => !!(d.img || d.name || d.tl || d.en || d.lessonTl || d.lessonEn);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function placeholder(label, color) {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'>" +
    "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='" + color + "'/><stop offset='1' stop-color='#ffd23f'/></linearGradient></defs>" +
    "<rect width='600' height='400' fill='url(#g)'/>" +
    "<circle cx='470' cy='120' r='70' fill='rgba(255,255,255,.4)'/>" +
    "<path d='M0 400 L180 220 L300 330 L420 200 L600 400Z' fill='rgba(0,0,0,.25)'/>" +
    "<text x='300' y='70' font-size='30' font-family='Arial' font-weight='bold' fill='white' text-anchor='middle'>" + esc(label.slice(0, 28)) + "</text></svg>";
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/* ---------- jigsaw cut lines (tabs/blanks randomised on every re-cut) ---------- */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// one interior edge of length l starting at (x,y); tab size is based on the cell side m so tabs stay round
function edge(x, y, dx, dy, nx, ny, s, l, m) {
  const a = (u) => (u === 0 ? 0 : u === 1 ? l : l / 2 + (u - 0.5) * m);
  const p = (u, v) => (x + dx * a(u) + nx * v * m * s).toFixed(2) + " " + (y + dy * a(u) + ny * v * m * s).toFixed(2);
  return (
    "M" + p(0, 0) + "L" + p(0.38, 0) +
    "C" + p(0.38, 0.06) + "," + p(0.3, 0.08) + "," + p(0.3, 0.15) +
    "C" + p(0.3, 0.24) + "," + p(0.4, 0.26) + "," + p(0.5, 0.26) +
    "C" + p(0.6, 0.26) + "," + p(0.7, 0.24) + "," + p(0.7, 0.15) +
    "C" + p(0.7, 0.08) + "," + p(0.62, 0.06) + "," + p(0.62, 0) +
    "L" + p(1, 0)
  );
}
// board is (cols*10) x (rows*10) units so every piece is a square cell (like the app)
function cutPath(cols, rows, seed) {
  const r = rng(seed);
  const sign = () => (r() > 0.5 ? 1 : -1);
  const s = 10;
  let d = "";
  for (let c = 1; c < cols; c++) for (let y = 0; y < rows; y++) d += edge(c * s, y * s, 0, 1, 1, 0, sign(), s, s);
  for (let y = 1; y < rows; y++) for (let c = 0; c < cols; c++) d += edge(c * s, y * s, 1, 0, 0, 1, sign(), s, s);
  return d;
}

/* ---------- styles (scoped to .jx) — mirrors the mobile app ---------- */
const CSS = `
.jx{width:100%;min-width:0;flex:1 1 auto;align-self:stretch;display:block;
 --blue:#2d6eb5;--blue-d:#245a97;--ink:#2b2118;--brown:#5a3a1e;--muted:#6f6355;--cream:#f5efdf;--sand:#f4ecd9;--sand-line:#e9dfc5;--line:#ece3cb;--green:#1d8a3f;--red:#c9302c;--purple:#9b4dd6;
 font-family:"Nunito","Baloo 2",system-ui,sans-serif;color:var(--ink);background:var(--cream);min-height:100%}
.jx *{box-sizing:border-box}
.jx h1,.jx h2,.jx h3,.jx .jx-hd{font-family:"Baloo 2","Nunito",system-ui,sans-serif}
.jx button{font:inherit;cursor:pointer}
.jx .jx-wrap{max-width:1000px;margin:0 auto}

/* purple header */
.jx .jx-head{background:var(--purple);color:#fff;border-radius:0 0 32px 32px;padding:16px 18px 26px}
.jx .jx-back{display:flex;align-items:center;justify-content:center;width:40px;height:40px;margin-left:-8px;border:0;border-radius:50%;background:transparent;color:#fff}
.jx .jx-back:hover{background:rgba(255,255,255,.16)}
.jx .jx-head h1{margin:4px 0 8px;font-size:26px;line-height:1.15;font-weight:800}
.jx .jx-head p{margin:0;font-size:16px;line-height:1.55;color:rgba(255,255,255,.95)}
.jx .jx-head .jx-pack{margin-top:8px;font-size:13px;font-weight:700;opacity:.8}

.jx .jx-bodyw{padding:22px 14px 56px}

/* category pills */
.jx .jx-tabs{display:flex;gap:12px;overflow-x:auto;padding:2px 4px 8px;margin:0 -4px 14px;scrollbar-width:thin}
.jx .jx-tab{flex:none;border:2px solid var(--c);color:var(--c);background:transparent;border-radius:999px;padding:11px 26px;font-weight:800;font-size:17px;white-space:nowrap}
.jx .jx-tab.jx-on{background:var(--c);color:#fff}

/* cards */
.jx .jx-card{background:#fff;border:2px solid var(--line);border-radius:30px;padding:18px}

/* levels */
.jx .jx-levels{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
.jx .jx-lvl{grid-column:span 2;text-align:left;background:var(--sand);border:2px solid var(--sand-line);border-radius:18px;padding:14px 16px;color:var(--ink)}
.jx .jx-lvl:nth-child(n+4){grid-column:span 3}
.jx .jx-lvl b{display:block;font-family:"Baloo 2","Nunito",sans-serif;font-size:19px;font-weight:700;line-height:1.2}
.jx .jx-lvl small{display:block;margin-top:4px;color:var(--muted);font-size:13.5px;font-weight:600}
.jx .jx-lvl.jx-on{background:#fff;border-color:var(--blue);color:var(--blue)}
.jx .jx-lvl.jx-on small{color:var(--muted)}

/* activities */
.jx .jx-acts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}
.jx .jx-act{display:flex;align-items:center;gap:12px;text-align:left;background:#fff;border:2px solid var(--line);border-radius:18px;padding:12px;min-width:0;color:var(--ink)}
.jx .jx-act.jx-sel{border-color:var(--blue)}
.jx .jx-act .jx-th{flex:none;width:66px;height:66px;border-radius:12px;background-size:cover;background-position:center;background-color:var(--sand)}
.jx .jx-act .jx-tx{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}
.jx .jx-act .jx-tx b{font-family:"Baloo 2","Nunito",sans-serif;font-size:19px;font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.jx .jx-act .jx-nm{color:var(--muted);font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.jx .jx-act .jx-pc{color:var(--blue);font-size:16px;font-weight:700}

/* detail */
.jx .jx-detail{margin-top:20px;padding-top:20px;border-top:2px solid #f0e8d2}
.jx .jx-detail h2{margin:0 0 18px;font-size:22px;font-weight:700}
.jx .jx-dgrid{display:grid;gap:24px;grid-template-columns:minmax(0,1fr)}
.jx .jx-eyebrow{margin:0 0 10px;font-size:14px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.jx .jx-pic{position:relative;width:100%;max-width:640px;border-radius:20px;overflow:hidden;background-size:cover;background-position:center;background-color:var(--sand);line-height:0}
.jx .jx-pic svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.jx .jx-recut{display:flex;align-items:center;gap:14px;margin:12px 0 0;max-width:640px;color:var(--muted);font-size:13.5px;font-weight:600}
.jx .jx-recut span{flex:1 1 0;min-width:0}
.jx .jx-link{flex:none;white-space:nowrap;border:0;background:transparent;color:var(--blue);font-weight:800;padding:0}
.jx .jx-link.jx-danger{color:var(--red)}
.jx .jx-pbtns{display:flex;flex-wrap:wrap;align-items:center;gap:16px;margin-top:18px}
.jx .jx-btn{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:13px 26px;font-weight:800;font-size:17px;color:#fff;background:var(--blue);white-space:nowrap}
.jx .jx-btn:hover{background:var(--blue-d)}
.jx .jx-btn.jx-gray{background:#9a9aa3}
.jx .jx-btn.jx-gray:hover{background:#85858e}
.jx .jx-chips{display:flex;flex-wrap:wrap;gap:12px}
.jx .jx-chip{border:2px solid var(--blue);background:#fff;color:var(--blue);border-radius:999px;padding:12px 24px;font-weight:800;font-size:17px}
.jx .jx-chip.jx-on{background:var(--blue);color:#fff}
.jx .jx-helper{margin:18px 0 0;color:var(--muted);font-size:16px;line-height:1.6;font-weight:600}
.jx .jx-lab{display:block;margin:0 0 8px;color:var(--brown);font-size:16px;font-weight:800}
.jx .jx-lab.jx-gap{margin-top:20px}
.jx .jx-field{width:100%;border:2px solid var(--sand-line);border-radius:18px;padding:14px 16px;font:inherit;font-size:16px;line-height:1.5;background:#fff;color:var(--ink)}
.jx .jx-field:focus{outline:none;border-color:var(--blue)}
.jx textarea.jx-field{min-height:110px;resize:vertical}
.jx .jx-hint{margin:8px 0 0;color:var(--muted);font-size:13.5px;font-weight:600}
.jx .jx-ok{margin:14px 0 0;color:var(--green);font-weight:800}
.jx .jx-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}

/* category mini-lesson */
.jx .jx-cat{margin-top:20px}
.jx .jx-cat-h{display:flex;align-items:center;gap:12px}
.jx .jx-cat-h i{flex:none;width:15px;height:15px;border-radius:50%;background:var(--c)}
.jx .jx-cat-h h3{margin:0;font-size:21px;font-weight:700}
.jx .jx-cat-sub{margin:14px 0 18px;color:var(--muted);font-size:16px;font-weight:600}
.jx .jx-cgrid{display:grid;gap:24px;grid-template-columns:minmax(0,1fr)}
.jx .jx-cpic{width:100%;aspect-ratio:2.36/1;border-radius:20px;background-size:cover;background-position:center;background-color:var(--sand)}

@media(min-width:700px){
 .jx .jx-head{padding:22px 32px 32px}
 .jx .jx-head h1{font-size:30px}
 .jx .jx-bodyw{padding:28px 32px 64px}
 .jx .jx-card{padding:26px}
 .jx .jx-levels{grid-template-columns:repeat(5,1fr)}
 .jx .jx-lvl,.jx .jx-lvl:nth-child(n+4){grid-column:span 1}
}
@media(min-width:1000px){
 .jx .jx-acts{grid-template-columns:repeat(3,minmax(0,1fr))}
 .jx .jx-dgrid.jx-two{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:36px;align-items:start}
 .jx .jx-cgrid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:36px;align-items:start}
}
`;

/* ---------- the editor page ---------- */
export default function JigsawEditor() {
  const navigate = useNavigate();
  const { packId } = useParams();
  const { packs } = useOutletContext();
  const pack = packs.find((p) => p.id === packId);

  const [catId, setCatId] = useState(CATS[0].id);
  const [levels, setLevels] = useState({});
  const [acts, setActs] = useState({}); // selected activity per category|level
  const [data, setData] = useState({});
  const [lessons, setLessons] = useState({}); // category mini-lesson draft: { img, en, tl }
  const [savedLessons, setSavedLessons] = useState({}); // last saved copy (used by Cancel)
  const [seed, setSeed] = useState(7);
  const [saved, setSaved] = useState("");
  const [lessonSaved, setLessonSaved] = useState(false);
  const [server, setServer] = useState({});       // last copy of each category as the server has it
  const [files, setFiles] = useState({});         // picture files picked but not uploaded yet (per activity)
  const [lessonFiles, setLessonFiles] = useState({}); // same, for the category picture
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const cat = CATS.find((c) => c.id === catId);
  const lvl = levels[catId] ?? 1;
  const actKey = catId + "|" + lvl;
  const act = acts[actKey] ?? 1;

  const lesson = lessons[catId] || EMPTY_LESSON;
  const setLesson = (patch) => { setLessons({ ...lessons, [catId]: { ...lesson, ...patch } }); setLessonSaved(false); };
  const keyOf = (c, l, a) => c + "|" + l + "|" + a;
  const MAX_BYTES = 5 * 1024 * 1024;

  function okImage(f) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setErr("Use a JPG, PNG or WebP picture."); return false; }
    if (f.size > MAX_BYTES) { setErr("That picture is larger than 5 MB. Choose a smaller one."); return false; }
    setErr("");
    return true;
  }
  function pickLessonImage(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !okImage(f)) return;
    setLessonFiles({ ...lessonFiles, [catId]: f });
    setLesson({ img: URL.createObjectURL(f) });
  }

  // Upload to Cloud Storage and get a public https URL the mobile app can open.
  async function uploadImage(file, categoryKey) {
    const signed = await api("/media/upload-url", {
      method: "POST",
      body: { purpose: "category-image", contentType: file.type, categoryKey },
    });
    const res = await fetch(signed.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type, ...(signed.requiredHeaders || {}) },
      body: file,
    });
    if (!res.ok) throw new Error("Picture upload failed (" + res.status + ")");
    return signed.publicUrl;
  }

  // Turn a category from the server into this editor's draft shape.
  const applyCategory = (c) => {
    const byId = new Map((c.jigsaws || []).map((i) => [i.id, i]));
    const next = {};
    for (const [k, id] of Object.entries(c.jigsawSlots || {})) {
      const it = byId.get(id);
      if (!it) continue;
      const [l, a] = k.split("_");
      next[keyOf(c.key, l, a)] = {
        id: it.id, name: it.title || "", img: it.imageUrl || "",
        tl: it.definition_tl || "", en: it.definition_en || "",
        lessonTl: it.context_tl || "", lessonEn: it.context_en || "",
        pieces: (c.jigsawPieces || {})[k] || "",
      };
    }
    const les = { img: c.imageUrl || "", en: c.context_en || "", tl: c.context_tl || "" };
    setServer((x) => ({ ...x, [c.key]: c }));
    setData((x) => ({ ...x, ...next }));
    setLessons((x) => ({ ...x, [c.key]: les }));
    setSavedLessons((x) => ({ ...x, [c.key]: les }));
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api(`/packs/${packId}/categories`)
      .then((d) => { if (alive) asList(d).forEach(applyCategory); })
      .catch((e) => alive && setErr(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId]);

  const slotOf = () => lvl + "_" + act;

  async function saveActivity() {
    const base = server[catId];
    if (!base) return setErr("Still loading. Try again in a moment.");
    if (!cur.img) return setErr("Add a picture for this activity first.");
    setErr(""); setSaved(""); setBusy(true);
    const k = keyOf(catId, lvl, act);
    try {
      const imageUrl = files[k] ? await uploadImage(files[k], catId) : cur.img;
      const id = cur.id || crypto.randomUUID();
      const item = {
        id, title: cur.name.trim(), imageUrl,
        definition_en: cur.en.trim() || null, definition_tl: cur.tl.trim() || null,
        context_en: cur.lessonEn.trim() || null, context_tl: cur.lessonTl.trim() || null,
      };
      const list = base.jigsaws || [];
      const items = list.some((i) => i.id === id) ? list.map((i) => (i.id === id ? item : i)) : [...list, item];
      const slots = { ...(base.jigsawSlots || {}), [slotOf()]: id };
      const pieces = { ...(base.jigsawPieces || {}) };
      if (cur.pieces) pieces[slotOf()] = cur.pieces; else delete pieces[slotOf()];
      const res = await api(`/packs/${packId}/categories/${catId}/jigsaws`, { method: "PUT", body: { items, slots, pieces } });
      applyCategory({ ...base, jigsaws: res.items, jigsawSlots: res.slots, jigsawPieces: res.pieces });
      setFiles((f) => { const n = { ...f }; delete n[k]; return n; });
      setSaved("Saved. Students will see this in the mobile app.");
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function clearActivity() {
    const base = server[catId];
    const k = keyOf(catId, lvl, act);
    const oldId = (base?.jigsawSlots || {})[slotOf()];
    const dropLocal = () => {
      setData((x) => { const n = { ...x }; delete n[k]; return n; });
      setFiles((f) => { const n = { ...f }; delete n[k]; return n; });
    };
    if (!oldId) { dropLocal(); setSaved(""); return; } // never saved: just clear the draft
    if (!window.confirm("Remove this activity's picture and mini-lesson? It will play the category picture instead.")) return;
    setErr(""); setSaved(""); setBusy(true);
    try {
      const slots = { ...base.jigsawSlots }; delete slots[slotOf()];
      const pieces = { ...(base.jigsawPieces || {}) }; delete pieces[slotOf()];
      const items = Object.values(slots).includes(oldId) ? base.jigsaws : base.jigsaws.filter((i) => i.id !== oldId);
      const res = await api(`/packs/${packId}/categories/${catId}/jigsaws`, { method: "PUT", body: { items, slots, pieces } });
      dropLocal();
      applyCategory({ ...base, jigsaws: res.items, jigsawSlots: res.slots, jigsawPieces: res.pieces });
      setSaved("Removed. Students will see the category picture in the mobile app.");
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function saveLesson() {
    const base = server[catId];
    setErr(""); setBusy(true);
    try {
      const img = lessonFiles[catId] ? await uploadImage(lessonFiles[catId], catId) : lesson.img;
      await api(`/packs/${packId}/categories/${catId}`, {
        method: "PUT",
        body: { imageUrl: img || null, context_en: lesson.en.trim() || null, context_tl: lesson.tl.trim() || null },
      });
      const les = { img, en: lesson.en, tl: lesson.tl };
      setLessons({ ...lessons, [catId]: les });
      setSavedLessons({ ...savedLessons, [catId]: les });
      setLessonFiles((f) => { const n = { ...f }; delete n[catId]; return n; });
      if (base) setServer({ ...server, [catId]: { ...base, imageUrl: img || null, context_en: les.en || null, context_tl: les.tl || null } });
      setLessonSaved(true);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  const get = (c, l, a) => {
    const k = keyOf(c, l, a);
    if (data[k]) return data[k];
    return blank();
  };
  const readyIn = (c, l) => [1, 2, 3, 4, 5, 6].filter((a) => hasOwn(get(c, l, a))).length;
  const catImg = lesson.img || placeholder(cat.name, cat.color);
  const imgOf = (d) => d.img || catImg; // no picture of its own → plays the category picture

  const cur = get(catId, lvl, act);
  const own = hasOwn(cur);
  const update = (patch) => {
    setData({ ...data, [keyOf(catId, lvl, act)]: { ...cur, ...patch } });
    setSaved("");
  };
  function pickImage(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !okImage(f)) return;
    setFiles({ ...files, [keyOf(catId, lvl, act)]: f });
    update({ img: URL.createObjectURL(f) });
  }

  const [cols, rows] = GRID[piecesOf(cur, act)] || GRID[6];
  const path = useMemo(() => cutPath(cols, rows, seed), [cols, rows, seed]);
  const img = imgOf(cur);
  const recut = () => setSeed(Math.floor(Math.random() * 1e6));

  return (
    <div className="jx">
      <style>{CSS}</style>

      {/* purple header */}
      <div className="jx-head">
        <div className="jx-wrap">
          <button className="jx-back" aria-label="Back" onClick={() => navigate(-1)}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <h1 className="jx-hd">Jigsaw Pictures &amp; Mini-Lessons</h1>
          <p>Choose the picture, the pieces and the mini-lesson for every jigsaw activity</p>
          {pack && <p className="jx-pack">Editing “{pack.name}”</p>}
        </div>
      </div>

      <div className="jx-bodyw">
        <div className="jx-wrap">
          {loading && <p className="jx-hint">Loading your jigsaw content...</p>}
          {err && <p style={{ color: "#c0392b", fontWeight: 700 }}>{err}</p>}

          {/* category pills */}
          <div className="jx-tabs">
            {CATS.map((c) => (
              <button
                key={c.id}
                className={"jx-tab" + (c.id === catId ? " jx-on" : "")}
                style={{ "--c": c.color }}
                onClick={() => { setCatId(c.id); setSaved(""); setErr(""); setLessonSaved(false); }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* levels + activities + detail */}
          <div className="jx-card">
            <div className="jx-levels">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={"jx-lvl" + (n === lvl ? " jx-on" : "")}
                  onClick={() => { setLevels({ ...levels, [catId]: n }); setSaved(""); }}
                >
                  <b>Level {n}</b>
                  <small>{readyIn(catId, n)}/6 with a picture</small>
                </button>
              ))}
            </div>

            <div className="jx-acts">
              {[1, 2, 3, 4, 5, 6].map((a) => {
                const d = get(catId, lvl, a);
                const nm = d.name ? d.name : d.img ? "Own picture" : "Uses the category picture";
                return (
                  <button
                    key={a}
                    className={"jx-act" + (act === a ? " jx-sel" : "")}
                    onClick={() => { setActs({ ...acts, [actKey]: a }); setSaved(""); }}
                  >
                    <span className="jx-th" style={{ backgroundImage: 'url("' + imgOf(d) + '")' }} />
                    <span className="jx-tx">
                      <b>Activity {a}</b>
                      <span className="jx-nm">{nm}</span>
                      <span className="jx-pc">{piecesOf(d, a)} pcs</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* selected activity */}
            <div className="jx-detail">
              <h2 className="jx-hd">Level {lvl} · Activity {act}</h2>

              <div className={"jx-dgrid" + (own ? " jx-two" : "")}>
                <div>
                  <p className="jx-eyebrow">What students play</p>
                  <div className="jx-pic" style={{ aspectRatio: cols + " / " + rows, backgroundImage: 'url("' + img + '")' }}>
                    <svg viewBox={"0 0 " + cols * 10 + " " + rows * 10} preserveAspectRatio="none">
                      <path d={path} fill="none" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="jx-recut">
                    <button className="jx-link" onClick={recut}>↻ Re-cut</button>
                    <span>{rows} × {cols} grid — tabs and blanks are randomised on every attempt, exactly as in the game.</span>
                  </div>

                  <div className="jx-pbtns">
                    <label className="jx-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="1.8" /><path d="M21 15l-5-5L5 21" /></svg>
                      {cur.img ? "Change picture" : "Add a picture"}
                      <input type="file" accept="image/*" hidden onChange={pickImage} />
                    </label>
                    {cur.img && <button className="jx-link jx-danger" onClick={() => update({ img: "" })}>Remove picture</button>}
                  </div>

                  <p className="jx-eyebrow" style={{ marginTop: 26 }}>Pieces</p>
                  <div className="jx-chips">
                    <button className={"jx-chip" + (!cur.pieces ? " jx-on" : "")} onClick={() => update({ pieces: "" })}>Default ({DEFAULT_PIECES[act - 1]})</button>
                    {[6, 9, 12].map((n) => (
                      <button key={n} className={"jx-chip" + (cur.pieces === n ? " jx-on" : "")} onClick={() => update({ pieces: n })}>{n} pcs</button>
                    ))}
                  </div>

                  {!own && (
                    <p className="jx-helper">Add a picture to give this activity its own name and mini-lesson. Until then it plays the category picture.</p>
                  )}
                </div>

                {own && (
                  <div>
                    <label className="jx-lab">Name</label>
                    <input className="jx-field" value={cur.name} onChange={(e) => update({ name: e.target.value })} />
                    <p className="jx-hint">Shown as the caption when the puzzle is completed.</p>

                    <label className="jx-lab jx-gap">Definition — Tagalog</label>
                    <input className="jx-field" value={cur.tl} onChange={(e) => update({ tl: e.target.value })} />
                    <label className="jx-lab jx-gap">Definition — English</label>
                    <input className="jx-field" value={cur.en} onChange={(e) => update({ en: e.target.value })} />
                    <label className="jx-lab jx-gap">Mini-lesson — English</label>
                    <textarea className="jx-field" placeholder="Type the mini-lesson..." value={cur.lessonEn} onChange={(e) => update({ lessonEn: e.target.value })} />
                    <label className="jx-lab jx-gap">Mini-lesson — Tagalog</label>
                    <textarea className="jx-field" placeholder="Type the mini-lesson..." value={cur.lessonTl} onChange={(e) => update({ lessonTl: e.target.value })} />

                    <div className="jx-actions">
                      <button className="jx-btn" disabled={busy} onClick={saveActivity}>{busy ? "Saving..." : "Save"}</button>
                      <button className="jx-btn jx-gray" disabled={busy} onClick={clearActivity}>Clear</button>
                    </div>
                    {saved && <p className="jx-ok">{saved}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* category picture and mini-lesson */}
          <div className="jx-card jx-cat">
            <div className="jx-cat-h" style={{ "--c": cat.color }}>
              <i />
              <h3 className="jx-hd">Category picture and mini-lesson</h3>
            </div>
            <p className="jx-cat-sub">Plays in every activity without a picture of its own.</p>

            <div className="jx-cgrid">
              <div>
                <div className="jx-cpic" style={{ backgroundImage: 'url("' + catImg + '")' }} />
                <div className="jx-pbtns" style={{ marginTop: 14 }}>
                  <label className="jx-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="1.8" /><path d="M21 15l-5-5L5 21" /></svg>
                    Change Picture
                    <input type="file" accept="image/*" hidden onChange={pickLessonImage} />
                  </label>
                  {lesson.img && <button className="jx-link" onClick={() => setLesson({ img: "" })}>Use the built-in image</button>}
                </div>
              </div>

              <div>
                <label className="jx-lab">English</label>
                <textarea className="jx-field" placeholder="Type the mini-lesson..." value={lesson.en} onChange={(e) => setLesson({ en: e.target.value })} />
                <label className="jx-lab jx-gap">Tagalog</label>
                <textarea className="jx-field" placeholder="Type the mini-lesson..." value={lesson.tl} onChange={(e) => setLesson({ tl: e.target.value })} />

                <div className="jx-actions">
                  <button className="jx-btn" disabled={busy} onClick={saveLesson}>{busy ? "Saving..." : "Save"}</button>
                  <button
                    className="jx-btn jx-gray"
                    onClick={() => { setLessons({ ...lessons, [catId]: savedLessons[catId] || EMPTY_LESSON }); setLessonFiles((f) => { const n = { ...f }; delete n[catId]; return n; }); setLessonSaved(false); }}
                  >
                    Cancel
                  </button>
                </div>
                {lessonSaved && <p className="jx-ok">Saved. Students will see this in the mobile app.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}