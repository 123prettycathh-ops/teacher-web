import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LangToggle, useLang } from "../i18n";
import { api, asList, toUiPack } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Dashboard({ onLogout }) {
  const { t } = useLang();
  const [me, setMe] = useState(null);
  const [klass, setKlass] = useState(null);
  const [packs, setPacks] = useState([]);
  const [students, setStudents] = useState([]);
  const [activePackId, setActivePackId] = useState(null);
  const [quizData, setQuizData] = useState({});
  const [quizLevels, setQuizLevels] = useState({});
  const [lessonOn, setLessonOn] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmOut, setConfirmOut] = useState(false);
  const [logoFail, setLogoFail] = useState(false); // true if /juanwise-logo.png can't be loaded

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [profile, classes, packList] = await Promise.all([
        api("/auth/me"),
        api("/classes/mine"),
        api("/packs?mine=true"),
      ]);
      const cls = asList(classes)[0] ?? null;
      setMe(profile);
      setKlass(cls);
      setPacks(asList(packList).map(toUiPack));
      setActivePackId(cls?.packId ?? null);
      if (cls) {
        const m = await api(`/classes/${cls.id}/members?limit=100`);
        setStudents(asList(m).map((s) => ({ uid: s.uid, name: s.name, user: s.username })));
      } else {
        setStudents([]);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || "Could not load your data");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // When the teacher changes the profile picture in the mobile app,
  // it shows up here as soon as they return to this browser tab.
  useEffect(() => {
    const refresh = () => api("/auth/me").then(setMe).catch(() => {});
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const ctx = {
    me, klass, setKlass, reload: load,
    packs, setPacks, activePackId, setActivePackId,
    students, setStudents,
    quizData, setQuizData, quizLevels, setQuizLevels, lessonOn, setLessonOn,
  };

  const profile = me?.user ?? me ?? {};
  const name = profile.name || t("teacher_word");
  const gradeText = klass?.gradeLevel
    ? t("grade_of", { g: klass.gradeLevel + (klass.section ? "-" + klass.section : "") })
    : t("grade");

  const links = [
    ["", "🏠", t("nav_home"), t("s_home")],
    ["class-overview", "📊", t("nav_overview"), t("s_overview")],

    ["class-content", "📘", t("nav_content"), t("s_content")],
    ["activity-management", "🔖", t("nav_activity"), t("s_activity")],
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          {logoFail ? (
            <div className="logo">JW</div>
          ) : (
            <img
              src="/juanwise-logo.png"
              alt="JuanWise"
              onError={() => setLogoFail(true)}
              style={{ width: 52, height: 52, objectFit: "contain", flex: "none" }}
            />
          )}
          <div><b>JuanWise</b><small>{t("teacher")}</small></div>
        </div>
        <div className="group">{t("menu")}</div>
        {links.map(([to, icon, label]) => (
          <NavLink key={to} to={"/dashboard" + (to ? "/" + to : "")} end={!to} className="nav"><span>{icon}</span>{label}</NavLink>
        ))}
        <div className="side-user">
          <b>{name}</b><br />
          <small>{gradeText}</small>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="who">{name}<small>{t("teacher_account")} · {gradeText}</small></div>
          <div className="row">
            <LangToggle />
            <button className="btn light" onClick={() => setConfirmOut(true)}>{t("signout")}</button>
          </div>
        </header>
        <main className="content">
          {loading ? (
            <p className="muted">{t("loading")}</p>
          ) : error ? (
            <div className="card center">
              <p style={{ color: "#c0392b" }}>{error}</p>
              <button className="btn navy" onClick={load}>{t("try_again")}</button>
            </div>
          ) : (
            <Outlet context={ctx} />
          )}
        </main>
      </div>

      <nav className="bottom-nav">
        {links.map(([to, icon, , short]) => (
          <NavLink key={to} to={"/dashboard" + (to ? "/" + to : "")} end={!to}><span>{icon}</span>{short}</NavLink>
        ))}
      </nav>

      {confirmOut && (
        <ConfirmDialog
          title={t("logout_title")}
          message={t("logout_msg")}
          actions={[
            { label: t("cancel"), onClick: () => setConfirmOut(false) },
            { label: t("logout_ok"), onClick: () => { setConfirmOut(false); onLogout(); } },
          ]}
        />
      )}
    </div>
  );
}