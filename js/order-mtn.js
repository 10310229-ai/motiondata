// Dedicated MTN order logic (separate from other operator pages)

function showSuccessPopup(orderData = {}) {
  console.log('showSuccessPopup function called!');
  
  // Add notification automatically
  if (window.addOrderNotification) {
    window.addOrderNotification({
      title: 'MTN Order Placed Successfully',
      message: `Your ${orderData.package || 'data bundle'} order has been placed successfully. Delivery in progress.`,
      orderId: orderData.orderId || `MTN-${Date.now()}`,
      network: 'MTN',
      amount: orderData.amount || 'N/A'
    });
  }
  
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9998;';
  
  const popup = document.createElement('div');
  popup.className = 'success-popup';
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:linear-gradient(135deg,rgba(34,197,94,0.95),rgba(16,185,129,0.85));backdrop-filter:blur(20px);padding:3rem;border-radius:16px;border:2px solid rgba(132,204,22,0.4);width:90%;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,0.5);text-align:center;';
  popup.innerHTML = `
    <span class="popup-icon" style="font-size:4rem;margin-bottom:1rem;display:block;">✓</span>
    <h2 style="margin:0 0 1rem 0;color:#fff;font-size:1.8rem;font-weight:800;">Payment Successful!</h2>
    <p style="margin:0 0 1.5rem 0;color:#e0f2e0;font-size:1.1rem;">Your data bundle order has been placed successfully. Your bundle will be delivered to the recipient shortly.</p>
    <p style="margin:0 0 1.5rem 0;color:#fff;font-size:0.9rem;">Redirecting to homepage in <span id="countdown">8</span> seconds...</p>
    <button class="btn-popup" onclick="window.location.href='index.html'" style="background:#22c55e;color:#04261a;border:none;padding:0.8rem 2rem;border-radius:10px;font-weight:800;cursor:pointer;font-size:1rem;">Back to Home Now</button>
  `;
  
  document.body.appendChild(overlay);
  document.body.appendChild(popup);
  console.log('Popup and overlay added to page');
  
  // Auto-redirect countdown
  let secondsLeft = 8;
  const countdownElement = document.getElementById('countdown');
  const countdownInterval = setInterval(() => {
    secondsLeft--;
    if (countdownElement) {
      countdownElement.textContent = secondsLeft;
    }
    if (secondsLeft <= 0) {
      clearInterval(countdownInterval);
      window.location.href = 'index.html';
    }
  }, 1000);
}

// Expose function globally for testing
window.testPopup = showSuccessPopup;

console.log('MTN order script loaded successfully!');
console.log('Paystack library available:', typeof window.PaystackPop);

// Handle payment success - at global scope so Paystack onSuccess callback can access it
function handlePaymentSuccess(response, email, msisdn, pkg, price) {
    console.log('handlePaymentSuccess called with:', {response, email, msisdn, pkg, price});
    
    let savedOrderId = `MTN-${Date.now()}`;
    
    // Save to localStorage
    try {
      const order = {
        id: response.reference,
        reference: response.reference,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        email: email,
        phone: msisdn,
        mobile: msisdn,
        operator: 'MTN',
        network: 'MTN',
        package: pkg,
        amount: price,
        status: 'completed'
      };
      const orders = JSON.parse(localStorage.getItem('md_orders') || '[]');
      orders.push(order);
      localStorage.setItem('md_orders', JSON.stringify(orders));
      console.log('Order saved to localStorage');
      
      // Save to Supabase in background
      (async function(){
        try {
          console.log('💾 Saving to Supabase...');
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          
          // First, check if user exists or create one
          let user = await getUserByEmail(email);
          if (!user) {
            console.log('Creating new user...');
            user = await saveUser({
              name: currentUser.name || 'Guest Customer',
              email: email,
              phone: msisdn,
              password_hash: 'temp_' + Date.now(), // Temporary hash for guest users
              role: 'customer'
            });
            console.log('✅ User created:', user);
          } else {
            console.log('✅ Existing user found:', user);
          }
          
          console.log('Creating/updating customer...');
          const customer = await saveCustomer({name: user.name, email: email, phone: msisdn});
          console.log('✅ Customer saved:', customer);
          
          console.log('Creating order...');
          const savedOrder = await saveOrder({
            customer_id: customer.id, 
            network: 'MTN', 
            package_name: pkg,
            phone_number: msisdn, 
            email: email, 
            amount: price, 
            status: 'completed',
            reference: response.reference
          });
          console.log('✅ Order saved:', savedOrder);
          
          if (!savedOrder || !savedOrder.id) {
            throw new Error('Failed to save order - no order ID returned');
          }
          
          console.log('Creating transaction...');
          const transaction = await saveTransaction({order_id: savedOrder.id, reference: response.reference, amount: price, status: 'success', payment_method: 'paystack', metadata: {response: response}});
          console.log('✅ Transaction saved:', transaction);
          console.log('🎉 All data saved to Supabase successfully!');
        } catch(e) { 
          console.error('❌ Supabase save error:', e);
          console.error('Error details:', e.message, e.stack);
        }
      })();
    } catch(e) { console.error('Storage error:', e); }
    
    // Clear form fields
    try {
      document.getElementById('msisdn').value = '';
      document.getElementById('email').value = '';
      document.getElementById('packageSelectMTN').value = '';
      console.log('Form fields cleared');
    } catch(e) { console.error('Form clear error:', e); }
    
    // Prepare order payload and persist (best-effort) then redirect to receipt page
    console.log('Preparing receipt redirect...');
    const orderPayload = {
      id: response.reference,
      reference: response.reference,
      date: new Date().toISOString(),
      email: email,
      phone: msisdn,
      operator: 'MTN',
      package: pkg,
      amount: price,
      status: 'completed'
    };

    try {
      // Best-effort send to server before navigation
      if (navigator && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([JSON.stringify(orderPayload)], { type: 'application/json' });
        navigator.sendBeacon('/api/orders', blob);
        console.log('Beacon sent to /api/orders');
      }
    } catch (e) { console.warn('Beacon failed', e); }

    // Redirect to receipt page with query params
    const params = new URLSearchParams({ network: 'MTN', package: pkg, phone: msisdn, email: email, amount: price, reference: response.reference });
    window.location.href = 'receipt.html?' + params.toString();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function(){
  console.log('DOM loaded - initializing MTN order form');
  console.log('Paystack after DOM load:', typeof window.PaystackPop);
  // No auth required - users can order directly

  const packages = {
    '1GB': 5.50,'2GB': 10.50,'3GB': 15.00,'4GB': 20.00,'5GB': 25.00,'6GB': 30.00,'8GB': 40.00,'10GB': 48.00,'15GB': 70.00,'20GB': 90.00,'25GB': 113.00,'30GB': 132.00,'40GB': 173.00,'50GB': 211.00
  };

  const sel = document.getElementById('packageSelectMTN');
  Object.keys(packages).forEach(k=>{
    const opt = document.createElement('option'); opt.value = k; opt.textContent = `${k} ------- GHS${packages[k].toFixed(2)}`; sel.appendChild(opt);
  });

  function isValidEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  const mtnForm = document.getElementById('mtnForm');
  console.log('MTN Form element found:', !!mtnForm);
  
  if (!mtnForm) {
    console.error('ERROR: mtnForm element not found!');
    return;
  }

  // Verify Paystack is available
  if (!window.PaystackPop) {
    console.error('❌ CRITICAL: Paystack library failed to load!');
    console.error('Check if https://js.paystack.co/v1/inline.js is blocked');
  } else {
    console.log('✅ Paystack library loaded successfully');
  }

  mtnForm.addEventListener('submit', function(evt){
    // Prevent default submission - open Paystack inline (LIVE key)
    evt.preventDefault();
    evt.stopPropagation();

    const msisdn = document.getElementById('msisdn').value.trim();
    const email = document.getElementById('email').value.trim();
    const pkg = document.getElementById('packageSelectMTN').value;

    // Basic validations
    if(!/^\d{10}$/.test(msisdn)){
      alert('Please enter a valid 10 digit number (e.g., 0241234567)');
      return;
    }
    if(!isValidEmail(email)){ alert('Please enter a valid email'); return; }
    if(!pkg){ alert('Please select an MTN package'); return; }

    const price = packages[pkg];
    if(typeof price === 'undefined'){ alert('Price not available for selected package'); return; }

    // Use live public key as requested
    const LIVE_KEY = 'pk_live_91cfdef8bb6ab204ba3ec685224bbe3ff7aa0720';
    const amountInPesewas = Math.round(price * 100);

    // Convert phone to international format if needed
    let phone = msisdn;
    if (phone.startsWith('0')) phone = '233' + phone.substring(1);

    if (!window.PaystackPop) {
      alert('Payment service not available. Please try again later.');
      return;
    }

    const handler = PaystackPop.setup({
      key: LIVE_KEY,
      email: email,
      amount: amountInPesewas,
      currency: 'GHS',
      ref: `MTN-` + Date.now(),
      metadata: {
        custom_fields: [
          {display_name: 'Mobile', variable_name: 'mobile', value: phone},
          {display_name: 'Operator', variable_name: 'operator', value: 'MTN'},
          {display_name: 'Package', variable_name: 'package', value: pkg}
        ]
      },
      onClose: function(){ console.log('Payment closed'); },
      callback: function(response){
        handlePaymentSuccess(response, email, msisdn, pkg, price);
      }
    });

    handler.openIframe();
  });
});
