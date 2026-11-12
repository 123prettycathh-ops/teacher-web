import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { CATS } from "../categories";
import ContentShell from "../components/ContentShell";
import { api, asList } from "../api";
import { useLang } from "../i18n";

export default function QuizEditor() {
  const { lang, t } = useLang();
  const { packId } = useParams();
  const go = useNavigate();
  const [sp, setSp] = useSearchParams();
  const { packs, quizLevels, setQuizLevels, lessonOn, setLessonOn } = useOutletContext();
  const pack = packs.find((p) => p.id === packId);

  const catId = CATS.some((c) => c.id === sp.get("cat")) ? sp.get("cat") : CATS[0].id;
  const level = Math.min(5, Math.max(1, Number(sp.get("level")) || quizLevels[catId] || 1));

  const lKey = catId + "|" + level;
  const lessonIsOn = lessonOn[lKey] ?? true;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    api(`/packs/${packId}/questions?category=${catId}&level=${level}`)
      .then((d) => alive && setItems(asList(d)))
      .catch((e) => alive && setErr(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [packId, catId, level]);

  const byNum = Object.fromEntries(items.map((q) => [q.activityNum, q]));

  const pickCat = (id) => setSp({ cat: id, level: String(quizLevels[id] ?? 1) }, { replace: true });
  function pickLevel(n) {
    setQuizLevels({ ...quizLevels, [catId]: n });
    setSp({ cat: catId, level: String(n) }, { replace: true });
  }

  const textOf = (q) => (lang === "en" && q.en?.question ? q.en.question : q.question);
  const answerOf = (q) => {
    if (q.type === "enumeration") return (q.answerPool?.length ?? 0) + " accepted answers";
    return (lang === "en" && q.en?.correctAnswer ? q.en.correctAnswer : q.correctAnswer) || "—";
  };

  return (
    <ContentShell
      title={t("cm_title")}
      subtitle={t("editing", { name: pack ? pack.name : "Pack" })}
      catId={catId}
      onCat={pickCat}
      level={level}
      onLevel={pickLevel}
    >
      <div className="card row">
        <div className="grow">
          <h3 style={{ margin: "0 0 6px", fontSize: 22 }}>{t("mini_title")}</h3>
          <span className="muted">{t("mini_desc")}</span>
        </div>
        <label className="switch">
          <input type="checkbox" checked={lessonIsOn} onChange={(e) => setLessonOn({ ...lessonOn, [lKey]: e.target.checked })} />
          <span />
        </label>
      </div>
      <p className="note">{t("mini_note")}</p>

      {loading && <p className="muted">Loading...</p>}
      {err && <p style={{ color: "#c0392b" }}>{err}</p>}

      <div className="grid">
        {[1, 2, 3, 4, 5, 6].map((n) => {
          const q = byNum[n];
          return (
            <div className="card" key={n}>
              <div className="row">
                <h3 className="grow" style={{ margin: 0, fontSize: 22 }}>{t("question", { n })}</h3>
                <span className={"tag" + (q?.isOverride ? " custom" : "")}>{q?.isOverride ? t("custom") : t("default")}</span>
              </div>
              <p style={{ fontSize: 18 }}>{q ? textOf(q) : "—"}</p>
              <p className="ans">{t("answer")}: {q ? answerOf(q) : "—"}</p>
              <button className="btn accent" onClick={() => go("/dashboard/activity-management/" + packId + "/quiz/" + catId + "/" + level + "/" + n)}>
                {t("edit")}
              </button>
            </div>
          );
        })}
      </div>
    </ContentShell>
  );
}