import { useState, useEffect } from "react";
import { Bell, BellOff, Volume2, VolumeX, Play } from "lucide-react";
import { notificationService } from "../lib/notificationService";

const NotificationSettings = () => {
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    updatePermissionStatus();
  }, []);

  const updatePermissionStatus = () => {
    const status = notificationService.getPermissionStatus();
    setPermissionStatus(status);
    setIsEnabled(status === 'granted');
  };

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    updatePermissionStatus();

    if (granted) {
      setIsEnabled(true);
    }
  };

  const handleDisableNotifications = () => {
    // Note: Users need to manually disable notifications in browser settings
    setIsEnabled(false);
  };

  const handleToggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
    // You could save this preference to localStorage
    localStorage.setItem('notificationSound', (!isSoundEnabled).toString());
  };

  const handleTestNotification = async () => {
    if (permissionStatus !== 'granted') {
      alert('Please enable notifications first');
      return;
    }

    setIsTesting(true);
    try {
      await notificationService.testNotification();
    } catch (error) {
      console.error('Error testing notification:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'text-green-500';
      case 'denied':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Notifications Enabled';
      case 'denied':
        return 'Notifications Blocked';
      default:
        return 'Permission Required';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Notification Settings</h3>
      </div>

      <div className="space-y-4">
        {/* Permission Status */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Browser Notifications</h4>
                <p className="text-sm text-base-content/70">
                  Receive notifications when you receive new messages
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
                {permissionStatus === 'granted' ? (
                  <Bell className="w-5 h-5 text-green-500" />
                ) : (
                  <BellOff className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enable/Disable Button */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Notification Status</h4>
                <p className="text-sm text-base-content/70">
                  {isEnabled
                    ? "You'll receive notifications for new messages"
                    : "Notifications are currently disabled"
                  }
                </p>
              </div>
              {permissionStatus === 'default' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleEnableNotifications}
                >
                  Enable Notifications
                </button>
              )}
              {permissionStatus === 'denied' && (
                <div className="text-sm text-red-500">
                  Please enable notifications in your browser settings
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Notification */}
        {permissionStatus === 'granted' && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Test Notifications</h4>
                  <p className="text-sm text-base-content/70">
                    Test the notification system to make sure it's working
                  </p>
                </div>
                <button
                  className={`btn btn-outline btn-sm ${isTesting ? 'loading' : ''}`}
                  onClick={handleTestNotification}
                  disabled={isTesting}
                >
                  <Play className="w-4 h-4" />
                  Test Notification
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sound Settings */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isSoundEnabled ? (
                  <Volume2 className="w-5 h-5 text-green-500" />
                ) : (
                  <VolumeX className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <h4 className="font-medium">Notification Sound</h4>
                  <p className="text-sm text-base-content/70">
                    Play sound when receiving notifications
                  </p>
                </div>
              </div>
              <label className="swap swap-rotate">
                <input
                  type="checkbox"
                  className="swap-input"
                  checked={isSoundEnabled}
                  onChange={handleToggleSound}
                />
                <div className="swap-on">ON</div>
                <div className="swap-off">OFF</div>
              </label>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body">
            <h4 className="font-medium mb-2">How it works</h4>
            <div className="space-y-2 text-sm text-base-content/70">
              <p>• Notifications only appear when you're not in the current chat tab</p>
              <p>• You'll be notified when someone messages you in a different chat</p>
              <p>• Click on a notification to open the chat</p>
              <p>• Notifications are automatically dismissed after 5 seconds</p>
              <p>• You can manage notification permissions in your browser settings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings; 