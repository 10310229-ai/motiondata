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
        const mobileLinks = document.querySelectorAll('.mobile-nav-link');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        const mobileSignupBtn = document.getElementById('mobileSignupBtn');
        const showAuthBtn = document.getElementById('showAuthBtn');
        const authModal = document.getElementById('authModal');
        const authTabs = document.querySelectorAll('.auth-tab');
        
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
        
        // Close sidebar when clicking a link
        mobileLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // Don't close for external links with target="_blank"
                if (!this.hasAttribute('target')) {
                    // Check if it's a login/signup button
                    if (this.id === 'mobileLoginBtn' || this.id === 'mobileSignupBtn') {
                        e.preventDefault();
                        closeNav();
                        return;
                    }
                    setTimeout(closeNav, 200);
                }
            });
        });
        
        // Handle login button click
        if (mobileLoginBtn) {
            mobileLoginBtn.addEventListener('click', function(e) {
                e.preventDefault();
                closeNav();
                setTimeout(function() {
                    if (authModal) {
                        authModal.classList.add('active');
                        // Switch to login tab
                        authTabs.forEach(tab => {
                            if (tab.dataset.tab === 'login') {
                                tab.click();
                            }
                        });
                    }
                }, 300);
            });
        }
        
        // Handle signup button click
        if (mobileSignupBtn) {
            mobileSignupBtn.addEventListener('click', function(e) {
                e.preventDefault();
                closeNav();
                setTimeout(function() {
                    if (authModal) {
                        authModal.classList.add('active');
                        // Switch to signup tab
                        authTabs.forEach(tab => {
                            if (tab.dataset.tab === 'signup') {
                                tab.click();
                            }
                        });
                    }
                }, 300);
            });
        }
        
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
