import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { api } from "../api";
import { LangToggle, useLang } from "../i18n";
import ConfirmDialog from "../components/ConfirmDialog";

// Open eye: shown when the password is visible (ON)
function EyeOpenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Eye with a slash: shown when the password is hidden (OFF)
function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// Picture shown beside the Terms & Conditions title.
// Put your JuanWise icon in the public folder and set its file name here.
const TERMS_LOGO = "/juanwise-logo.png";

// Terms & Conditions content (English)
function TermsContent() {
  return (
    <div className="tc-body">
      <h2>Parental Consent &amp; Privacy Policy</h2>
      <p>
        I, [Parent/Guardian Name], give consent for my child, [Child Name] (Grade 5-6), to use this digital
        supplementary learning tool. I understand that I am responsible for monitoring my child's activity.
      </p>
      <p>
        Data Collection &amp; Privacy: By using this app, essential data—including the child's name, grade level,
        and academic performance metrics—is collected solely to operate the platform and provide progress tracking.
      </p>
      <p>
        Progress dashboards, detailed improvement reports, and performance data are strictly confidential and
        accessible only by parents and authorized teachers.
      </p>

      <h2>Game Mechanics &amp; Structure</h2>
      <ul>
        <li>Accounts: Every student and teacher needs an account to access and use JuanWise.</li>
        <li>
          Game Structure &amp; Levels: Players choose one of six categories: History, Culture &amp; Tradition,
          Geography, Festival Arts, National Symbols, and Filipino Heroes. Each category has 5 levels for quizzes
          and 5 levels for jigsaw puzzles, and each level has 6 activities. Each quiz and jigsaw activity has a
          time limit of 60 seconds. Difficulty depends on the level: Level 1 is Easy, Levels 2-3 are Normal, and
          Levels 4-5 are Hard.
        </li>
        <li>
          Quizzes: Players pick a category to start a quiz. Each level has 6 questions, one per activity, and each
          question has a 60-second time limit. A question may be Multiple Choice, Identification, or Enumeration.
          Players must answer all 6 questions correctly to unlock the next level.
        </li>
        <li>
          Jigsaw Puzzles: Players pick a category to start a puzzle, and must assemble it within the 60-second
          time limit to move on. The number of pieces depends on the activity's place in the level, and the
          teacher may change it: Activities 1-2: 6 pieces (2x3 grid). Activities 3-4: 9 pieces (3x3 grid).
          Activities 5-6: 12 pieces (3x4 grid).
        </li>
        <li>
          Attempts &amp; Points: Each activity allows up to 3 attempts. A pass earns 15 points on the first
          attempt, 10 on the second, and 6 on the third; a wrong answer or a timeout earns none. Medals reward
          speed: finishing within half the time earns gold, within three quarters earns silver, and otherwise
          bronze.
        </li>
        <li>
          Content: Teachers (admins) add, delete or archive, duplicate, and publish activity packs. For quizzes,
          the teacher writes the questions for every activity in each level (Multiple Choice, Identification, or
          Enumeration) and may add a mini-lesson with an optional picture. For jigsaw puzzles, the teacher sets
          the puzzle picture and a mini-lesson for each category; the picture is cut into 6, 9, or 12 pieces.
        </li>
      </ul>

      <h2>Code of Conduct</h2>
      <h3>MOBILE APP — FOR PLAYERS (GRADE 5-6):</h3>
      <ul>
        <li>Conduct yourself with integrity in all learning and gaming activities.</li>
        <li>Keep your account credentials strictly confidential.</li>
        <li>Use this platform for educational purposes only.</li>
      </ul>
      <p className="tc-notice"><b>Notice:</b> Violation may result in immediate account restriction or suspension.</p>

      <h3>MOBILE APP AND WEB — FOR ADMINS (TEACHERS):</h3>
      <ul>
        <li>Access student data exclusively for academic monitoring, evaluation, and guidance.</li>
        <li>Adhere strictly to student privacy and data protection regulations.</li>
        <li>Curate and assign grade-appropriate material within the application.</li>
        <li>Manage user accounts and educational content responsibly.</li>
        <li>Add, delete or archive, duplicate, and publish activity packs.</li>
      </ul>
      <p className="tc-notice"><b>Notice:</b> Violation may result in immediate account restriction or suspension.</p>

      <h3>WEB — FOR MAIN ADMINS (DEVELOPERS):</h3>
      <ul>
        <li>Monitor all user accounts that access the application, to keep it secure and to prevent suspicious or unauthorized use.</li>
        <li>Add, delete or archive, duplicate, publish, and edit activity packs and their content.</li>
        <li>Delete unused accounts, packs and classes.</li>
      </ul>
    </div>
  );
}

// Hover styles for the password eye and the buttons (kept here so no extra CSS file is needed)
const loginHoverCss = `
.lg-eye {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 8px;
  color: #6b7280;
  transition: color 0.15s ease;
}
.lg-eye svg {
  stroke-width: 1.6;
  transition: stroke-width 0.15s ease;
}
.lg-eye:hover,
.lg-eye:focus-visible {
  color: #111827;
}
.lg-eye:hover svg,
.lg-eye:focus-visible svg {
  stroke-width: 2.6;
}

.lg-btn {
  transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
}
.lg-btn:hover:not(:disabled) {
  background-color: #1a4fc4;
  box-shadow: 0 6px 16px rgba(0, 56, 168, 0.3);
  transform: translateY(-1px);
}
.lg-btn:active:not(:disabled) {
  background-color: #002a80;
  transform: translateY(0);
}
.lg-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
.lg-btn.green:hover:not(:disabled) {
  background-color: #16a34a;
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.3);
}

/* "By signing in you agree..." line */
.lg-agree {
  margin: 16px 0 0;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}
.lg-agree .lg-terms-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: #0038a8;
  text-decoration: underline;
  cursor: pointer;
}
.lg-agree .lg-terms-link:hover {
  color: #1a4fc4;
}

/* Terms & Conditions page */
.tc-page {
  min-height: 100vh;
  background: #f6f8fc;
  padding: 24px 16px 48px;
  box-sizing: border-box;
}
.tc-wrap {
  max-width: 820px;
  margin: 0 auto;
}
.tc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.tc-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.tc-logo {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
}
.tc-top h1 {
  margin: 0;
  font-size: 26px;
  color: #111827;
}
.tc-top small {
  color: #6b7280;
}
.tc-back {
  background: none;
  border: none;
  color: #0038a8;
  font: inherit;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
  white-space: nowrap;
}
.tc-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px 28px;
}
.tc-body h2 {
  font-size: 20px;
  margin: 24px 0 10px;
  color: #111827;
}
.tc-body h2:first-child {
  margin-top: 0;
}
.tc-body h3 {
  font-size: 14px;
  margin: 18px 0 8px;
  color: #0038a8;
  letter-spacing: 0.3px;
}
.tc-body p,
.tc-body li {
  font-size: 15px;
  line-height: 1.6;
  color: #1f2937;
}
.tc-body ul {
  padding-left: 22px;
  margin: 8px 0;
}
.tc-body li {
  margin-bottom: 8px;
}
.tc-notice {
  background: #fff7ed;
  border-left: 4px solid #f59e0b;
  padding: 8px 12px;
  border-radius: 6px;
}
`;

export default function Login() {
  const { t } = useLang();
  // The Terms page is kept in the URL (#terms), so refreshing the page keeps you on it.
  // Only the "Back to sign in" button (or the browser back button) leaves it.
  const [mode, setMode] = useState(() => (window.location.hash === "#terms" ? "terms" : "login"));

  useEffect(() => {
    function onHashChange() {
      setMode((m) => (window.location.hash === "#terms" ? "terms" : m === "terms" ? "login" : m));
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function openTerms() {
    setError("");
    window.location.hash = "terms";
    setMode("terms");
  }

  function closeTerms() {
    window.history.pushState(null, "", window.location.pathname + window.location.search);
    setMode("login");
  }

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [welcome, setWelcome] = useState(null);
  const [alertBox, setAlertBox] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    const uname = username.trim().toLowerCase();
    if (!uname || !password) {
      setAlertBox({ title: "Missing Info", message: "Please enter username and password." });
      return;
    }

    setLoading(true);
    try {
      const session = await api("/auth/login", {
        method: "POST",
        body: { username: uname, password },
        auth: false,
      });
      const user = session.user;
      if (user.role !== "teacher") throw new Error(t("e_teachers"));
      if (user.disabled) throw new Error(t("e_disabled"));

      // Show the "Logged In" dialog first. The real sign-in happens on Continue.
      setWelcome({ name: user.name, email: user.email, password });
    } catch (err) {
      console.error(err);
      if (err.status === 401) setError(t("e_wrongpw"));
      else if (err.name === "TypeError") setError(t("e_notconn"));
      else setError(err.message);
    }
    setLoading(false);
  }

  async function continueIn() {
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, welcome.email, welcome.password);
    } catch (err) {
      console.error(err);
      setWelcome(null);
      setError(t("e_wrongpw"));
      await signOut(auth).catch(() => {});
    }
    setLoading(false);
  }

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setMessage(t("reset_ok"));
    } catch (err) {
      console.error(err);
      setError(t("e_reset"));
    }
    setLoading(false);
  }

  // Terms & Conditions page (opened from the sign-in form)
  if (mode === "terms") {
    return (
      <div className="tc-page">
        <style>{loginHoverCss}</style>
        <div className="tc-wrap">
          <div className="tc-top">
            <div className="tc-brand">
              <img
                className="tc-logo"
                src={TERMS_LOGO}
                alt="JuanWise"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div>
                <h1>Terms &amp; Conditions</h1>
                <small>JuanWise</small>
              </div>
            </div>
            <button type="button" className="tc-back" onClick={closeTerms}>
              ← Back to login
            </button>
          </div>
          <div className="tc-card">
            <TermsContent />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg-page">
      <style>{loginHoverCss}</style>
      <div className="lg-lang"><LangToggle /></div>

      <section className="lg-hero">
        <div className="lg-hero-inner">
          <div className="lg-logo">
            <img src="/teacher-logo.png" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <span>👩‍🏫</span>
          </div>
          <h1>JuanWise<br />Teacher Portal</h1>
          <p>{t("lg_desc")}</p>
          <div className="lg-flag"><i /><i /><i /></div>
        </div>
      </section>

      <section className="lg-panel">
        <div className="lg-box">
          {mode === "login" ? (
            <form onSubmit={handleLogin}>
              <span className="lg-badge">{t("teacher")}</span>
              <h2>{t("welcome")}</h2>
              <p className="lg-sub">{t("signin_sub")}</p>

              <label className="lg-label">{t("username")}</label>
              <div className="lg-field">
                <span className="lg-ico">👤</span>
                <input placeholder={t("username")} autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>

              <label className="lg-label">{t("password")}</label>
              <div className="lg-field">
                <span className="lg-ico">🔒</span>
                <input type={showPwd ? "text" : "password"} placeholder={t("password")} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button
                  type="button"
                  className="lg-eye"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  title={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOffIcon /> : <EyeOpenIcon />}
                </button>
              </div>

              <div className="lg-right">
                <button type="button" className="lg-link" onClick={() => { setMode("reset"); setError(""); }}>{t("forgot")}</button>
              </div>

              {error && <p className="lg-error">{error}</p>}

              <button className="lg-btn" disabled={loading}>{loading ? t("wait") : t("login")}</button>

              <p className="lg-agree">
                By signing in you agree to the{" "}
                <button type="button" className="lg-terms-link" onClick={openTerms}>
                  Terms &amp; Conditions
                </button>
                .
              </p>
            </form>
          ) : (
            <form onSubmit={handleReset}>
              <span className="lg-badge green">{t("recovery")}</span>
              <h2>{t("reset_title")}</h2>
              <p className="lg-sub">{t("reset_sub")}</p>

              <label className="lg-label">{t("reset_email")}</label>
              <div className="lg-field">
                <span className="lg-ico">✉️</span>
                <input type="email" placeholder={t("reset_email")} value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
              </div>

              {error && <p className="lg-error">{error}</p>}
              {message && <p className="lg-success">{message}</p>}

              <button className="lg-btn green" disabled={loading}>{loading ? t("sending") : t("send_link")}</button>
              <button type="button" className="lg-demo" onClick={() => { setMode("login"); setError(""); setMessage(""); }}>{t("back_login")}</button>
            </form>
          )}
        </div>
      </section>

      {alertBox && (
        <ConfirmDialog
          title={alertBox.title}
          message={alertBox.message}
          actions={[{ label: "OK", onClick: () => setAlertBox(null) }]}
        />
      )}

      {welcome && (
        <ConfirmDialog
          title="Logged In"
          message={`Welcome back, ${welcome.name}!`}
          actions={[{ label: "Continue", onClick: continueIn }]}
        />
      )}
    </div>
  );
}