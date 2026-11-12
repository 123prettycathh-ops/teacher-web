import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import PackStatusCard from "../components/PackStatusCard";
import { useLang } from "../i18n";

/* ---------- styles (scoped to .hx) — mirrors the mobile Home screen ---------- */
const CSS = `
.hx{width:100%;min-width:0;flex:1 1 auto;align-self:stretch;display:block;
 --navy:#0a3aa5;--ink:#2b2118;--brown:#a58b62;--cream:#f8f5ea;--line:#eadfc8;
 font-family:"Nunito","Baloo 2",system-ui,sans-serif;color:var(--ink);background:var(--cream);min-height:100%}
.hx *{box-sizing:border-box}
.hx h1{font-family:"Baloo 2","Nunito",system-ui,sans-serif}
.hx .hx-wrap{max-width:1000px;margin:0 auto}

/* blue hero */
.hx .hx-head{position:relative;overflow:hidden;background:var(--navy);color:#fff;border-radius:0 0 34px 34px;padding:26px 18px 30px}
.hx .hx-rays{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.hx .hx-rays polygon{fill:rgba(255,255,255,.13)}
.hx .hx-head .hx-wrap{position:relative}
.hx .hx-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.hx .hx-top h1{margin:6px 0 6px;font-size:32px;line-height:1.15;font-weight:800;overflow-wrap:anywhere}
.hx .hx-top p{margin:0;font-size:18px;color:rgba(255,255,255,.92);font-weight:600}
.hx .hx-photo{flex:none;display:flex;align-items:center;justify-content:center;width:104px;height:104px;border-radius:50%;border:4px solid #fff;background:#2a5cc4;color:#fff;font-family:"Baloo 2","Nunito",sans-serif;font-size:38px;font-weight:800;overflow:hidden}
.hx .hx-photo img{width:100%;height:100%;object-fit:cover;display:block}
.hx .hx-pills{display:flex;flex-wrap:wrap;gap:14px;margin-top:22px}
.hx .hx-pill{display:inline-flex;align-items:center;gap:10px;padding:11px 22px;border:2px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(255,255,255,.08);font-size:17px;font-weight:700;white-space:nowrap}

.hx .hx-bodyw{padding:26px 14px 64px}
.hx .hx-label{margin:0 4px 18px;font-size:15px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--brown)}
.hx .hx-list{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}
.hx .hx-full{grid-column:1/-1}

/* menu cards */
.hx .hx-card{display:flex;align-items:center;gap:18px;padding:18px 22px;border:2px solid var(--line);border-radius:30px;background:#fff;box-shadow:0 4px 12px rgba(120,100,50,.1);color:var(--ink);text-decoration:none}
.hx .hx-card:hover{border-color:#d9c9a3}
.hx .hx-ico{flex:none;display:flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:20px;color:#fff}
.hx .hx-ico.orange{background:#e8821a}
.hx .hx-ico.blue{background:#3a7bd5}
.hx .hx-ico.purple{background:#9b4dd6}
.hx .hx-card b{flex:1;font-size:21px;font-weight:600;font-family:"Nunito",system-ui,sans-serif}
.hx .hx-chev{flex:none;color:#8a7757}

@media(min-width:700px){
 .hx .hx-head{padding:32px 32px 36px}
 .hx .hx-bodyw{padding:30px 32px 72px}
 .hx .hx-list{grid-template-columns:repeat(2,minmax(0,1fr))}
}
`;

const initials = (n) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const BookIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
    <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" />
  </svg>
);
const GridIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </svg>
);
const BookmarkIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h12v18l-6-4.5L6 21z" />
  </svg>
);

function Photo({ profile, name }) {
  const [bad, setBad] = useState(false);
  if (profile.photoUrl && !bad) {
    return <div className="hx-photo"><img src={profile.photoUrl} alt="" onError={() => setBad(true)} /></div>;
  }
  const av = profile.avatar;
  const emoji = av && [...av].length <= 2 ? av : null;
  return <div className="hx-photo">{emoji ?? initials(name)}</div>;
}

export default function Home() {
  const { t } = useLang();
  const { me, klass, students } = useOutletContext();
  const profile = me?.user ?? me ?? {};
  const name = profile.name || t("teacher_word");
  const grade = klass?.gradeLevel ? klass.gradeLevel + (klass.section ? "-" + klass.section : "") : "-";

  const items = [
    ["class-overview", <GridIcon size={30} />, "orange", t("nav_overview")],
    ["class-content", <BookIcon size={30} />, "blue", t("nav_content")],
    ["activity-management", <BookmarkIcon size={30} />, "purple", t("nav_activity")],
  ];

  return (
    <div className="hx">
      <style>{CSS}</style>

      {/* blue hero */}
      <div className="hx-head">
        <svg className="hx-rays" viewBox="0 0 400 100" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
          <polygon points="196,0 204,0 208,100 192,100" />
          <polygon points="150,0 166,0 112,100 70,100" />
          <polygon points="234,0 250,0 330,100 288,100" />
        </svg>
        <div className="hx-wrap">
          <div className="hx-top">
            <div style={{ minWidth: 0 }}>
              <h1>{name}</h1>
              <p>{t("teacher_account")}</p>
            </div>
            <Photo profile={profile} name={name} />
          </div>
          <div className="hx-pills">
            <span className="hx-pill"><BookIcon size={22} /> {t("grade_pill", { g: grade })}</span>
            <span className="hx-pill"><GridIcon size={22} /> {t("total", { n: students.length })}</span>
          </div>
        </div>
      </div>

      <div className="hx-bodyw">
        <div className="hx-wrap">
          <div className="hx-label">{t("nav_activity")}</div>
          <div className="hx-list">
            {/* shows "No pack assigned" or the pack chosen in Class Content */}
            <div className="hx-full"><PackStatusCard /></div>

            {items.map(([to, icon, color, label]) => (
              <Link key={to} to={"/dashboard/" + to} className="hx-card">
                <span className={"hx-ico " + color}>{icon}</span>
                <b>{label}</b>
                <svg className="hx-chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}