/**
 * Sidebar Navigation Functionality
 * Handles sidebar toggle, active link highlighting, and responsive behavior
 */

document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.site-sidebar');
    const headerMenuToggle = document.getElementById('headerMenuToggle');
    const sidebarMenuToggle = document.getElementById('sidebarMenuToggle');
    const sidebarLinks = document.querySelectorAll('.sidebar-links a');
    const overlay = document.createElement('div');
    
    // Create overlay for mobile
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Toggle sidebar visibility
    function toggleSidebar() {
        const isActive = sidebar.classList.contains('active');
        
        if (isActive) {
            // Close sidebar
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            if (headerMenuToggle) {
                headerMenuToggle.classList.remove('active');
                headerMenuToggle.style.display = '';
            }
            if (sidebarMenuToggle) {
                sidebarMenuToggle.classList.remove('active');
                sidebarMenuToggle.style.display = 'none';
            }
            document.body.style.overflow = '';
        } else {
            // Open sidebar
            sidebar.classList.add('active');
            overlay.classList.add('active');
            if (headerMenuToggle) {
                headerMenuToggle.classList.add('active');
                headerMenuToggle.style.display = 'none';
            }
            if (sidebarMenuToggle) {
                sidebarMenuToggle.classList.add('active');
                sidebarMenuToggle.style.display = '';
            }
            document.body.style.overflow = 'hidden';
        }
    }

    // Header hamburger toggle button
    if (headerMenuToggle) {
        headerMenuToggle.addEventListener('click', toggleSidebar);
    }

    // Sidebar hamburger toggle button
    if (sidebarMenuToggle) {
        sidebarMenuToggle.addEventListener('click', toggleSidebar);
    }

    // Close sidebar when clicking overlay
    overlay.addEventListener('click', function(e) {
        if (sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });

    // Close sidebar on window resize if screen becomes desktop/iPad size
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768 && sidebar.classList.contains('active')) {
            toggleSidebar();
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
        
        // Close sidebar when clicking a link on mobile (but don't prevent default)
        link.addEventListener('click', function(e) {
            // Only auto-close on mobile, and only for internal links
            if (window.innerWidth < 768 && !link.hasAttribute('target')) {
                // Let the link navigation happen naturally, then close sidebar
                setTimeout(function() {
                    if (sidebar.classList.contains('active')) {
                        toggleSidebar();
                    }
                }, 100);
            }
        });
    });

    // Close sidebar on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
});
