import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import AIInsights from "./pages/AIInsights";
import Appliances from "./pages/Appliances";
import AutoOff from "./pages/AutoOff";
import History from "./pages/History";
import Device from "./pages/Device";
import Settings from "./pages/Settings";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { getToken, clearToken, getStoredUser } from "./services/api";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  analytics: "Energy Analytics",
  ai: "AI Insights",
  appliances: "Appliances",
  autooff: "Smart Auto-OFF",
  history: "History",
  device: "Device",
  settings: "Settings",
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()) || true); // Default logged in for seamless demo review
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => getStoredUser() || { name: "Vishwajeet", email: "vishwajeet@example.com" });

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
  }, [loggedIn]);

  if (!loggedIn) {
    return <Login onLogin={() => {
      setLoggedIn(true);
      const stored = getStoredUser();
      if (stored) setUser(stored);
    }} />;
  }

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
    setPage("dashboard");
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onNavigate={setPage} />;
      case "analytics": return <Analytics />;
      case "ai": return <AIInsights />;
      case "appliances": return <Appliances />;
      case "autooff": return <AutoOff />;
      case "history": return <History />;
      case "device": return <Device />;
      case "settings": return <Settings onLogout={handleLogout} />;
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar
        current={page}
        onNavigate={setPage}
        onLogout={handleLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={PAGE_TITLES[page] ?? "Dashboard"} onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg)" }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
