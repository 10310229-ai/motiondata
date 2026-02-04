/**
 * Simple Mobile Navigation
 */

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        const hamburger = document.getElementById('hamburgerBtn');
        const sidebar = document.getElementById('mobileNavSidebar');
        const overlay = document.getElementById('mobileNavOverlay');
        const closeBtn = document.getElementById('closeNavBtn');
        const mobileLinks = document.querySelectorAll('.mobile-nav-link');
        
        if (!hamburger || !sidebar || !overlay) {
            console.warn('Navigation elements not found');
            return;
        }
        
        // Open sidebar
        function openNav() {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            hamburger.classList.add('active');
        }
        
        // Close sidebar
        function closeNav() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            hamburger.classList.remove('active');
        }
        
        // Toggle sidebar
        function toggleNav(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (sidebar.classList.contains('active')) {
                closeNav();
            } else {
                openNav();
            }
        }
        
        // Event listeners
        hamburger.addEventListener('click', toggleNav);
        overlay.addEventListener('click', closeNav);
        if (closeBtn) {
            closeBtn.addEventListener('click', closeNav);
        }
        
        // Close sidebar when clicking a link
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                // Don't close for external links with target="_blank"
                if (!this.hasAttribute('target')) {
                    setTimeout(closeNav, 200);
                }
            });
        });
        
        // Close on window resize if screen becomes desktop size
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth >= 768 && sidebar.classList.contains('active')) {
                    closeNav();
                }
            }, 250);
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                closeNav();
            }
        });
    }
})();
