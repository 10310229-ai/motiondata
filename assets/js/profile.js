// Profile Management Script
(function() {
    'use strict';

    const SUPABASE_URL = 'https://njsjihfpggbpfdpdgzzx.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qc2ppaGZwZ2dicGZkcGRnenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjI3NzYsImV4cCI6MjA4MDY5ODc3Nn0.JZ5vEAnxPiWjwb0aGnxEbM0pI-FQ6hvuH2iKHHFZR2k';

    let currentUser = null;

    // Check if user is logged in
    function checkAuth() {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            window.location.href = 'index.html';
            return null;
        }
        try {
            currentUser = JSON.parse(userData);
            return currentUser;
        } catch (error) {
            console.error('Error parsing user data:', error);
            window.location.href = 'index.html';
            return null;
        }
    }

    // Load user profile
    function loadUserProfile() {
        if (!currentUser) return;

        // Calculate initials for avatar
        const initials = (currentUser.name || currentUser.email)
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);

        // Update hero section
        const heroUserName = document.getElementById('heroProfileUserName');
        const heroUserEmail = document.getElementById('heroProfileUserEmail');
        const heroAvatar = document.getElementById('heroProfileAvatar');
        const memberSince = document.getElementById('memberSince');
        
        if (heroUserName) heroUserName.textContent = currentUser.name || currentUser.email;
        if (heroUserEmail) heroUserEmail.textContent = currentUser.email;
        if (heroAvatar) heroAvatar.innerHTML = initials;
        if (memberSince) {
            const joinDate = currentUser.created_at ? new Date(currentUser.created_at) : new Date();
            memberSince.textContent = `Member since ${joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
        }

        // Load profile form
        document.getElementById('editName').value = currentUser.name || '';
        document.getElementById('editEmail').value = currentUser.email || '';
        document.getElementById('editPhone').value = currentUser.phone || '';

        // Load preferences
        loadPreferences();
        
        // Update statistics
        updateOrderStatistics();
        
        // Update activity timeline
        updateActivityTimeline();
    }

    // Update order statistics
    async function updateOrderStatistics() {
        try {
            let userOrders = [];
            
            // Try to load from Supabase first
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?email=eq.${encodeURIComponent(currentUser.email)}`, {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                });

                if (response.ok) {
                    const supabaseOrders = await response.json();
                    if (supabaseOrders.length > 0) {
                        userOrders = supabaseOrders;
                    }
                }
            } catch (fetchError) {
                console.warn('Supabase unavailable:', fetchError.message);
            }

            // Fallback to localStorage
            if (userOrders.length === 0) {
                const localOrders = JSON.parse(localStorage.getItem('md_orders') || '[]');
                userOrders = localOrders.filter(order => order.email === currentUser.email);
            }
            
            const totalOrders = userOrders.length;
            const completedOrders = userOrders.filter(order => order.status === 'completed').length;
            const pendingOrders = userOrders.filter(order => order.status === 'pending' || order.status === 'processing').length;
            
            const totalOrdersEl = document.getElementById('totalOrders');
            const completedOrdersEl = document.getElementById('completedOrders');
            const pendingOrdersEl = document.getElementById('pendingOrders');
            
            if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
            if (completedOrdersEl) completedOrdersEl.textContent = completedOrders;
            if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
        } catch (error) {
            console.error('Error updating order statistics:', error);
        }
    }

    // Update activity timeline
    function updateActivityTimeline() {
        const timeline = document.querySelector('.activity-timeline');
        if (!timeline) return;

        const activities = [];
        
        // Add last login
        const lastLogin = localStorage.getItem('lastLoginTime');
        if (lastLogin) {
            activities.push({
                icon: 'fa-sign-in-alt',
                title: 'Logged In',
                description: 'You logged into your account',
                time: new Date(lastLogin)
            });
        }
        
        // Add account creation
        if (currentUser.created_at) {
            activities.push({
                icon: 'fa-user-plus',
                title: 'Account Created',
                description: 'Welcome to Motion Data Solutions',
                time: new Date(currentUser.created_at)
            });
        }
        
        // Add recent orders
        const userOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
        const recentOrders = userOrders
            .filter(order => order.userId === currentUser.id)
            .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
            .slice(0, 2);
        
        recentOrders.forEach(order => {
            activities.push({
                icon: 'fa-shopping-cart',
                title: `${order.network} Data Bundle`,
                description: `Ordered ${order.dataAmount || 'data bundle'} for ${order.phoneNumber}`,
                time: new Date(order.created_at || order.createdAt || Date.now())
            });
        });
        
        // Sort by time (newest first)
        activities.sort((a, b) => b.time - a.time);
        
        // Render activities (keep only top 4)
        timeline.innerHTML = activities.slice(0, 4).map(activity => {
            const timeAgo = getTimeAgo(activity.time);
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${activity.title}</h4>
                        <p>${activity.description}</p>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Get time ago string
    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
            }
        }
        
        return 'Just now';
    }

    // Load preferences
    function loadPreferences() {
        const preferences = JSON.parse(localStorage.getItem('userPreferences_' + currentUser.id) || '{}');
        
        // Load preferred network
        const preferredNetwork = document.getElementById('preferredNetwork');
        if (preferredNetwork && preferences.preferredNetwork) {
            preferredNetwork.value = preferences.preferredNetwork;
        }
        
        // Load notification settings
        const emailNotifications = document.getElementById('emailNotifications');
        const smsNotifications = document.getElementById('smsNotifications');
        const orderUpdates = document.getElementById('orderUpdates');
        const promotions = document.getElementById('promotions');
        
        if (emailNotifications) emailNotifications.checked = preferences.emailNotifications !== false;
        if (smsNotifications) smsNotifications.checked = preferences.smsNotifications !== false;
        if (orderUpdates) orderUpdates.checked = preferences.orderUpdates !== false;
        if (promotions) promotions.checked = preferences.promotions !== false;
    }

    // Save preferences
    function savePreferences() {
        const preferences = {
            preferredNetwork: document.getElementById('preferredNetwork').value,
            emailNotifications: document.getElementById('emailNotifications').checked,
            smsNotifications: document.getElementById('smsNotifications').checked,
            orderUpdates: document.getElementById('orderUpdates').checked,
            promotions: document.getElementById('promotions').checked
        };
        
        localStorage.setItem('userPreferences_' + currentUser.id, JSON.stringify(preferences));
        showToast('Preferences saved successfully!', 'success');
    }

    // Add save preferences button handler
    window.addEventListener('DOMContentLoaded', function() {
        const savePrefsBtn = document.getElementById('savePreferencesBtn');
        if (savePrefsBtn) {
            savePrefsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                savePreferences();
            });
        }
    });

    // Show message
    function showMessage(elementId, message, type = 'success') {
        const messageEl = document.getElementById(elementId);
        if (!messageEl) return;

        messageEl.textContent = message;
        messageEl.className = `profile-message ${type}`;
        messageEl.style.display = 'block';

        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    // Edit Profile Form
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('editName').value.trim();
            const email = document.getElementById('editEmail').value.trim();
            const phone = document.getElementById('editPhone').value.trim();

            const submitBtn = editProfileForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                // Update Supabase
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);

                    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(currentUser.email)}`, {
                        method: 'PATCH',
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({ 
                            name: name,
                            email: email,
                            phone: phone
                        }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!updateResponse.ok) {
                        console.warn('Supabase update failed');
                    }
                } catch (fetchError) {
                    console.warn('Supabase unavailable:', fetchError.message);
                }

                // Update localStorage
                const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const userIndex = localUsers.findIndex(u => u.email === currentUser.email);
                
                if (userIndex !== -1) {
                    localUsers[userIndex].name = name;
                    localUsers[userIndex].email = email;
                    localUsers[userIndex].phone = phone;
                    localStorage.setItem('users', JSON.stringify(localUsers));
                }

                // Update current user
                currentUser.name = name;
                currentUser.email = email;
                currentUser.phone = phone;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));

                // Reload profile display
                loadUserProfile();

                showMessage('profileMessage', 'Profile updated successfully!', 'success');
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }, 2000);

            } catch (error) {
                console.error('Profile update error:', error);
                showMessage('profileMessage', error.message || 'Failed to update profile', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Change Password Form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            if (newPassword !== confirmNewPassword) {
                showMessage('securityMessage', 'New passwords do not match', 'error');
                return;
            }

            if (newPassword.length < 6) {
                showMessage('securityMessage', 'Password must be at least 6 characters', 'error');
                return;
            }

            const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

            try {
                // Verify current password
                const hashedCurrentPassword = btoa(currentPassword);
                if (currentUser.password !== hashedCurrentPassword) {
                    throw new Error('Current password is incorrect');
                }

                const hashedNewPassword = btoa(newPassword);

                // Update Supabase
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);

                    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(currentUser.email)}`, {
                        method: 'PATCH',
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({ password_hash: hashedNewPassword }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);
                } catch (fetchError) {
                    console.warn('Supabase unavailable:', fetchError.message);
                }

                // Update localStorage
                const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const userIndex = localUsers.findIndex(u => u.email === currentUser.email);
                
                if (userIndex !== -1) {
                    localUsers[userIndex].password = hashedNewPassword;
                    localStorage.setItem('users', JSON.stringify(localUsers));
                }

                // Update current user
                currentUser.password = hashedNewPassword;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));

                showMessage('securityMessage', 'Password updated successfully!', 'success');
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Updated!';
                changePasswordForm.reset();

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }, 2000);

            } catch (error) {
                console.error('Password update error:', error);
                showMessage('securityMessage', error.message || 'Failed to update password', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            }
        });
    }

    // Section navigation
    const profileNavLinks = document.querySelectorAll('.profile-nav-link:not(.logout-link)');
    const profileSections = document.querySelectorAll('.profile-section');

    profileNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const sectionName = link.getAttribute('data-section');
            
            // Update active link
            profileNavLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show target section
            profileSections.forEach(section => {
                section.classList.remove('active');
            });
            
            const targetSection = document.getElementById(`${sectionName}Section`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });

    // Load user orders
    async function loadUserOrders() {
        const ordersContainer = document.getElementById('ordersContainer');
        if (!ordersContainer) return;

        try {
            // Try to load from Supabase
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?email=eq.${encodeURIComponent(currentUser.email)}&order=created_at.desc`, {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const orders = await response.json();
                    if (orders.length > 0) {
                        displayOrders(orders);
                        return;
                    }
                }
            } catch (fetchError) {
                console.warn('Supabase unavailable:', fetchError.message);
            }

            // Fallback to localStorage
            const localOrders = JSON.parse(localStorage.getItem('md_orders') || '[]');
            const userOrders = localOrders.filter(order => order.email === currentUser.email);
            
            if (userOrders.length > 0) {
                displayOrders(userOrders);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    function displayOrders(orders) {
        const ordersContainer = document.getElementById('ordersContainer');
        if (!ordersContainer) return;

        if (orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="orders-empty">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #22c55e; margin-bottom: 1rem;"></i>
                    <p>No orders yet</p>
                    <a href="services.html" class="btn btn-primary">Browse Data Bundles</a>
                </div>
            `;
            return;
        }

        ordersContainer.innerHTML = orders.map(order => {
            const orderDate = new Date(order.created_at || order.date || Date.now());
            const statusClass = order.status === 'completed' ? 'success' : order.status === 'pending' ? 'warning' : 'info';
            
            return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h4>${order.network || 'N/A'} - ${order.package_name || order.package || 'Data Bundle'}</h4>
                        <small style="color: #666;">Order #${order.reference || order.id || 'N/A'}</small>
                    </div>
                    <span class="order-status ${statusClass}">${(order.status || 'completed').toUpperCase()}</span>
                </div>
                <div class="order-details">
                    <p><strong>Phone:</strong> ${order.phone_number || order.phone || order.mobile || 'N/A'}</p>
                    <p><strong>Amount:</strong> GH₵ ${parseFloat(order.amount || 0).toFixed(2)}</p>
                    <p><strong>Date:</strong> ${orderDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                    ${order.reference ? `<p><strong>Reference:</strong> ${order.reference}</p>` : ''}
                </div>
            </div>
        `;
        }).join('');
    }

    // Initialize
    if (checkAuth()) {
        loadUserProfile();
        loadUserOrders();
        
        // Update last login time
        localStorage.setItem('lastLoginTime', new Date().toISOString());
    }

    // Password strength meter
    function checkPasswordStrength(password) {
        let strength = 0;
        const meter = document.getElementById('passwordStrength');
        const fill = meter ? meter.querySelector('.strength-fill') : null;
        const text = meter ? meter.querySelector('.strength-text strong') : null;
        
        if (!password || !meter) return;
        
        // Show meter
        meter.style.display = 'block';
        
        // Length check
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;
        
        // Character variety checks
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
        
        // Update UI
        fill.classList.remove('weak', 'medium', 'strong');
        
        if (strength <= 2) {
            fill.classList.add('weak');
            text.textContent = 'Weak';
            text.style.color = '#ef4444';
        } else if (strength <= 4) {
            fill.classList.add('medium');
            text.textContent = 'Medium';
            text.style.color = '#f59e0b';
        } else {
            fill.classList.add('strong');
            text.textContent = 'Strong';
            text.style.color = '#22c55e';
        }
    }

    // Password visibility toggle functionality
    document.addEventListener('DOMContentLoaded', function() {
        const toggleButtons = document.querySelectorAll('.toggle-password');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const targetInput = document.getElementById(targetId);
                const icon = this.querySelector('i');
                
                if (targetInput) {
                    if (targetInput.type === 'password') {
                        targetInput.type = 'text';
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        targetInput.type = 'password';
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                }
            });
        });
        
        // Add password strength checker
        const newPasswordInput = document.getElementById('newPassword');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', function() {
                checkPasswordStrength(this.value);
            });
        }
    });

})();
