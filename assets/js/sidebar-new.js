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
        const supportBtn = document.getElementById('customerSupportBtn');
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

        // Customer support quick menu (email / call / WhatsApp)
        let supportMenu;
        function ensureSupportMenu() {
            if (supportMenu) return supportMenu;

            supportMenu = document.createElement('div');
            supportMenu.className = 'support-menu';
            supportMenu.setAttribute('role', 'menu');
            supportMenu.setAttribute('aria-label', 'Customer support menu');
            supportMenu.innerHTML = `
                <h4>Customer Support</h4>
                <p>Choose how you want to reach us.</p>
                <a class="support-email" href="mailto:kwakumotion55@gmail.com?subject=Motion%20Data%20Support" role="menuitem">
                    <i class="fas fa-envelope"></i> Email Support
                </a>
                <a class="support-call" href="tel:0256342577" role="menuitem">
                    <i class="fas fa-phone"></i> Call Support
                </a>
                <a class="support-whatsapp" href="https://wa.me/233256342577" target="_blank" rel="noopener" role="menuitem">
                    <i class="fab fa-whatsapp"></i> WhatsApp Chat (0256342577)
                </a>
            `;
            document.body.appendChild(supportMenu);
            return supportMenu;
        }

        function positionSupportMenu() {
            if (!supportBtn || !supportMenu) return;
            const rect = supportBtn.getBoundingClientRect();
            const menu = supportMenu;
            menu.style.top = `${rect.bottom + 10}px`;
            const right = Math.max(12, window.innerWidth - rect.right);
            menu.style.right = `${right}px`;
            menu.style.left = 'auto';
        }

        function openSupportMenu() {
            const menu = ensureSupportMenu();
            positionSupportMenu();
            menu.classList.add('active');
            supportBtn?.setAttribute('aria-expanded', 'true');
        }

        function closeSupportMenu() {
            if (!supportMenu) return;
            supportMenu.classList.remove('active');
            supportBtn?.setAttribute('aria-expanded', 'false');
        }

        if (supportBtn) {
            supportBtn.setAttribute('aria-haspopup', 'menu');
            supportBtn.setAttribute('aria-expanded', 'false');
            supportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const menu = ensureSupportMenu();
                const isActive = menu.classList.contains('active');
                if (isActive) closeSupportMenu(); else openSupportMenu();
            });
        }

        document.addEventListener('click', function(e) {
            if (supportMenu && supportMenu.classList.contains('active')) {
                const clickInsideMenu = supportMenu.contains(e.target);
                const clickOnBtn = supportBtn && supportBtn.contains(e.target);
                if (!clickInsideMenu && !clickOnBtn) closeSupportMenu();
            }
        });

        window.addEventListener('resize', function() {
            if (supportMenu && supportMenu.classList.contains('active')) positionSupportMenu();
        });

        window.addEventListener('scroll', function() {
            if (supportMenu && supportMenu.classList.contains('active')) positionSupportMenu();
        }, true);
        
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
            if (e.key === 'Escape') {
                closeSupportMenu();
            }
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                closeNav();
            }
        });
    }
})();
