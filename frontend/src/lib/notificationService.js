class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.isTabActive = true;
    this.notificationSound = null;
    this.lastNotificationTime = 0;
    this.notificationCooldown = 2000; // 2 seconds cooldown between notifications
    this.init();
  }

  init() {
    if (!this.isSupported) return;

    if (this.permission === 'default') {
      this.requestPermission();
    }

    this.setupVisibilityListener();
    this.setupNotificationSound();
  }

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      return false;
    }
  }

  setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      this.isTabActive = !document.hidden;
    });

    window.addEventListener('focus', () => {
      this.isTabActive = true;
    });

    window.addEventListener('blur', () => {
      this.isTabActive = false;
    });
  }

  setupNotificationSound() {
    this.notificationSound = new Audio('/notification.mp3');
    this.notificationSound.volume = 0.5;

    this.notificationSound.onerror = () => {
      this.notificationSound = null;
    };
  }

  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      return false;
    }

    const now = Date.now();
    if (now - this.lastNotificationTime < this.notificationCooldown) {
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/chatty-icon.png',
        badge: '/chatty-icon.png',
        tag: 'chat-message',
        requireInteraction: false,
        silent: false,
        ...options
      });

      if (this.notificationSound) {
        try {
          await this.notificationSound.play();
        } catch (error) {
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
          } catch (beepError) {
            // Silent fallback
          }
        }
      }

      this.lastNotificationTime = now;

      setTimeout(() => {
        notification.close();
      }, 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      notification.onactionclick = (event) => {
        const action = event.action;
        if (action === 'reply' || action === 'view') {
          window.focus();
        }
        notification.close();
      };

      return true;
    } catch (error) {
      return false;
    }
  }

  async showMessageNotification(senderName, messageContent, senderId) {
    if (this.isTabActive) {
      return false;
    }

    const title = `New message from ${senderName}`;
    const options = {
      body: messageContent.length > 100
        ? messageContent.substring(0, 100) + '...'
        : messageContent,
      data: { senderId },
      actions: [
        {
          action: 'reply',
          title: 'Reply'
        },
        {
          action: 'view',
          title: 'View Chat'
        }
      ]
    };

    return await this.showNotification(title, options);
  }

  isTabActive() {
    return this.isTabActive;
  }

  getPermissionStatus() {
    return this.permission;
  }

  async checkAndRequestPermission() {
    if (this.permission === 'default') {
      return await this.requestPermission();
    }
    return this.permission === 'granted';
  }
}

export const notificationService = new NotificationService(); 