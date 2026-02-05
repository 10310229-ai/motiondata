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

        // Update sidebar info
        document.getElementById('profileUserName').textContent = currentUser.name || currentUser.email;
        document.getElementById('profileUserEmail').textContent = currentUser.email;

        // Update avatar initials
        const avatarCircle = document.getElementById('avatarCircle');
        const initials = (currentUser.name || currentUser.email)
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        avatarCircle.innerHTML = initials;

        // Load profile form
        document.getElementById('editName').value = currentUser.name || '';
        document.getElementById('editEmail').value = currentUser.email || '';
        document.getElementById('editPhone').value = currentUser.phone || '';
    }

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
            const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
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

        ordersContainer.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <h4>${order.network} - ${order.package_name || order.packageName}</h4>
                    <span class="order-status ${order.status}">${order.status || 'completed'}</span>
                </div>
                <div class="order-details">
                    <p><strong>Phone:</strong> ${order.phone_number || order.phoneNumber}</p>
                    <p><strong>Amount:</strong> GHS ${order.amount}</p>
                    <p><strong>Date:</strong> ${new Date(order.created_at || order.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');
    }

    // Initialize
    if (checkAuth()) {
        loadUserProfile();
        loadUserOrders();
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
    });

})();
