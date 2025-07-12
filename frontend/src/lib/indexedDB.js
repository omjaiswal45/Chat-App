class IndexedDBService {
  constructor() {
    this.dbName = 'VaaniSetuDB';
    this.dbVersion = 1;
    this.storeName = 'messages';
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject('Failed to open IndexedDB');
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store for messages
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveMessage(userId, message) {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const messageData = {
        userId,
        message,
        timestamp: Date.now()
      };

      const request = store.add(messageData);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject('Failed to save message');
      };
    });
  }

  async getMessages(userId) {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('userId');

      const request = index.getAll(userId);

      request.onsuccess = () => {
        const messages = request.result
          .map(item => item.message)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        resolve(messages);
      };

      request.onerror = () => {
        reject('Failed to get messages');
      };
    });
  }

  async getAllCachedMessages() {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const request = store.getAll();

      request.onsuccess = () => {
        const allMessages = request.result.map(item => item.message);
        resolve(allMessages);
      };

      request.onerror = () => {
        reject('Failed to get all cached messages');
      };
    });
  }

  async getOfflineMessages() {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const request = store.getAll();

      request.onsuccess = () => {
        const offlineMessages = request.result
          .map(item => item.message)
          .filter(message => message.isOffline === true);
        resolve(offlineMessages);
      };

      request.onerror = () => {
        reject('Failed to get offline messages');
      };
    });
  }

  async removeOfflineMessage(messageId) {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result;
        const itemToDelete = items.find(item => item.message._id === messageId);

        if (itemToDelete) {
          const deleteRequest = store.delete(itemToDelete.id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject('Failed to remove offline message');
      };
    });
  }

  async clearMessages(userId) {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('userId');

      const request = index.getAllKeys(userId);

      request.onsuccess = () => {
        const keys = request.result;
        const deletePromises = keys.map(key => {
          return new Promise((resolve, reject) => {
            const deleteRequest = store.delete(key);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject();
          });
        });

        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(() => reject('Failed to clear messages'));
      };

      request.onerror = () => {
        reject('Failed to clear messages');
      };
    });
  }

  async clearAllMessages() {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject('Failed to clear all messages');
      };
    });
  }

  async getStorageInfo() {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const request = store.getAll();

      request.onsuccess = () => {
        const allData = request.result;
        const totalMessages = allData.length;

        // Group by user
        const userStats = {};
        allData.forEach(item => {
          if (!userStats[item.userId]) {
            userStats[item.userId] = 0;
          }
          userStats[item.userId]++;
        });

        const uniqueUsers = Object.keys(userStats).length;

        resolve({
          totalMessages,
          uniqueUsers,
          userStats
        });
      };

      request.onerror = () => {
        reject('Failed to get storage info');
      };
    });
  }
}

export const indexedDBService = new IndexedDBService(); 