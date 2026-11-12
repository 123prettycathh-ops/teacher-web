import { useNavigate, useOutletContext } from "react-router-dom";

/* Home-screen card: shows "No pack assigned" or the pack chosen in Class Content.
   Tapping it opens Class Content. Reads the same Dashboard context as the other pages. */
const CSS = `
.psc{display:flex;align-items:center;gap:18px;width:100%;text-align:left;padding:20px 22px;border:2px solid #eadfc8;border-radius:30px;background:#fff;box-shadow:0 4px 12px rgba(120,100,50,.1);color:#2b2118;cursor:pointer;font:inherit;font-family:"Nunito","Baloo 2",system-ui,sans-serif}
.psc:hover{border-color:#d9c9a3}
.psc .psc-ico{flex:none;display:flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:20px;background:#f3ecdc;color:#a58b62}
.psc.psc-has .psc-ico{background:#9b4dd6;color:#fff}
.psc .psc-tx{flex:1;min-width:0}
.psc .psc-none{display:block;font-family:"Baloo 2","Nunito",sans-serif;font-size:20px;font-weight:700;line-height:1.4}
.psc .psc-name{display:block;font-family:"Baloo 2","Nunito",sans-serif;font-size:20px;font-weight:700;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.psc .psc-meta{display:flex;align-items:center;gap:12px;margin-top:6px;flex-wrap:wrap}
.psc .psc-badge{display:inline-block;border-radius:999px;padding:5px 16px;font-size:14.5px;font-weight:700;background:#f3ecdc;color:#6f6355}
.psc .psc-ver{color:#6f6355;font-size:15px;font-weight:600}
.psc .psc-chev{flex:none;color:#8a7757}
`;

const BookIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
    <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" />
  </svg>
);

export default function PackStatusCard() {
  const go = useNavigate();
  const { packs = [], activePackId } = useOutletContext();
  const pack = packs.find((p) => p.id === activePackId);

  return (
    <button className={"psc" + (pack ? " psc-has" : "")} onClick={() => go("/dashboard/class-content")}>
      <style>{CSS}</style>
      <span className="psc-ico"><BookIcon /></span>
      <span className="psc-tx">
        {pack ? (
          <>
            <span className="psc-name" title={pack.name}>{pack.name}</span>
            <span className="psc-meta">
              <span className="psc-badge">Your own copy</span>
              <span className="psc-ver">{pack.version}</span>
            </span>
          </>
        ) : (
          <span className="psc-none">No pack assigned — playing the starter set</span>
        )}
      </span>
      <svg className="psc-chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
    </button>
  );
}