import { useState, useCallback, useEffect } from "react";
import { Settings, Zap } from "lucide-react";
import { useJobs } from "./hooks/useJobs";
import { getApiKey, setApiKey } from "./lib/storage";
import Upload from "./components/Upload";
import ActiveJob from "./components/ActiveJob";
import JobHistory from "./components/JobHistory";

export default function App() {
  const [apiKey, setApiKeyState] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const { jobs, sortedJobs, createJob, updateJob, deleteJob } = useJobs();

  const activeJob = activeJobId ? jobs[activeJobId] : null;

  useEffect(() => {
    getApiKey().then((key) => {
      setApiKeyState(key);
      setKeyInput(key);
      setKeyLoaded(true);
    });
  }, []);

  const handleSaveKey = useCallback(async () => {
    await setApiKey(keyInput);
    setApiKeyState(keyInput);
    setShowSettings(false);
  }, [keyInput]);

  const handleNewJob = useCallback(() => {
    setActiveJobId(null);
  }, []);

  if (!keyLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold">
              <Zap className="w-7 h-7 text-blue-500" />
              EzMoControl
            </div>
            <p className="text-zinc-400 text-sm">
              Enter your FAL API key to get started
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && keyInput && handleSaveKey()}
              placeholder="FAL API Key"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleSaveKey}
              disabled={!keyInput}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Zap className="w-5 h-5 text-blue-500" />
          EzMoControl
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-zinc-400" />
        </button>
      </header>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-b border-zinc-800 px-6 py-4 bg-zinc-900/50">
          <div className="max-w-md space-y-3">
            <label className="text-sm text-zinc-400">FAL API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar - Job History */}
        <aside className="w-64 border-r border-zinc-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">Jobs</span>
            <button
              onClick={handleNewJob}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded-md transition-colors font-medium"
            >
              + New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <JobHistory
              jobs={sortedJobs}
              activeJobId={activeJobId}
              onSelect={setActiveJobId}
              onDelete={deleteJob}
            />
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 overflow-y-auto">
          {activeJob ? (
            <ActiveJob
              job={activeJob}
              apiKey={apiKey}
              updateJob={updateJob}
              onBack={handleNewJob}
            />
          ) : (
            <Upload
              apiKey={apiKey}
              createJob={createJob}
              updateJob={updateJob}
              onJobCreated={setActiveJobId}
            />
          )}
        </main>
      </div>
    </div>
  );
}
