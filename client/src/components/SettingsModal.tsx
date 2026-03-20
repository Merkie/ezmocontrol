import { useState, useEffect } from "react";
import { Key, ExternalLink } from "lucide-react";
import Modal from "./Modal";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void | Promise<void>;
}

export default function SettingsModal({
  open,
  onClose,
  apiKey,
  onSaveKey,
}: SettingsModalProps) {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (open) setKeyInput(apiKey);
  }, [open, apiKey]);

  const handleSave = async () => {
    await onSaveKey(keyInput);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-5">
        {/* API Key */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-dim">
            <Key className="w-3.5 h-3.5 text-neon" />
            FAL API Key
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon text-sm">&gt;</span>
              <input
                type={showKey ? "text" : "password"}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && keyInput && handleSave()}
                placeholder="Enter your FAL API key"
                className="w-full pl-7 pr-3 py-2 bg-panel border border-edge rounded text-sm text-neon focus:outline-none focus:border-neon focus:glow-neon transition-all placeholder:text-dim"
              />
            </div>
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 border border-edge hover:border-neon rounded text-xs text-dim hover:text-neon transition-all"
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          <a
            href="https://fal.ai/dashboard/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-dim/60 hover:text-cyan transition-colors"
          >
            Get a key from fal.ai
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-edge hover:border-haze rounded text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!keyInput}
            className="flex-1 py-2.5 bg-neon text-void disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm font-bold uppercase tracking-wider hover:brightness-110 transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
