// Supabase Configuration and Helper Functions
const SUPABASE_URL = 'https://njsjihfpggbpfdpdgzzx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qc2ppaGZwZ2dicGZkcGRnenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjI3NzYsImV4cCI6MjA4MDY5ODc3Nn0.JZ5vEAnxPiWjwb0aGnxEbM0pI-FQ6hvuH2iKHHFZR2k';

// Generic Supabase query function
async function supabaseQuery(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Supabase error: ${response.status} - ${error}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Supabase query error:', error);
        throw error;
    }
}

// Save user to Supabase
async function saveUser(userData) {
    const user = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password_hash: userData.password_hash,
        role: userData.role || 'customer',
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        created_at: new Date().toISOString()
    };

    try {
        const result = await supabaseQuery('users', {
            method: 'POST',
            body: JSON.stringify(user)
        });
        return result[0];
    } catch (error) {
        console.error('Error saving user:', error);
        // Return mock user if Supabase fails
        return { ...user, id: Date.now() };
    }
}

// Save user profile to Supabase
async function saveUserProfile(profileData) {
    const profile = {
        user_id: profileData.user_id,
        full_name: profileData.full_name,
        address: profileData.address,
        city: profileData.city,
        country: profileData.country || 'Ghana',
        postal_code: profileData.postal_code,
        avatar_url: profileData.avatar_url,
        date_of_birth: profileData.date_of_birth,
        gender: profileData.gender,
        preferred_network: profileData.preferred_network,
        metadata: profileData.metadata || {},
        created_at: new Date().toISOString()
    };

    try {
        const result = await supabaseQuery('user_profiles', {
            method: 'POST',
            body: JSON.stringify(profile)
        });
        return result[0];
    } catch (error) {
        console.error('Error saving user profile:', error);
        // Return mock profile if Supabase fails
        return { ...profile, id: Date.now() };
    }
}

// Update user profile
async function updateUserProfile(userId, profileData) {
    try {
        const result = await supabaseQuery(`user_profiles?user_id=eq.${userId}`, {
            method: 'PATCH',
            body: JSON.stringify({ ...profileData, updated_at: new Date().toISOString() })
        });
        return result[0];
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

// Get user by email
async function getUserByEmail(email) {
    try {
        const result = await supabaseQuery(`users?email=eq.${encodeURIComponent(email)}`);
        return result[0];
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// Get user profile by user_id
async function getUserProfile(userId) {
    try {
        const result = await supabaseQuery(`user_profiles?user_id=eq.${userId}`);
        return result[0];
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

// Save customer to Supabase
async function saveCustomer(customerData) {
    const customer = {
        full_name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        created_at: new Date().toISOString()
    };

    try {
        const result = await supabaseQuery('customers', {
            method: 'POST',
            body: JSON.stringify(customer)
        });
        return result[0];
    } catch (error) {
        console.error('Error saving customer:', error);
        // Return mock customer if Supabase fails
        return { ...customer, id: Date.now() };
    }
}

// Save order to Supabase
async function saveOrder(orderData) {
    const order = {
        customer_id: orderData.customer_id,
        network: orderData.network,
        package_name: orderData.package,
        phone_number: orderData.phone,
        email: orderData.email,
        amount: orderData.amount,
        status: orderData.status || 'pending',
        created_at: new Date().toISOString()
    };

    try {
        const result = await supabaseQuery('orders', {
            method: 'POST',
            body: JSON.stringify(order)
        });
        return result[0];
    } catch (error) {
        console.error('Error saving order:', error);
        // Return mock order if Supabase fails
        return { ...order, id: Date.now() };
    }
}

// Save transaction to Supabase
async function saveTransaction(transactionData) {
    const transaction = {
        order_id: transactionData.order_id,
        reference: transactionData.reference,
        amount: transactionData.amount,
        status: transactionData.status,
        payment_method: transactionData.payment_method || 'paystack',
        metadata: transactionData.metadata || {},
        created_at: new Date().toISOString()
    };

    try {
        const result = await supabaseQuery('transactions', {
            method: 'POST',
            body: JSON.stringify(transaction)
        });
        return result[0];
    } catch (error) {
        console.error('Error saving transaction:', error);
        // Return mock transaction if Supabase fails
        return { ...transaction, id: Date.now() };
    }
}

// Update order status
async function updateOrderStatus(orderId, status) {
    try {
        const result = await supabaseQuery(`orders?id=eq.${orderId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status, updated_at: new Date().toISOString() })
        });
        return result[0];
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
}

// Get all orders (for admin)
async function getAllOrders() {
    try {
        return await supabaseQuery('orders?order=created_at.desc');
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

// Get all customers (for admin)
async function getAllCustomers() {
    try {
        return await supabaseQuery('customers?order=created_at.desc');
    } catch (error) {
        console.error('Error fetching customers:', error);
        return [];
    }
}

// Get all transactions (for admin)
async function getAllTransactions() {
    try {
        return await supabaseQuery('transactions?order=created_at.desc');
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

// Get user's orders by email
async function getUserOrders(email) {
    try {
        return await supabaseQuery(`orders?email=eq.${encodeURIComponent(email)}&order=created_at.desc`);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        return [];
    }
}
