/**
 * Sidebar Navigation Functionality
 * Handles sidebar toggle, active link highlighting, and responsive behavior
 */

document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.site-sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebarClose = document.querySelector('.sidebar-close');
    const sidebarLinks = document.querySelectorAll('.sidebar-links a');
    const overlay = document.createElement('div');
    
    // Create overlay for mobile
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Toggle sidebar open
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close sidebar
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    // Close sidebar when clicking overlay
    overlay.addEventListener('click', closeSidebar);

    // Close sidebar on window resize if screen becomes large
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });

    // Highlight active page in sidebar
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    sidebarLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
        
        // Close sidebar when clicking a link on mobile
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                setTimeout(closeSidebar, 200);
            }
        });
    });

    // Close sidebar on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
});
