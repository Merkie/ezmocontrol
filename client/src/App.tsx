import { useState, useCallback, useEffect } from "react";
import { Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import { Settings, Zap } from "lucide-react";
import { useJobs } from "./hooks/useJobs";
import { getApiKey, setApiKey } from "./lib/storage";
import Upload from "./components/Upload";
import ActiveJob from "./components/ActiveJob";
import JobHistory from "./components/JobHistory";
import SettingsModal from "./components/SettingsModal";

function ApiKeyEntry({ onSave }: { onSave: (key: string) => void }) {
  const [keyInput, setKeyInput] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 text-3xl font-display font-bold uppercase tracking-wider">
            <Zap className="w-8 h-8 text-neon" style={{ filter: "drop-shadow(0 0 8px rgba(0, 255, 136, 0.6))" }} />
            <span className="glitch-text">EzMoControl</span>
          </div>
          <p className="text-dim text-sm tracking-wide">
            Authenticate with your FAL API key to get started
          </p>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon text-sm">&gt;</span>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && keyInput && onSave(keyInput)}
              placeholder="fal_api_key..."
              className="w-full pl-8 pr-4 py-3 bg-panel border border-edge rounded text-sm tracking-wide text-neon focus:outline-none focus:border-neon focus:glow-neon transition-all placeholder:text-dim"
            />
          </div>
          <button
            onClick={() => onSave(keyInput)}
            disabled={!keyInput}
            className="w-full py-3 bg-neon text-void font-bold text-sm uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed rounded hover:brightness-110 transition-all"
          >
            Initialize
          </button>
        </div>
      </div>
    </div>
  );
}

function JobPage({
  jobs,
  apiKey,
  updateJob,
}: {
  jobs: Record<string, import("./types").Job>;
  apiKey: string;
  updateJob: (id: string, updates: Partial<import("./types").Job>) => void;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const job = id ? jobs[id] : undefined;

  if (!job) return <Navigate to="/" replace />;

  return (
    <ActiveJob
      job={job}
      apiKey={apiKey}
      updateJob={updateJob}
      onBack={() => navigate("/")}
    />
  );
}

export default function App() {
  const [apiKey, setApiKeyState] = useState("");
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const { jobs, sortedJobs, createJob, updateJob, deleteJob } = useJobs();

  useEffect(() => {
    getApiKey().then((key) => {
      setApiKeyState(key);
      setKeyLoaded(true);
    });
  }, []);

  const handleSaveKey = useCallback(async (key: string) => {
    await setApiKey(key);
    setApiKeyState(key);
  }, []);

  const handleNewJob = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleSelectJob = useCallback(
    (id: string) => navigate(`/job/${id}`),
    [navigate]
  );

  const handleJobCreated = useCallback(
    (id: string) => navigate(`/job/${id}`),
    [navigate]
  );

  const handleDeleteJob = useCallback(
    (id: string) => {
      deleteJob(id);
      // If we're currently viewing the deleted job, go home
      if (window.location.pathname === `/job/${id}`) {
        navigate("/");
      }
    },
    [deleteJob, navigate]
  );

  if (!keyLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-dim text-sm tracking-wide blink-cursor">Loading</span>
      </div>
    );
  }

  if (!apiKey) {
    return <ApiKeyEntry onSave={handleSaveKey} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-edge px-6 py-3 flex items-center justify-between shrink-0 bg-panel/50 backdrop-blur-sm">
        <button
          onClick={handleNewJob}
          className="flex items-center gap-2.5 font-display font-bold text-lg uppercase tracking-wider hover:neon-text transition-all"
        >
          <Zap className="w-5 h-5 text-neon" style={{ filter: "drop-shadow(0 0 6px rgba(0, 255, 136, 0.5))" }} />
          EzMoControl
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-dim hover:text-neon hover:glow-neon rounded transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Settings modal */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveKey}
      />

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar - Job History */}
        <aside className="w-64 border-r border-edge flex flex-col shrink-0 bg-panel/40">
          <div className="p-4 border-b border-edge flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-dim">Jobs</span>
            <button
              onClick={handleNewJob}
              className="px-3 py-1 text-xs border border-neon/50 text-neon hover:bg-neon/10 hover:glow-neon rounded uppercase tracking-wider transition-all"
            >
              + New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <JobHistory
              jobs={sortedJobs}
              onSelect={handleSelectJob}
              onDelete={handleDeleteJob}
            />
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={
                <Upload
                  apiKey={apiKey}
                  createJob={createJob}
                  updateJob={updateJob}
                  onJobCreated={handleJobCreated}
                />
              }
            />
            <Route
              path="/job/:id"
              element={
                <JobPage
                  jobs={jobs}
                  apiKey={apiKey}
                  updateJob={updateJob}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
