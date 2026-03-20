import { useState } from "react";
import { Key, ExternalLink } from "lucide-react";
import Modal from "./Modal";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
}

export default function SettingsModal({
  open,
  onClose,
  apiKey,
  onSaveKey,
}: SettingsModalProps) {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    onSaveKey(keyInput);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-5">
        {/* API Key */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Key className="w-3.5 h-3.5" />
            FAL API Key
          </label>
          <div className="flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && keyInput && handleSave()}
              placeholder="Enter your FAL API key"
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 border border-zinc-700 hover:border-zinc-600 rounded-lg text-xs text-zinc-400 transition-colors"
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          <a
            href="https://fal.ai/dashboard/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            Get a key from fal.ai
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-zinc-700 hover:border-zinc-600 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!keyInput}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
