// Maintenance Mode Detector - Check every 5 seconds if maintenance mode is active
(function() {
    const CHECK_INTERVAL = 5000; // Check every 5 seconds
    const CURRENT_PAGE = window.location.pathname;
    
    // Skip if already on maintenance page
    if (CURRENT_PAGE === '/maintenance.html' || CURRENT_PAGE.includes('maintenance')) {
        return;
    }

    let lastMaintenanceStatus = null;

    async function checkMaintenanceStatus() {
        try {
            const response = await fetch('/api/maintenance-status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('Failed to check maintenance status');
                return;
            }

            const data = await response.json();
            const isUnderMaintenance = data.maintenance === true;

            // If maintenance status changed to true, redirect immediately
            if (isUnderMaintenance && lastMaintenanceStatus !== true) {
                lastMaintenanceStatus = true;
                console.log('Maintenance mode detected. Redirecting...');
                
                // Show alert to user before redirecting
                alert('The website is now undergoing maintenance. We will be back online shortly. Thank you for your patience!');
                
                // Redirect to maintenance page
                window.location.href = '/maintenance.html';
            } else if (!isUnderMaintenance) {
                lastMaintenanceStatus = false;
            }
        } catch (error) {
            console.error('Error checking maintenance status:', error);
            // Don't redirect on error, just continue
        }
    }

    // Initial check on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkMaintenanceStatus);
    } else {
        checkMaintenanceStatus();
    }

    // Set up periodic checks
    setInterval(checkMaintenanceStatus, CHECK_INTERVAL);
})();
