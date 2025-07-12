import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Send, Trash2, Database, AlertTriangle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { indexedDBService } from "../lib/indexedDB";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { clearUserMessages, clearAllMessages, selectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const [isClearing, setIsClearing] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      setIsLoadingStorage(true);
      const info = await indexedDBService.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error("Error loading storage info:", error);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const handleClearCurrentChat = async () => {
    if (!selectedUser) {
      alert("Please select a chat first");
      return;
    }

    setIsClearing(true);
    try {
      await clearUserMessages(selectedUser._id);
      await loadStorageInfo(); // Refresh storage info
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearAllMessages = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all cached messages? This action cannot be undone."
    );

    if (!confirmed) return;

    setIsClearing(true);
    try {
      await clearAllMessages();
      await loadStorageInfo(); // Refresh storage info
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-8">
        {/* Theme Section */}
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Theme</h2>
            <p className="text-sm text-base-content/70">Choose a theme for your chat interface</p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                className={`
                  group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                  ${theme === t ? "bg-base-200" : "hover:bg-base-200/50"}
                `}
                onClick={() => setTheme(t)}
              >
                <div className="relative h-8 w-full rounded-md overflow-hidden" data-theme={t}>
                  <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                    <div className="rounded bg-primary"></div>
                    <div className="rounded bg-secondary"></div>
                    <div className="rounded bg-accent"></div>
                    <div className="rounded bg-neutral"></div>
                  </div>
                </div>
                <span className="text-[11px] font-medium truncate w-full text-center">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Storage Management Section */}
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5" />
              Storage Management
            </h2>
            <p className="text-sm text-base-content/70">
              Manage your cached messages and local storage
            </p>
          </div>

          <div className="grid gap-4">
            {/* Storage Stats */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-info" />
                  Storage Statistics
                </h3>
                {isLoadingStorage ? (
                  <div className="flex items-center gap-2">
                    <div className="loading loading-spinner loading-sm"></div>
                    <span className="text-sm">Loading storage info...</span>
                  </div>
                ) : storageInfo ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-base-content/70">
                      Total cached messages: <span className="font-semibold text-primary">{storageInfo.totalMessages}</span>
                    </p>
                    <p className="text-base-content/70">
                      Conversations with: <span className="font-semibold text-primary">{storageInfo.uniqueUsers}</span> users
                    </p>
                    {storageInfo.totalMessages > 0 && (
                      <p className="text-base-content/70">
                        Average messages per conversation: <span className="font-semibold text-primary">
                          {Math.round(storageInfo.totalMessages / storageInfo.uniqueUsers)}
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-base-content/70">No cached messages found</p>
                )}
              </div>
            </div>

            {/* Current Chat Messages */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-base">Current Chat Messages</h3>
                <p className="text-sm text-base-content/70">
                  Clear cached messages for the currently selected chat
                </p>
                <div className="card-actions justify-end">
                  <button
                    className={`btn btn-outline btn-sm ${isClearing ? 'loading' : ''}`}
                    onClick={handleClearCurrentChat}
                    disabled={!selectedUser || isClearing}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Current Chat
                  </button>
                </div>
              </div>
            </div>

            {/* All Messages */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-base">All Cached Messages</h3>
                <p className="text-sm text-base-content/70">
                  Clear all cached messages from your browser storage
                </p>
                <div className="card-actions justify-end">
                  <button
                    className={`btn btn-error btn-sm ${isClearing ? 'loading' : ''}`}
                    onClick={handleClearAllMessages}
                    disabled={isClearing}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All Messages
                  </button>
                </div>
              </div>
            </div>

            {/* Storage Info */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Storage Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-base-content/70">
                    Messages are automatically cached in your browser's IndexedDB storage for offline access.
                  </p>
                  <p className="text-base-content/70">
                    This data persists even when you close the browser and helps load messages faster.
                  </p>
                  <p className="text-base-content/70">
                    You can clear this data anytime using the options above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold mb-3">Theme Preview</h3>
          <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
            <div className="p-4 bg-base-200">
              <div className="max-w-lg mx-auto">
                {/* Mock Chat UI */}
                <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                  {/* Chat Header */}
                  <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                        J
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Jassu</h3>
                        <p className="text-xs text-base-content/70">Online</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                    {PREVIEW_MESSAGES.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`
                            max-w-[80%] rounded-xl p-3 shadow-sm
                            ${message.isSent ? "bg-primary text-primary-content" : "bg-base-200"}
                          `}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`
                              text-[10px] mt-1.5
                              ${message.isSent ? "text-primary-content/70" : "text-base-content/70"}
                            `}
                          >
                            12:00 PM
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-base-300 bg-base-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered flex-1 text-sm h-10"
                        placeholder="Type a message..."
                        value="This is a preview"
                        readOnly
                      />
                      <button className="btn btn-primary h-10 min-h-0">
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
