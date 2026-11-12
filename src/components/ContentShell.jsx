import { Link } from "react-router-dom";
import { CATS } from "../categories";
import { useLang } from "../i18n";

export default function ContentShell({ title, subtitle, catId, onCat, level, onLevel, children }) {
  const { lang, t } = useLang();
  const cat = CATS.find((c) => c.id === catId);
  return (
    <div className="cm" style={{ "--accent": cat.color }}>
      <Link to="/dashboard/activity-management" className="back">{t("back_packs")}</Link>

      <div className="cm-hero">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="cats">
        {CATS.map((c) => (
          <button
            key={c.id}
            className={"cat-pill" + (c.id === catId ? " on" : "")}
            style={{ "--c": c.color }}
            onClick={() => onCat(c.id)}
          >
            {lang === "tl" ? c.shortTl : c.short}
          </button>
        ))}
      </div>

      <div className="lvls">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={"lvl-pill" + (n === level ? " on" : "")} onClick={() => onLevel(n)}>
            {t("level", { n })}
          </button>
        ))}
      </div>

      {children}
    </div>
  );
}