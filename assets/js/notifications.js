// Order Notifications System
// This handles order notification badges and displays across all pages

// Get notifications from localStorage
function getNotifications() {
    return JSON.parse(localStorage.getItem('orderNotifications') || '[]');
}

// Save notifications to localStorage
function saveNotifications(notifications) {
    localStorage.setItem('orderNotifications', JSON.stringify(notifications));
}

// Add notification function (to be called when order is placed)
window.addOrderNotification = function(orderData) {
    console.log('📬 Adding notification:', orderData);
    const notifications = getNotifications();
    const notification = {
        id: Date.now(),
        title: orderData.title || 'Order Placed',
        message: orderData.message || 'Your order has been received and is being processed.',
        orderId: orderData.orderId || 'N/A',
        network: orderData.network || '',
        amount: orderData.amount || '',
        timestamp: new Date().toISOString(),
        read: false
    };
    notifications.unshift(notification);
    saveNotifications(notifications);
    console.log('✅ Notification saved. Total notifications:', notifications.length);
    
    // Update badge if on homepage
    if (typeof updateBadge === 'function') {
        updateBadge();
    }
    
    // Update badge count in navigation
    updateNotificationBadge();
    
    return notification;
};

// Update notification badge count across all pages
function updateNotificationBadge() {
    const notifications = getNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Find notification badge elements
    const badges = document.querySelectorAll('.notification-badge, .notif-badge');
    badges.forEach(badge => {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });
    
    console.log('📊 Notification badge updated:', unreadCount, 'unread');
}

// Mark notification as read
function markNotificationAsRead(notificationId) {
    const notifications = getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        saveNotifications(notifications);
        updateNotificationBadge();
    }
}

// Clear all notifications
function clearAllNotifications() {
    localStorage.removeItem('orderNotifications');
    updateNotificationBadge();
}

// Initialize notification badge on page load
document.addEventListener('DOMContentLoaded', function() {
    updateNotificationBadge();
    console.log('✅ Notifications system initialized');
});

// Expose functions globally
window.getNotifications = getNotifications;
window.markNotificationAsRead = markNotificationAsRead;
window.clearAllNotifications = clearAllNotifications;
window.updateNotificationBadge = updateNotificationBadge;
