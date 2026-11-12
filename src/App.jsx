import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import ClassOverview from "./pages/ClassOverview";
import ClassContent from "./pages/ClassContent";
import ActivityManagement from "./pages/ActivityManagement";
import QuizEditor from "./pages/QuizEditor";
import QuestionEditor from "./pages/QuestionEditor";
import JigsawEditor from "./pages/JigsawEditor";

export default function App() {
  const [user, setUser] = useState(undefined);
  const [demo, setDemo] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  if (user === undefined) return <p style={{ padding: 20 }}>Loading...</p>;

  const loggedIn = !!user || demo;

  async function logout() {
    await signOut(auth).catch(() => {});
    setDemo(false);
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={loggedIn ? <Navigate to="/dashboard" /> : <Login onDemo={() => setDemo(true)} />}
      />
      <Route
        path="/dashboard"
        element={loggedIn ? <Dashboard onLogout={logout} /> : <Navigate to="/login" />}
      >
        <Route index element={<Home />} />
        <Route path="class-overview" element={<ClassOverview />} />
        <Route path="class-content" element={<ClassContent />} />
        <Route path="activity-management" element={<ActivityManagement />} />
        <Route path="activity-management/:packId/quiz" element={<QuizEditor />} />
        <Route path="activity-management/:packId/quiz/:catId/:level/:n" element={<QuestionEditor />} />
        <Route path="activity-management/:packId/jigsaw" element={<JigsawEditor />} />
      </Route>
      <Route path="*" element={<Navigate to={loggedIn ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}