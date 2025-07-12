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
    if (!this.isSupported) {
      console.log('Notifications not supported in this browser');
      return;
    }

    console.log('NotificationService initialized with permission:', this.permission);
    this.setupVisibilityListener();
    this.setupNotificationSound();
  }

  async requestPermission() {
    try {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      this.permission = permission;
      console.log('Permission result:', permission);
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
    console.log('Attempting to show notification:', title);
    console.log('Current permission:', this.permission);
    console.log('Tab active:', this.isTabActive);

    if (!this.isSupported || this.permission !== 'granted') {
      console.log('Cannot show notification - not supported or permission denied');
      return false;
    }

    const now = Date.now();
    if (now - this.lastNotificationTime < this.notificationCooldown) {
      console.log('Notification skipped due to cooldown');
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

      console.log('Notification created successfully');

      if (this.notificationSound) {
        try {
          await this.notificationSound.play();
          console.log('Notification sound played');
        } catch (error) {
          console.log('Could not play notification sound:', error);
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
            console.log('System beep played');
          } catch (beepError) {
            console.log('Could not play system beep:', beepError);
          }
        }
      }

      this.lastNotificationTime = now;

      setTimeout(() => {
        notification.close();
      }, 5000);

      notification.onclick = () => {
        console.log('Notification clicked');
        window.focus();
        notification.close();
      };

      notification.onactionclick = (event) => {
        const action = event.action;
        console.log('Notification action clicked:', action);
        if (action === 'reply' || action === 'view') {
          window.focus();
        }
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  async showMessageNotification(senderName, messageContent, senderId) {
    console.log('showMessageNotification called:', { senderName, messageContent, senderId });
    console.log('Tab active:', this.isTabActive);

    if (this.isTabActive) {
      console.log('Notification skipped - tab is active');
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
    console.log('Checking and requesting permission...');
    if (this.permission === 'default') {
      return await this.requestPermission();
    }
    return this.permission === 'granted';
  }

  // Method to test notifications
  async testNotification() {
    console.log('Testing notification...');
    return await this.showMessageNotification(
      'Test User',
      'This is a test notification to verify the system is working correctly.',
      'test-user-id'
    );
  }
}

export const notificationService = new NotificationService(); 