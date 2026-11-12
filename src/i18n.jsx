import { createContext, useContext, useEffect, useState } from "react";

const dict = {
  en: {
    menu: "MENU", nav_home: "Home", nav_overview: "Class Overview", nav_content: "Class Content", nav_activity: "Activity Management",
    s_home: "Home", s_overview: "Overview", s_content: "Content", s_activity: "Activities",
    teacher_account: "Teacher Account", teacher_word: "Teacher", grade: "Grade 6-Rizal", grade_of: "Grade {g}", grade_pill: "Grade: {g}",
    signout: "Log-out",
    loading: "Loading...", try_again: "Try again",
    logout_title: "Log Out", logout_msg: "Are you sure you want to log out?", logout_ok: "Log Out",
    lg_desc: "Manage your class, share your class code, and build the quiz and jigsaw activities your students play.",
    teacher: "TEACHER", recovery: "RECOVERY", welcome: "Welcome back", signin_sub: "Sign in with your teacher account.",
    username: "Username", password: "Password", forgot: "Forgot Password?", login: "LOGIN", wait: "Please wait...",
    reset_title: "Reset your password",
    reset_sub: "Enter your registered teacher email. We will email you a secure link to set a new password.",
    reset_email: "Registered Teacher Email", send_link: "Send Reset Link", sending: "Sending...", back_login: "← Back to Login",
    e_fill: "Enter your username and password.", e_nouser: "Username not found.", e_noacct: "Account not found.",
    e_teachers: "This website is for teachers only.", e_disabled: "This account is disabled.", e_wrongpw: "Wrong password.",
    e_notconn: "Cannot reach the server. Please try again.", e_reset: "Could not send the reset link. Check the email.",
    reset_ok: "Reset link sent. Check your email.",
    co_title: "Class Overview", co_sub: "Grade 6 · Section Rizal", total: "Total Students: {n}", class_code: "CLASS CODE",
    generate: "⟳ Generate Code", save: "Save", cancel: "Cancel", copied: "Copied: JuanWise Class Code: {code}",
    joined: "JOINED STUDENTS", remove_confirm: "Remove {name} from the class?", no_students: "No students yet. Share the class code.",
    edit_code: "Edit code", share_code: "Share code", remove: "Remove student",
    cc_title: "Class Content", cc_sub: "What your class plays", no_pack: "No pack assigned — playing the starter set",
    open_am: "Open Activity Management", content_mgmt: "CONTENT MANAGEMENT", assign_hint: "Assign a pack to manage its content here.",
    edit_quiz: "Edit the Quiz", edit_jigsaw: "Edit the Jigsaw", share_it: "Share it", make_copy: "Make a copy",
    only_live: "Only published (Live) packs can be shared.", now_class: "\"{name}\" is now your class pack.",
    copy_added: "A draft copy was added to Activity Management.", in_use: "In use", not_in_use: "Not in use",
    am_title: "Activity Management", am_sub: "Create, copy, or publish your Activity Management", new_pack: "⊕ New Pack",
    copy: "Copy", publish: "Publish", archive: "Archive", st_live: "Live", st_draft: "Draft", st_archived: "Archived",
    published: "published", draft: "draft", archived: "archived",
    cm_title: "Content Manager", jg_title: "Jigsaw Manager", editing: "Editing: {name}", back_packs: "← Back to packs", level: "Level {n}",
    mini_title: "Mini-Lesson before the Quiz", mini_desc: "When ON, students see the mini-lesson before answering each question.",
    mini_note: "Note: this currently affects only the Global Library — students using another pack do not see it yet.",
    question: "Question {n}", default: "Default", custom: "Custom", answer: "Answer", edit: "✏️ Edit",
    edit_q: "Edit Question {n}", back_q: "← Back to questions", revert: "Revert to default", save_changes: "Save changes",
    custom_c: "Custom content", default_c: "Default content", saved: "Saved (demo only — not stored yet).",
    reverted: "Reverted to the default question.", s1: "1. Choose question type", s2: "2. Write the question",
    s3: "3. Configure the answer", correct_answer: "Correct answer", mc_hint: "Click a circle to mark the correct answer. Two to eight choices.",
    enum_hint: "Add each accepted answer. Two to eight.", add_choice: "+ Add choice", hint: "Hint",
    hint_d: "Shown when the player asks for help. Optional.", expl: "Explanation", expl_d: "Shown after answering. Optional.",
    lesson: "Mini-lesson", lesson_d: "Shown before the question when the Mini-Lesson switch is ON.",
    type_mc: "Multiple choice", type_mc_d: "Students choose one correct answer.",
    type_enum: "Enumeration", type_enum_d: "Students supply several answers.",
    type_ident: "Identification", type_ident_d: "Students type one answer.",
    v_q: "Write the question first.", v_a: "Enter the correct answer.", v_c: "Fill in at least two choices.",
  },
  tl: {
    menu: "MENU", nav_home: "Tahanan", nav_overview: "Pangkalahatang-tanaw", nav_content: "Nilalaman ng Klase", nav_activity: "Pamamahala ng Gawain",
    s_home: "Tahanan", s_overview: "Tanaw", s_content: "Nilalaman", s_activity: "Gawain",
    teacher_account: "Account ng Guro", teacher_word: "Guro", grade: "Baitang 6-Rizal", grade_of: "Baitang {g}", grade_pill: "Baitang: {g}",
    signout: "Mag-log-out",
    loading: "Naglo-load...", try_again: "Subukang muli",
    logout_title: "Mag-log Out", logout_msg: "Sigurado ka bang gusto mong mag-log out?", logout_ok: "Mag-log Out",
    lg_desc: "Pamahalaan ang iyong klase, ibahagi ang class code, at gawin ang mga quiz at jigsaw na nilalaro ng iyong mga mag-aaral.",
    teacher: "GURO", recovery: "PAGBAWI", welcome: "Maligayang pagbabalik", signin_sub: "Mag-sign in gamit ang account ng guro.",
    username: "Username", password: "Password", forgot: "Nakalimutan ang Password?", login: "MAG-LOGIN", wait: "Sandali lang...",
    reset_title: "I-reset ang iyong password",
    reset_sub: "Ilagay ang rehistradong email ng guro. Magpapadala kami ng ligtas na link para magtakda ng bagong password.",
    reset_email: "Rehistradong Email ng Guro", send_link: "Ipadala ang Reset Link", sending: "Ipinapadala...", back_login: "← Bumalik sa Login",
    e_fill: "Ilagay ang username at password.", e_nouser: "Hindi nahanap ang username.", e_noacct: "Hindi nahanap ang account.",
    e_teachers: "Para lamang sa mga guro ang website na ito.", e_disabled: "Naka-disable ang account na ito.", e_wrongpw: "Maling password.",
    e_notconn: "Hindi makakonekta sa server. Pakisubukang muli.", e_reset: "Hindi naipadala ang reset link. Tingnan ang email.",
    reset_ok: "Naipadala ang reset link. Tingnan ang iyong email.",
    co_title: "Pangkalahatang-tanaw ng Klase", co_sub: "Baitang 6 · Seksyon Rizal", total: "Kabuuang Mag-aaral: {n}", class_code: "KODIGO NG KLASE",
    generate: "⟳ Gumawa ng Code", save: "I-save", cancel: "Kanselahin", copied: "Nakopya: JuanWise Class Code: {code}",
    joined: "MGA SUMALING MAG-AARAL", remove_confirm: "Alisin si {name} sa klase?", no_students: "Wala pang mag-aaral. Ibahagi ang class code.",
    edit_code: "I-edit ang code", share_code: "Ibahagi ang code", remove: "Alisin ang mag-aaral",
    cc_title: "Nilalaman ng Klase", cc_sub: "Ang nilalaro ng iyong klase", no_pack: "Walang naka-assign na pack — starter set ang nilalaro",
    open_am: "Buksan ang Pamamahala ng Gawain", content_mgmt: "PAMAMAHALA NG NILALAMAN", assign_hint: "Mag-assign ng pack para pamahalaan ang nilalaman dito.",
    edit_quiz: "I-edit ang Quiz", edit_jigsaw: "I-edit ang Jigsaw", share_it: "Ibahagi", make_copy: "Gumawa ng kopya",
    only_live: "Mga nakalathalang (Live) pack lamang ang maibabahagi.", now_class: "Ang \"{name}\" na ang pack ng iyong klase.",
    copy_added: "Naidagdag ang draft na kopya sa Pamamahala ng Gawain.", in_use: "Ginagamit", not_in_use: "Hindi ginagamit",
    am_title: "Pamamahala ng Gawain", am_sub: "Gumawa, kumopya, o maglathala ng iyong mga gawain", new_pack: "⊕ Bagong Pack",
    copy: "Kopyahin", publish: "I-publish", archive: "I-archive", st_live: "Live", st_draft: "Draft", st_archived: "Naka-archive",
    published: "nakalathala", draft: "draft", archived: "naka-archive",
    cm_title: "Tagapamahala ng Nilalaman", jg_title: "Tagapamahala ng Jigsaw", editing: "Ine-edit: {name}", back_packs: "← Bumalik sa mga pack", level: "Antas {n}",
    mini_title: "Mini-Lesson bago ang Quiz", mini_desc: "Kapag ON, makikita ng mga mag-aaral ang mini-lesson bago sumagot sa bawat tanong.",
    mini_note: "Paalala: Global Library lamang ang naaapektuhan nito sa ngayon — hindi pa ito nakikita ng mga gumagamit ng ibang pack.",
    question: "Tanong {n}", default: "Default", custom: "Pasadya", answer: "Sagot", edit: "✏️ I-edit",
    edit_q: "I-edit ang Tanong {n}", back_q: "← Bumalik sa mga tanong", revert: "Ibalik sa default", save_changes: "I-save ang mga pagbabago",
    custom_c: "Pasadyang nilalaman", default_c: "Default na nilalaman", saved: "Na-save (demo lamang — hindi pa iniimbak).",
    reverted: "Naibalik sa default na tanong.", s1: "1. Pumili ng uri ng tanong", s2: "2. Isulat ang tanong",
    s3: "3. I-set ang sagot", correct_answer: "Tamang sagot", mc_hint: "I-click ang bilog para markahan ang tamang sagot. Dalawa hanggang walong pagpipilian.",
    enum_hint: "Idagdag ang bawat tanggap na sagot. Dalawa hanggang walo.", add_choice: "+ Magdagdag ng pagpipilian", hint: "Pahiwatig",
    hint_d: "Ipinapakita kapag humingi ng tulong ang manlalaro. Opsyonal.", expl: "Paliwanag", expl_d: "Ipinapakita pagkatapos sumagot. Opsyonal.",
    lesson: "Mini-lesson", lesson_d: "Ipinapakita bago ang tanong kapag naka-ON ang Mini-Lesson.",
    type_mc: "Multiple choice", type_mc_d: "Pipili ang mga mag-aaral ng isang tamang sagot.",
    type_enum: "Enumeration", type_enum_d: "Magbibigay ang mga mag-aaral ng ilang sagot.",
    type_ident: "Identification", type_ident_d: "Magta-type ang mga mag-aaral ng isang sagot.",
    v_q: "Isulat muna ang tanong.", v_a: "Ilagay ang tamang sagot.", v_c: "Maglagay ng hindi bababa sa dalawang pagpipilian.",
  },
};

const LangCtx = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("lang") || "en"; } catch { return "en"; }
  });
  useEffect(() => {
    try { localStorage.setItem("lang", lang); } catch { /* ignore */ }
    document.documentElement.lang = lang === "tl" ? "fil" : "en";
  }, [lang]);

  const t = (key, vars) => {
    let s = dict[lang][key] ?? dict.en[key] ?? key;
    if (vars) for (const k in vars) s = s.replace("{" + k + "}", vars[k]);
    return s;
  };
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang" role="group" aria-label="Language">
      <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")} title="English">EN</button>
      <button className={lang === "tl" ? "on" : ""} onClick={() => setLang("tl")} title="Tagalog">TL</button>
    </div>
  );
}