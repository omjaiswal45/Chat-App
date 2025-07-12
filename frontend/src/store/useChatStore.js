import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { indexedDBService } from "../lib/indexedDB";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isOffline: false,

  // Initialize cached messages on app startup
  initializeCachedMessages: async () => {
    try {
      const { authUser } = useAuthStore.getState();
      if (!authUser) return;

      // Load all cached messages for the current user
      const allCachedMessages = await indexedDBService.getAllCachedMessages();
      console.log("Cached messages loaded:", allCachedMessages.length);
    } catch (error) {
      console.error("Error initializing cached messages:", error);
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      // First try to get messages from IndexedDB (offline storage)
      const cachedMessages = await indexedDBService.getMessages(userId);

      if (cachedMessages.length > 0) {
        set({ messages: cachedMessages });
      }

      // Then fetch fresh messages from server
      const res = await axiosInstance.get(`/messages/${userId}`);
      const serverMessages = res.data;

      // Update IndexedDB with fresh messages
      await Promise.all(
        serverMessages.map(message =>
          indexedDBService.saveMessage(userId, message)
        )
      );

      set({ messages: serverMessages, isOffline: false });
    } catch (error) {
      console.error("Error fetching messages:", error);
      set({ isOffline: true });
      // If server fails, try to load from IndexedDB
      try {
        const cachedMessages = await indexedDBService.getMessages(userId);
        set({ messages: cachedMessages });
        if (cachedMessages.length > 0) {
          toast.success("Loaded cached messages (offline mode)");
        } else {
          toast.error("No cached messages available");
        }
      } catch (dbError) {
        console.error("Error loading from IndexedDB:", dbError);
        toast.error("Failed to load messages");
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      const newMessage = res.data;

      // Save to IndexedDB for persistence
      await indexedDBService.saveMessage(selectedUser._id, newMessage);

      set({ messages: [...messages, newMessage], isOffline: false });
    } catch (error) {
      // If server fails, save message locally for offline mode
      const offlineMessage = {
        ...messageData,
        _id: `offline_${Date.now()}`,
        createdAt: new Date().toISOString(),
        senderId: useAuthStore.getState().authUser._id,
        isOffline: true
      };

      await indexedDBService.saveMessage(selectedUser._id, offlineMessage);
      set({ messages: [...messages, offlineMessage], isOffline: true });
      toast.error("Message saved locally (offline mode)");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", async (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      // Save new message to IndexedDB
      try {
        await indexedDBService.saveMessage(selectedUser._id, newMessage);
      } catch (error) {
        console.error("Error saving message to IndexedDB:", error);
      }

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  // New methods for IndexedDB management
  clearUserMessages: async (userId) => {
    try {
      await indexedDBService.clearMessages(userId);
      set({ messages: [] });
      toast.success("Messages cleared successfully");
    } catch (error) {
      toast.error("Failed to clear messages");
    }
  },

  clearAllMessages: async () => {
    try {
      await indexedDBService.clearAllMessages();
      set({ messages: [] });
      toast.success("All messages cleared successfully");
    } catch (error) {
      toast.error("Failed to clear all messages");
    }
  },

  // Load messages from IndexedDB only (for offline mode)
  loadCachedMessages: async (userId) => {
    try {
      const cachedMessages = await indexedDBService.getMessages(userId);
      set({ messages: cachedMessages });
    } catch (error) {
      console.error("Error loading cached messages:", error);
      toast.error("Failed to load cached messages");
    }
  },

  // Sync offline messages when back online
  syncOfflineMessages: async () => {
    try {
      const offlineMessages = await indexedDBService.getOfflineMessages();
      if (offlineMessages.length > 0) {
        // Attempt to send offline messages
        for (const message of offlineMessages) {
          try {
            await axiosInstance.post(`/messages/send/${message.receiverId}`, {
              message: message.message,
              messageType: message.messageType
            });
            // Remove from offline storage after successful send
            await indexedDBService.removeOfflineMessage(message.id);
          } catch (error) {
            console.error("Failed to sync message:", error);
          }
        }
        toast.success("Offline messages synced");
      }
    } catch (error) {
      console.error("Error syncing offline messages:", error);
    }
  },
}));
