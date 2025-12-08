// Admin Dashboard with Supabase Integration

// Load dashboard stats from Supabase
async function loadDashboardStats() {
    try {
        const [orders, customers, transactions] = await Promise.all([
            getAllOrders(),
            getAllCustomers(),
            getAllTransactions()
        ]);
        
        // Calculate stats
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
        const totalCustomers = customers.length;
        
        // Calculate success rate from transactions
        const successfulTransactions = transactions.filter(t => t.status === 'success').length;
        const successRate = transactions.length > 0 
            ? Math.round((successfulTransactions / transactions.length) * 100) 
            : 0;
        
        // Update stat values
        document.querySelectorAll('.stat-value').forEach((el, index) => {
            const statData = [
                { value: totalOrders.toLocaleString() },
                { value: `GHS ${totalRevenue.toFixed(2)}` },
                { value: totalCustomers.toLocaleString() },
                { value: `${successRate}%` }
            ];
            
            if (statData[index]) {
                el.textContent = statData[index].value;
            }
        });
    } catch (error) {
        console.error('Failed to load stats:', error);
        // Fallback to localStorage
        loadStatsFromLocalStorage();
    }
}

// Fallback to localStorage if Supabase fails
function loadStatsFromLocalStorage() {
    const orders = JSON.parse(localStorage.getItem('md_orders') || '[]');
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
    const successRate = 100; // Assume all completed orders are successful
    
    document.querySelectorAll('.stat-value').forEach((el, index) => {
        const statData = [
            { value: totalOrders.toLocaleString() },
            { value: `GHS ${totalRevenue.toFixed(2)}` },
            { value: totalOrders.toLocaleString() }, // Unique customers = orders for now
            { value: `${successRate}%` }
        ];
        
        if (statData[index]) {
            el.textContent = statData[index].value;
        }
    });
}

// Load recent orders for dashboard
async function loadRecentOrders() {
    try {
        let orders = await getAllOrders();
        
        // Fallback to localStorage if no Supabase orders
        if (!orders || orders.length === 0) {
            orders = JSON.parse(localStorage.getItem('md_orders') || '[]');
        }
        
        // Get only the 5 most recent
        orders = orders.slice(0, 5);
        
        const tbody = document.querySelector('#dashboard .admin-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.reference || order.id}</td>
                <td>${order.email || 'N/A'}</td>
                <td>${order.package_name || order.package}</td>
                <td>GHS ${parseFloat(order.amount || 0).toFixed(2)}</td>
                <td><span class="status-badge ${order.status}">${(order.status || 'pending').charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
                <td><button class="action-btn" onclick="viewOrder(${order.id})"><i class="fas fa-eye"></i></button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load recent orders:', error);
    }
}

// Load all orders for orders page
async function loadAllOrders(filters = {}) {
    try {
        let orders = await getAllOrders();
        
        // Fallback to localStorage if no Supabase orders
        if (!orders || orders.length === 0) {
            orders = JSON.parse(localStorage.getItem('md_orders') || '[]');
            // Convert localStorage format to match Supabase
            orders = orders.map(o => ({
                ...o,
                package_name: o.package,
                phone_number: o.phone || o.mobile,
                created_at: o.date
            }));
        }
        
        // Apply filters
        if (filters.status) {
            orders = orders.filter(o => o.status === filters.status);
        }
        if (filters.network) {
            orders = orders.filter(o => o.network === filters.network);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            orders = orders.filter(o => 
                (o.email && o.email.toLowerCase().includes(search)) ||
                (o.phone_number && o.phone_number.includes(search)) ||
                (o.reference && o.reference.toLowerCase().includes(search))
            );
        }
        
        // Pagination
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const start = (page - 1) * limit;
        const end = start + limit;
        const totalPages = Math.ceil(orders.length / limit);
        const paginatedOrders = orders.slice(start, end);
        
        const tbody = document.querySelector('#orders .admin-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = paginatedOrders.map(order => {
            const date = order.created_at 
                ? new Date(order.created_at).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                })
                : 'N/A';
            
            return `
                <tr>
                    <td><input type="checkbox" data-order-id="${order.id}"></td>
                    <td>${order.reference || order.id}</td>
                    <td>${date}</td>
                    <td>${order.email || 'N/A'}</td>
                    <td>${order.phone_number || order.phone || 'N/A'}</td>
                    <td>${order.package_name || order.package}</td>
                    <td>GHS ${parseFloat(order.amount || 0).toFixed(2)}</td>
                    <td><span class="status-badge ${order.status}">${(order.status || 'pending').charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
                    <td>
                        <button class="action-btn" onclick="viewOrder(${order.id})"><i class="fas fa-eye"></i></button>
                        <button class="action-btn" onclick="editOrder(${order.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn danger" onclick="deleteOrder(${order.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Update pagination
        updatePagination(page, totalPages, orders.length);
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

// Update pagination display
function updatePagination(currentPage, totalPages, totalItems) {
    const paginationInfo = document.querySelector('.pagination-info');
    const paginationControls = document.querySelector('.pagination-controls');
    
    if (paginationInfo) {
        const start = ((currentPage - 1) * 10) + 1;
        const end = Math.min(currentPage * 10, totalItems);
        paginationInfo.textContent = `Showing ${start}-${end} of ${totalItems} orders`;
    }
    
    if (paginationControls) {
        let html = `<button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
        
        for (let i = 1; i <= Math.min(5, totalPages); i++) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        }
        
        if (totalPages > 5) {
            html += `<button class="pagination-btn">...</button>`;
            html += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
        }
        
        html += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
        
        paginationControls.innerHTML = html;
    }
}

// Load top packages
async function loadTopPackages() {
    try {
        let orders = await getAllOrders();
        
        if (!orders || orders.length === 0) {
            orders = JSON.parse(localStorage.getItem('md_orders') || '[]');
        }
        
        // Count packages
        const packageCounts = {};
        orders.forEach(order => {
            const pkg = order.package_name || order.package;
            const network = order.network;
            const key = `${network}-${pkg}`;
            
            if (!packageCounts[key]) {
                packageCounts[key] = {
                    name: pkg,
                    network: network,
                    sales: 0,
                    revenue: 0
                };
            }
            packageCounts[key].sales++;
            packageCounts[key].revenue += parseFloat(order.amount || 0);
        });
        
        // Convert to array and sort by sales
        const packages = Object.values(packageCounts)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);
        
        const packageList = document.querySelector('.package-list');
        if (!packageList) return;
        
        packageList.innerHTML = packages.map(pkg => {
            const networkClass = pkg.network.toLowerCase().replace(/\s+/g, '');
            return `
                <div class="package-item">
                    <div class="package-info">
                        <div class="package-icon ${networkClass}">
                            <i class="fas fa-mobile-alt"></i>
                        </div>
                        <div class="package-details">
                            <div class="package-name">${pkg.network} - ${pkg.name}</div>
                            <div class="package-sales">${pkg.sales} sales</div>
                        </div>
                    </div>
                    <div class="package-amount">GHS ${pkg.revenue.toFixed(2)}</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load top packages:', error);
    }
}

// Load customers
async function loadAllCustomers() {
    try {
        let customers = await getAllCustomers();
        
        if (!customers || customers.length === 0) {
            // Extract unique customers from orders
            const orders = JSON.parse(localStorage.getItem('md_orders') || '[]');
            const uniqueEmails = [...new Set(orders.map(o => o.email))];
            customers = uniqueEmails.map((email, idx) => {
                const userOrders = orders.filter(o => o.email === email);
                const firstOrder = userOrders[0];
                return {
                    id: idx + 1,
                    email: email,
                    full_name: firstOrder.name || 'N/A',
                    phone: firstOrder.phone || firstOrder.mobile || 'N/A',
                    created_at: firstOrder.date
                };
            });
        }
        
        const tbody = document.querySelector('#customers .admin-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = customers.map(customer => {
            const date = customer.created_at 
                ? new Date(customer.created_at).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                })
                : 'N/A';
            
            return `
                <tr>
                    <td>${customer.id}</td>
                    <td>${customer.full_name || 'N/A'}</td>
                    <td>${customer.email}</td>
                    <td>${customer.phone}</td>
                    <td>${date}</td>
                    <td>
                        <button class="action-btn" onclick="viewCustomer(${customer.id})"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load customers:', error);
    }
}

// Load transactions
async function loadAllTransactions() {
    try {
        let transactions = await getAllTransactions();
        
        if (!transactions || transactions.length === 0) {
            // Create from localStorage orders
            const orders = JSON.parse(localStorage.getItem('md_orders') || '[]');
            transactions = orders.map((order, idx) => ({
                id: idx + 1,
                reference: order.reference || order.id,
                amount: order.amount,
                status: 'success',
                payment_method: 'paystack',
                created_at: order.date
            }));
        }
        
        const tbody = document.querySelector('#transactions .admin-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = transactions.map(transaction => {
            const date = transaction.created_at 
                ? new Date(transaction.created_at).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : 'N/A';
            
            return `
                <tr>
                    <td>${transaction.reference}</td>
                    <td>GHS ${parseFloat(transaction.amount || 0).toFixed(2)}</td>
                    <td><span class="status-badge ${transaction.status}">${(transaction.status || 'pending').charAt(0).toUpperCase() + transaction.status.slice(1)}</span></td>
                    <td>${transaction.payment_method || 'paystack'}</td>
                    <td>${date}</td>
                    <td>
                        <button class="action-btn" onclick="viewTransaction('${transaction.reference}')"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load transactions:', error);
    }
}

// View order details
async function viewOrder(orderId) {
    try {
        const orders = await getAllOrders();
        const order = orders.find(o => o.id == orderId);
        
        if (!order) {
            alert('Order not found');
            return;
        }
        
        alert(`Order Details:\n\nID: ${order.id}\nReference: ${order.reference || 'N/A'}\nEmail: ${order.email}\nPhone: ${order.phone_number || order.phone}\nNetwork: ${order.network}\nPackage: ${order.package_name || order.package}\nAmount: GHS ${order.amount}\nStatus: ${order.status}\nDate: ${new Date(order.created_at).toLocaleString()}`);
    } catch (error) {
        console.error('Failed to load order:', error);
        alert('Failed to load order details');
    }
}

// Edit order
async function editOrder(orderId) {
    const newStatus = prompt('Enter new status (pending/processing/completed/cancelled):');
    if (!newStatus) return;
    
    try {
        await updateOrderStatus(orderId, newStatus.toLowerCase());
        alert('Order updated successfully');
        loadAllOrders(currentFilters);
    } catch (error) {
        console.error('Failed to update order:', error);
        alert('Failed to update order');
    }
}

// Delete order - Not recommended, but included for completeness
async function deleteOrder(orderId) {
    alert('Delete functionality disabled for data integrity. Use status update instead.');
}

// View customer
function viewCustomer(customerId) {
    alert('Customer details functionality - to be implemented');
}

// View transaction
function viewTransaction(reference) {
    alert(`Transaction Reference: ${reference}\n\nFull transaction details coming soon.`);
}

// Change page
let currentFilters = {};
function changePage(page) {
    currentFilters.page = page;
    loadAllOrders(currentFilters);
}

// Export functions to global scope
window.viewOrder = viewOrder;
window.editOrder = editOrder;
window.deleteOrder = deleteOrder;
window.viewCustomer = viewCustomer;
window.viewTransaction = viewTransaction;
window.changePage = changePage;
window.loadAllOrders = loadAllOrders;
window.loadAllCustomers = loadAllCustomers;
window.loadAllTransactions = loadAllTransactions;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is on admin page
    const adminContainer = document.querySelector('.admin-container');
    if (!adminContainer) return;
    
    // Load initial data for dashboard
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection && dashboardSection.classList.contains('active')) {
        loadDashboardStats();
        loadRecentOrders();
        loadTopPackages();
    }
    
    // Listen for section changes to load appropriate data
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            
            // Load data based on section
            setTimeout(() => {
                if (sectionId === 'dashboard') {
                    loadDashboardStats();
                    loadRecentOrders();
                    loadTopPackages();
                } else if (sectionId === 'orders') {
                    loadAllOrders();
                } else if (sectionId === 'customers') {
                    loadAllCustomers();
                } else if (sectionId === 'transactions') {
                    loadAllTransactions();
                }
            }, 100);
        });
    });
    
    // Apply filters button
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            const status = document.getElementById('filterStatus')?.value;
            const network = document.getElementById('filterNetwork')?.value;
            const search = document.getElementById('searchOrders')?.value;
            
            currentFilters = { status, network, search, page: 1 };
            loadAllOrders(currentFilters);
        });
    }
});
