class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.isTabActive = true;
    this.notificationSound = null;
    this.init();
  }

  init() {
    // Check if notifications are supported
    if (!this.isSupported) {
      console.log('Notifications not supported');
      return;
    }

    // Request permission if not granted
    if (this.permission === 'default') {
      this.requestPermission();
    }

    // Listen for tab visibility changes
    this.setupVisibilityListener();

    // Setup notification sound
    this.setupNotificationSound();
  }

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      this.isTabActive = !document.hidden;
      console.log('Tab visibility changed:', this.isTabActive ? 'active' : 'inactive');
    });
  }

  setupNotificationSound() {
    // Create audio element for notification sound
    this.notificationSound = new Audio('/notification.mp3');
    this.notificationSound.volume = 0.5;
    
    // Fallback if audio file doesn't exist
    this.notificationSound.onerror = () => {
      console.log('Notification sound file not found, using system beep');
      this.notificationSound = null;
    };
  }

  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/chatty-icon.png', // Your app icon
        badge: '/chatty-icon.png',
        tag: 'chat-message', // Prevents multiple notifications
        requireInteraction: false,
        silent: false,
        ...options
      });

      // Play notification sound if available
      if (this.notificationSound) {
        try {
          await this.notificationSound.play();
        } catch (error) {
          console.log('Could not play notification sound:', error);
          // Fallback to system beep
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
            console.log('Could not play system beep:', beepError);
          }
        }
      }

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  async showMessageNotification(senderName, messageContent, senderId) {
    if (this.isTabActive) {
      // Don't show notification if tab is active
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