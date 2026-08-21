import { useState } from "react";
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
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  const handleLogout = () => { setLoggedIn(false); setPage("dashboard"); };

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
