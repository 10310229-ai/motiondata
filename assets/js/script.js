// Enhanced JS: mobile nav, smooth scroll, FAQ accordion, contact form stub, and utilities
document.addEventListener('DOMContentLoaded', () => {
        // Mobile nav toggle with backdrop, scroll-lock, animated icon and focus trap
        const toggle = document.getElementById('mobileMenuToggle');
        const mainNav = document.getElementById('mainNav');
        const sidebarCloseBtn = document.querySelector('.sidebar-close');
        let navBackdrop = null;
        let focusable = [];
        let firstFocusable = null;
        let lastFocusable = null;

        function createBackdrop(){
            if (navBackdrop) return navBackdrop;
            navBackdrop = document.createElement('div');
            navBackdrop.className = 'nav-backdrop';
            document.body.appendChild(navBackdrop);
            // allow fade-in
            requestAnimationFrame(()=> navBackdrop.classList.add('show'));
            return navBackdrop;
        }

        function removeBackdrop(){
            if (!navBackdrop) return;
            navBackdrop.classList.remove('show');
            setTimeout(()=>{ navBackdrop?.remove(); navBackdrop = null; }, 220);
        }

        function lockScroll(){ document.body.classList.add('no-scroll'); }
        function unlockScroll(){ document.body.classList.remove('no-scroll'); }

        function setupFocusables(){
            focusable = Array.from(mainNav.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])'))
                .filter(el => !el.hasAttribute('disabled'));
            firstFocusable = focusable[0] || null;
            lastFocusable = focusable[focusable.length - 1] || null;
        }

        function trapTab(e){
            if (e.key !== 'Tab') return;
            if (!firstFocusable || !lastFocusable) return;
            if (e.shiftKey){
                if (document.activeElement === firstFocusable){ e.preventDefault(); lastFocusable.focus(); }
            } else {
                if (document.activeElement === lastFocusable){ e.preventDefault(); firstFocusable.focus(); }
            }
        }

        function openNav(){
            if (!mainNav) return;
            mainNav.classList.add('open');
            toggle.classList.add('opened');
            toggle.setAttribute('aria-expanded', 'true');
            // change icon from bars to times if using FontAwesome
            const icon = toggle.querySelector('i');
            if (icon && icon.classList.contains('fa-bars')){ icon.classList.remove('fa-bars'); icon.classList.add('fa-times'); }
            createBackdrop()?.addEventListener('click', closeNav);
            lockScroll();
            setupFocusables();
            firstFocusable?.focus();
            document.addEventListener('keydown', trapTab);
        }

        function closeNav(){
            if (!mainNav) return;
            mainNav.classList.remove('open');
            toggle.classList.remove('opened');
            toggle.setAttribute('aria-expanded', 'false');
            const icon = toggle.querySelector('i');
            if (icon && icon.classList.contains('fa-times')){ icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
            removeBackdrop();
            unlockScroll();
            toggle.focus();
            document.removeEventListener('keydown', trapTab);
        }

        if (toggle && mainNav) {
                toggle.addEventListener('click', () => {
                                const opened = mainNav.classList.contains('open');
                                if (opened) closeNav(); else openNav();
                });

                // Close menu when any nav link is clicked (mobile behavior)
                mainNav.querySelectorAll('a').forEach(a=>{
                    a.addEventListener('click', (e)=>{
                        // if link is an internal anchor or a page navigation, close the menu
                        if (mainNav.classList.contains('open')) setTimeout(()=> closeNav(), 60);
                    });
                });
        }

        // Dedicated close button inside the sidebar (mobile)
        if (sidebarCloseBtn) {
            sidebarCloseBtn.addEventListener('click', () => {
                if (mainNav.classList.contains('open')) closeNav();
            });
        }

    // Close mobile nav on outside click (keep as a fallback)
    document.addEventListener('click', (e) => {
        if (!mainNav || !toggle) return;
        if (!mainNav.classList.contains('open')) return;
        if (!mainNav.contains(e.target) && !toggle.contains(e.target)) closeNav();
    });

        // Close nav with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                    if (mainNav && mainNav.classList.contains('open')) {
                        closeNav();
                    }
                }
        });

        // Ensure mobile menu state resets when resizing to desktop widths
        window.addEventListener('resize', () => {
            if (!mainNav || !toggle) return;
            if (window.innerWidth > 820 && mainNav.classList.contains('open')) closeNav();
        });

    // Greeting based on time
    const greetingEl = document.getElementById('greeting');
    if (greetingEl) {
        // Always show a single welcome message regardless of the time of day
        greetingEl.textContent = 'WELCOME';
    }

    // Smooth scroll for internal anchors
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const el = document.querySelector(href);
                if (el) el.scrollIntoView({behavior:'smooth',block:'start'});
            }
        });
    });

    // Join  button
    const joinWhatsapp = document.getElementById('joinWhatsapp');
    if (joinWhatsapp) {
        joinWhatsapp.addEventListener('click', () => {
            window.open('https://chat.whatsapp.com/IsndSkTdg4a25K8YJycLi5', '_blank');
        });
    }

    // FAQ accordion
    document.querySelectorAll('.faq .item .question').forEach(q => {
        q.addEventListener('click', () => {
            const item = q.closest('.item');
            const ans = item.querySelector('.answer');
            const opened = ans.style.display === 'block';
            document.querySelectorAll('.faq .item .answer').forEach(a => a.style.display = 'none');
            if (!opened) ans.style.display = 'block';
        });
    });

    // Contact form handler (enhanced)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        // debounce utility
        function debounce(fn, wait=250){ let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); }; }
        // floating label 'filled' toggles
        const formFields = contactForm.querySelectorAll('.form-field');
        formFields.forEach(ff => {
            const input = ff.querySelector('input,textarea');
            if (!input) return;
            const toggle = () => {
                if (input.value && input.value.length) ff.classList.add('filled'); else ff.classList.remove('filled');
            };
            input.addEventListener('input', toggle);
            input.addEventListener('blur', toggle);
            // init
            toggle();
        });
        const errorEl = document.getElementById('contactError');
        const progress = document.getElementById('contactProgress');
        const progressBar = document.getElementById('contactProgressBar');
        const cancelBtn = document.getElementById('contactCancel');
        const successPanel = document.getElementById('contactSuccess');
        const successClose = document.getElementById('contactSuccessClose');

        let uploadTimer = null;

        function setError(msg){
            if (!errorEl) return;
            if (!msg) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
            else { errorEl.style.display = 'block'; errorEl.textContent = msg; }
        }

    function fakeUpload(file){
            return new Promise((resolve, reject) => {
                if (!file) return resolve(null);
                const sizeMB = file.size / (1024*1024);
                if (sizeMB > 10) return reject(new Error('File too large (max 10MB)'));
                let progress = 0;
                progressBar.style.width = '0%';
                progress.parentElement.style.display = 'block';
                uploadTimer = setInterval(()=>{
                    progress += 10 + Math.random()*15;
                    if (progress > 100) progress = 100;
                    progressBar.style.width = progress + '%';
                    if (progress >= 100) {
                        clearInterval(uploadTimer); uploadTimer = null; setTimeout(()=>{ progress.parentElement.style.display = 'none'; resolve({url:'/_demo/'+file.name}); }, 350);
                    }
                }, 250);
                cancelBtn.style.display = 'inline-block';
            });
        }

    cancelBtn?.addEventListener('click', () => {
            if (uploadTimer) { clearInterval(uploadTimer); uploadTimer = null; }
            progressBar.style.width = '0%';
            progress.style.display = 'none';
            cancelBtn.style.display = 'none';
            setError('Upload canceled');
        });

    contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            setError('');
            const name = contactForm.name?.value?.trim();
            const email = contactForm.email?.value?.trim();
            const phone = contactForm.phone?.value?.trim();
            const message = contactForm.message?.value?.trim();
            const fileInput = document.getElementById('contactFile');
            const file = fileInput?.files?.[0] || null;
            const subscribe = document.getElementById('contactSubscribe')?.checked;

            // basic validation
            if (!name) return setError('Please provide your name');
            if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError('Please provide a valid email');
            if (!message || message.length < 10) return setError('Please provide a longer message (10+ chars)');

            // disable form
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true; submitBtn.textContent = 'Sending...';

            // simulate upload then save
            fakeUpload(file).then((uploadInfo) => {
                // demo storage: push to localStorage
                try {
                    const existing = JSON.parse(localStorage.getItem('md_contacts') || '[]');
                    existing.push({name,email,phone,message,subscribe,uploaded:uploadInfo?.url||null,ts:Date.now()});
                    localStorage.setItem('md_contacts', JSON.stringify(existing));
                } catch (err) { console.warn(err); }

                // analytics stub
                console.info('contact:sent', {email,subscribe});

                showToast('Message sent — we will reply shortly');
                contactForm.reset();
                submitBtn.disabled = false; submitBtn.textContent = 'Send Message';

                // show success panel (animated)
                if (successPanel) {
                    successPanel.classList.remove('hidden'); successPanel.classList.add('show'); successPanel.style.display = 'block';
                    successPanel.scrollIntoView({behavior:'smooth'}); successClose?.focus();
                    // auto-hide after 8s
                    setTimeout(()=>{ if (successPanel) { successPanel.classList.remove('show'); successPanel.classList.add('hidden'); setTimeout(()=>{ successPanel.style.display='none'; }, 300); } }, 8000);
                }
            }).catch(err => {
                console.error(err); setError(err.message || 'Could not send message');
                submitBtn.disabled = false; submitBtn.textContent = 'Send Message';
            });
        });

        successClose?.addEventListener('click', () => {
            if (successPanel) { successPanel.classList.remove('show'); successPanel.classList.add('hidden'); setTimeout(()=>{ successPanel.style.display='none'; }, 300); }
        });

        // live validation (debounced)
        const emailInput = document.getElementById('contactEmail');
        const messageInput = document.getElementById('contactMessage');
        const nameInput = document.getElementById('contactName');
        const errEl = document.getElementById('contactError');
        const validateField = debounce(()=>{
            if (!emailInput || !messageInput) return;
            const eVal = emailInput.value.trim();
            if (eVal && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eVal)) { errEl.textContent = 'Please enter a valid email'; errEl.style.display='block'; errEl.classList.add('shake'); setTimeout(()=>errEl.classList.remove('shake'),400); }
            else { errEl.textContent=''; errEl.style.display='none'; }
        }, 300);
        emailInput?.addEventListener('input', validateField);
        messageInput?.addEventListener('input', debounce(()=>{ if (messageInput.value.trim().length>0) errEl.style.display='none'; },200));

        // scroll-to-top button
        const scrollTopBtn = document.getElementById('scrollTop');
        function checkScroll(){ if (window.scrollY > 240) scrollTopBtn?.classList.add('show'); else scrollTopBtn?.classList.remove('show'); }
        window.addEventListener('scroll', debounce(checkScroll, 80));
        scrollTopBtn?.addEventListener('click', ()=> window.scrollTo({top:0,behavior:'smooth'}));
    }

    // Newsletter subscribe (footer)
    const newsletter = document.getElementById('newsletterForm');
    if (newsletter) {
        newsletter.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletter.querySelector('input[name="email"]').value;
            console.log('Newsletter subscribe', email);
            showToast('Thanks — you are now subscribed.');
            newsletter.reset();
        });
    }

    // Stats count-up animation when scrolled into view
    (function(){
        const statEls = document.querySelectorAll('.stat-value[data-target]');
        if (!statEls || statEls.length === 0) return;

        function animateValue(el, start, end, duration, decimals, suffix) {
            let startTime = null;
            const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const value = start + (end - start) * progress;
                el.textContent = (decimals ? value.toFixed(decimals) : Math.round(value)) + (suffix || '');
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const target = parseFloat(el.getAttribute('data-target')) || 0;
                const suffix = el.getAttribute('data-suffix') || '';
                const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
                animateValue(el, 0, target, 1200, decimals, suffix);
                obs.unobserve(el);
            });
        }, { threshold: 0.35 });

        statEls.forEach(el => {
            el.textContent = '0' + (el.getAttribute('data-suffix') || '');
            observer.observe(el);
        });
    })();

    // Generic reveal-on-scroll for sections with staggered children
    (function(){
        const groups = document.querySelectorAll('.reveal-on-scroll');
        if (!groups || groups.length === 0) return;

        const gObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const group = entry.target;
                // add animate class to group (CSS handles final state)
                group.classList.add('animate');

                // Stagger any children that have .reveal-child (for pronounced stagger, add small delays)
                const children = Array.from(group.querySelectorAll('.reveal-child'));
                children.forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 120);
                });

                obs.unobserve(group);
            });
        }, { threshold: 0.18 });

        groups.forEach(g => gObserver.observe(g));
    })();

    // Team member bio toggle (click or keyboard)
    (function(){
        const members = document.querySelectorAll('.team-member');
        members.forEach(mem => {
            const btn = mem.querySelector('button');
            if (!btn) return;
            const toggle = () => {
                const expanded = mem.classList.toggle('expanded');
                btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            };
            btn.addEventListener('click', toggle);
            mem.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
        });
    })();

    // Hero entrance animation: add .animate when hero scrolls into view
    (function(){
        const hero = document.querySelector('.hero');
        if (!hero) return;

        // If hero is already visible on load, animate immediately
        const rect = hero.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight)) {
            hero.classList.add('animate');
            return;
        }

        const hObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('animate');
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.12 });

        hObserver.observe(hero);
    })();

    // Auth System
    const authModal = document.getElementById('authModal');
    const showAuthBtn = document.getElementById('showAuthBtn');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authMessage = document.getElementById('authMessage');
    const authPrompt = document.getElementById('authPrompt');
    const userProfile = document.getElementById('userProfile');
    const logoutBtn = document.getElementById('logoutBtn');

    // Check if user is logged in
    function checkAuth() {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        
        // Only update UI if elements exist on the page
        if (authPrompt && userProfile) {
            if (user) {
                authPrompt.style.display = 'none';
                userProfile.style.display = 'block';
                if (document.getElementById('userName')) document.getElementById('userName').textContent = user.name;
                if (document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
                
                // Update mobile navigation to show user info
                updateMobileNavForLoggedInUser(user);
            } else {
                authPrompt.style.display = 'block';
                userProfile.style.display = 'none';
                
                // Update mobile navigation to show login/signup
                updateMobileNavForLoggedOutUser();
            }
        }
        
        return user;
    }
    
    // Update mobile navigation for logged-in users
    function updateMobileNavForLoggedInUser(user) {
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        const mobileSignupBtn = document.getElementById('mobileSignupBtn');
        
        if (mobileLoginBtn && mobileSignupBtn) {
            // Replace login/signup with user profile and logout
            mobileLoginBtn.innerHTML = `<i class="fas fa-user-circle"></i><span>${user.name}</span>`;
            mobileLoginBtn.style.pointerEvents = 'none';
            mobileLoginBtn.style.opacity = '0.7';
            
            mobileSignupBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Logout</span>';
            mobileSignupBtn.id = 'mobileLogoutBtn';
            mobileSignupBtn.onclick = function(e) {
                e.preventDefault();
                localStorage.removeItem('currentUser');
                checkAuth();
                const sidebar = document.getElementById('mobileNavSidebar');
                const overlay = document.getElementById('mobileNavOverlay');
                if (sidebar) sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = '';
                showToast('Logged out successfully');
            };
        }
    }
    
    // Update mobile navigation for logged-out users
    function updateMobileNavForLoggedOutUser() {
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        
        if (mobileLogoutBtn) {
            // Restore login button
            if (mobileLoginBtn) {
                mobileLoginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Login</span>';
                mobileLoginBtn.style.pointerEvents = 'auto';
                mobileLoginBtn.style.opacity = '1';
            }
            
            // Restore signup button
            mobileLogoutBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>Sign Up</span>';
            mobileLogoutBtn.id = 'mobileSignupBtn';
            mobileLogoutBtn.onclick = null;
        }
    }

    // Show auth modal
    if (showAuthBtn) {
        showAuthBtn.addEventListener('click', () => {
            authModal.classList.add('active');
            closeNav(); // Close sidebar
        });
    }

    // Close auth modal
    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', () => {
            authModal.classList.remove('active');
        });
    }

    // Close modal on backdrop click
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                authModal.classList.remove('active');
            }
        });
    }

    // Auth tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            authForms.forEach(form => {
                if (form.id === tabName + 'Form') {
                    form.classList.add('active');
                } else {
                    form.classList.remove('active');
                }
            });
            authMessage.classList.remove('show');
        });
    });

    // Show message
    function showAuthMessage(msg, type) {
        authMessage.textContent = msg;
        authMessage.className = 'auth-message ' + type + ' show';
        setTimeout(() => authMessage.classList.remove('show'), 5000);
    }

    // Login handler (only for pages with loginEmail/loginPassword elements, not admin)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Check if login elements exist (skip on admin page)
            const emailInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');
            
            if (!emailInput || !passwordInput) {
                console.log('Login elements not found - skipping (admin page uses different IDs)');
                return;
            }
            
            const emailOrPhone = emailInput.value.trim();
            const password = passwordInput.value;

            // Show loading
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

            try {
                // Check Supabase first
                const SUPABASE_URL = 'https://njsjihfpggbpfdpdgzzx.supabase.co';
                const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qc2ppaGZwZ2dicGZkcGRnenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjI3NzYsImV4cCI6MjA4MDY5ODc3Nn0.JZ5vEAnxPiWjwb0aGnxEbM0pI-FQ6hvuH2iKHHFZR2k';

                // Determine if input is email or phone
                const isEmail = emailOrPhone.includes('@');
                const searchParam = isEmail ? `email=eq.${encodeURIComponent(emailOrPhone)}` : `phone=eq.${encodeURIComponent(emailOrPhone)}`;

                const response = await fetch(`${SUPABASE_URL}/rest/v1/users?${searchParam}`, {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                });

                let user = null;
                if (response.ok) {
                    const users = await response.json();
                    if (users.length > 0) {
                        const dbUser = users[0];
                        if (atob(dbUser.password_hash) === password) {
                            user = {
                                id: dbUser.id,
                                name: dbUser.name,
                                email: dbUser.email,
                                phone: dbUser.phone
                            };
                        }
                    }
                }

                // Fallback to localStorage
                if (!user) {
                    const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                    const localUser = localUsers.find(u => 
                        (isEmail && u.email === emailOrPhone) || 
                        (!isEmail && u.phone === emailOrPhone)
                    );
                    
                    if (localUser && atob(localUser.password) === password) {
                        user = localUser;
                    }
                }

                if (!user) {
                    throw new Error('Invalid email/phone or password');
                }

                localStorage.setItem('currentUser', JSON.stringify(user));
                
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
                submitBtn.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
                
                showAuthMessage('Login successful!', 'success');
                setTimeout(() => {
                    authModal.classList.remove('active');
                    loginForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.style.background = '';
                    checkAuth();
                }, 1500);

            } catch (error) {
                console.error('Login error:', error);
                showAuthMessage(error.message || 'Login failed. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Signup handler
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const phone = document.getElementById('signupPhone').value.trim();
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;

            if (password !== confirmPassword) {
                showAuthMessage('Passwords do not match', 'error');
                return;
            }

            if (password.length < 6) {
                showAuthMessage('Password must be at least 6 characters', 'error');
                return;
            }

            if (!/^0\d{9}$/.test(phone)) {
                showAuthMessage('Please enter a valid Ghana phone number', 'error');
                return;
            }

            // Show loading
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

            try {
                // Check if email or phone already exists in localStorage
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                if (users.find(u => u.email === email)) {
                    throw new Error('Email already registered. Please login instead.');
                }
                if (users.find(u => u.phone === phone)) {
                    throw new Error('Phone number already registered. Please login instead.');
                }
                
                // Check if email or phone exists in Supabase
                const SUPABASE_URL = 'https://njsjihfpggbpfdpdgzzx.supabase.co';
                const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qc2ppaGZwZ2dicGZkcGRnenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjI3NzYsImV4cCI6MjA4MDY5ODc3Nn0.JZ5vEAnxPiWjwb0aGnxEbM0pI-FQ6hvuH2iKHHFZR2k';
                
                try {
                    const checkEmail = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                        }
                    });
                    
                    if (checkEmail.ok) {
                        const existingUsers = await checkEmail.json();
                        if (existingUsers.length > 0) {
                            throw new Error('Email already registered. Please login instead.');
                        }
                    }
                } catch (checkError) {
                    console.warn('Could not check existing users in Supabase:', checkError);
                }

                const newUser = {
                    name,
                    email,
                    phone,
                    password_hash: btoa(password), // Simple encoding (use proper hashing in production)
                    created_at: new Date().toISOString()
                };

                let savedUserId = Date.now().toString();
                
                // Try to save to Supabase (may fail if RLS policies aren't set)
                try {
                    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(newUser)
                    });

                    if (response.ok) {
                        const savedUser = await response.json();
                        savedUserId = savedUser[0]?.id || savedUserId;
                        console.log('User saved to Supabase successfully');
                    } else {
                        const errorText = await response.text();
                        console.warn('Supabase save failed, using localStorage:', errorText);
                        if (errorText.includes('duplicate') || errorText.includes('unique')) {
                            throw new Error('Email already registered');
                        }
                    }
                } catch (supabaseError) {
                    console.warn('Supabase error, continuing with localStorage:', supabaseError);
                }

                // Always save to localStorage as primary/backup
                users.push({ ...newUser, password: newUser.password_hash, id: savedUserId });
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem('currentUser', JSON.stringify({ id: savedUserId, name, email, phone }));

                submitBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
                submitBtn.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
                
                showAuthMessage('Account created successfully!', 'success');
                setTimeout(() => {
                    authModal.classList.remove('active');
                    signupForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.style.background = '';
                    checkAuth();
                }, 1500);

            } catch (error) {
                console.error('Signup error:', error);
                showAuthMessage(error.message || 'Failed to create account. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            checkAuth();
            closeNav();
            showToast('Logged out successfully');
        });
    }

    // Password visibility toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        if (btn && typeof btn.addEventListener === 'function') {
            btn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = this.querySelector('i');
                
                if (input && icon) {
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        input.type = 'password';
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                }
            });
        }
    });

    // Forgot password link handler
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const verifyResetCodeForm = document.getElementById('verifyResetCodeForm');
    const backToLoginLink = document.getElementById('backToLoginLink');
    const backToLoginFromVerify = document.getElementById('backToLoginFromVerify');

    if (forgotPasswordLink && forgotPasswordForm) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.remove('active');
            forgotPasswordForm.classList.add('active');
        });
    }

    if (backToLoginLink && loginForm) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotPasswordForm.classList.remove('active');
            loginForm.classList.add('active');
        });
    }

    if (backToLoginFromVerify && loginForm) {
        backToLoginFromVerify.addEventListener('click', (e) => {
            e.preventDefault();
            verifyResetCodeForm.classList.remove('active');
            loginForm.classList.add('active');
        });
    }

    // Forgot password form handler
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value.trim();
            
            const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            try {
                const SUPABASE_URL = 'https://njsjihfpggbpfdpdgzzx.supabase.co';
                const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qc2ppaGZwZ2dicGZkcGRnenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjI3NzYsImV4cCI6MjA4MDY5ODc3Nn0.JZ5vEAnxPiWjwb0aGnxEbM0pI-FQ6hvuH2iKHHFZR2k';

                // Check if email exists
                const response = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                });

                if (response.ok) {
                    const users = await response.json();
                    if (users.length === 0) {
                        throw new Error('No account found with this email');
                    }
                }

                // Generate 6-digit reset code
                const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
                
                // Store reset code in sessionStorage (expires when browser closes)
                sessionStorage.setItem('resetCode', resetCode);
                sessionStorage.setItem('resetEmail', email);
                sessionStorage.setItem('resetCodeTime', Date.now().toString());

                showAuthMessage(`Reset code: ${resetCode} (Note: Email sending not configured. Use this code.)`, 'success');
                
                // Switch to verification form
                setTimeout(() => {
                    forgotPasswordForm.classList.remove('active');
                    verifyResetCodeForm.classList.add('active');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }, 2000);

            } catch (error) {
                console.error('Password reset error:', error);
                showAuthMessage(error.message || 'Failed to send reset code', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Verify reset code and change password handler
    if (verifyResetCodeForm) {
        verifyResetCodeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('resetCode').value.trim();
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            if (newPassword !== confirmNewPassword) {
                showAuthMessage('Passwords do not match', 'error');
                return;
            }

            if (newPassword.length < 6) {
                showAuthMessage('Password must be at least 6 characters', 'error');
                return;
            }

            const storedCode = sessionStorage.getItem('resetCode');
            const storedEmail = sessionStorage.getItem('resetEmail');
            const codeTime = parseInt(sessionStorage.getItem('resetCodeTime'));

            // Check if code is expired (15 minutes)
            if (Date.now() - codeTime > 15 * 60 * 1000) {
                showAuthMessage('Reset code has expired. Please request a new one.', 'error');
                verifyResetCodeForm.classList.remove('active');
                forgotPasswordForm.classList.add('active');
                return;
            }

            if (code !== storedCode) {
                showAuthMessage('Invalid reset code', 'error');
                return;
            }

            const submitBtn = verifyResetCodeForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

            try {
                const SUPABASE_URL = 'https://njsjihfpggbpfdpdgzzx.supabase.co';
                const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qc2ppaGZwZ2dicGZkcGRnenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjI3NzYsImV4cCI6MjA4MDY5ODc3Nn0.JZ5vEAnxPiWjwb0aGnxEbM0pI-FQ6hvuH2iKHHFZR2k';

                // Update password in Supabase
                const hashedPassword = btoa(newPassword);
                const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(storedEmail)}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ password_hash: hashedPassword })
                });

                if (!updateResponse.ok) {
                    throw new Error('Failed to update password');
                }

                // Update localStorage if exists
                const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const userIndex = localUsers.findIndex(u => u.email === storedEmail);
                if (userIndex !== -1) {
                    localUsers[userIndex].password = hashedPassword;
                    localStorage.setItem('users', JSON.stringify(localUsers));
                }

                // Clear reset data
                sessionStorage.removeItem('resetCode');
                sessionStorage.removeItem('resetEmail');
                sessionStorage.removeItem('resetCodeTime');

                submitBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
                submitBtn.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
                
                showAuthMessage('Password reset successful! You can now login.', 'success');
                
                setTimeout(() => {
                    verifyResetCodeForm.classList.remove('active');
                    loginForm.classList.add('active');
                    verifyResetCodeForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.style.background = '';
                }, 2000);

            } catch (error) {
                console.error('Password reset error:', error);
                showAuthMessage(error.message || 'Failed to reset password', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Initialize auth state
    checkAuth();

    // Hero Slideshow
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        
        function nextSlide() {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }
        
        // Change slide every 5 seconds
        setInterval(nextSlide, 5000);
    }
});

function selectService(name) {
    showToast(`${name} selected`);
}

// Generic toast helper if not provided by toast.js
function showToast(msg, t = 3500) {
    if (window.showToast && window.showToast !== showToast) return window.showToast(msg, t);
    const el = document.createElement('div');
    el.className = 'motion-data-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.addEventListener('transitionend', () => el.remove()); }, t);
}
