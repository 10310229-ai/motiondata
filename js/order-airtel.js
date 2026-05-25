// Dedicated AirtelTigo order logic (separate file)

function showSuccessPopup(orderData = {}, redirectUrl = 'index.html') {
  // Add notification automatically
  if (window.addOrderNotification) {
    window.addOrderNotification({
      title: 'AirtelTigo Order Placed Successfully',
      message: `Your ${orderData.package || 'data bundle'} order has been placed successfully. Delivery in progress.`,
      orderId: orderData.orderId || `AIRTEL-${Date.now()}`,
      network: 'AirtelTigo',
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
    <p style="margin:0 0 1.5rem 0;color:#fff;font-size:0.9rem;">Redirecting in <span id="countdown">8</span> seconds...</p>
    <button class="btn-popup" onclick="window.location.href='" + redirectUrl + "'" style="background:#22c55e;color:#04261a;border:none;padding:0.8rem 2rem;border-radius:10px;font-weight:800;cursor:pointer;font-size:1rem;">Open Receipt Now</button>
  `;
  
  document.body.appendChild(overlay);
  document.body.appendChild(popup);

  // Auto-redirect countdown (8s)
  let secondsLeft = 8;
  const countdownElement = document.getElementById('countdown');
  const countdownInterval = setInterval(() => {
    secondsLeft--;
    if (countdownElement) countdownElement.textContent = secondsLeft;
    if (secondsLeft <= 0) {
      clearInterval(countdownInterval);
      window.location.href = redirectUrl;
    }
  }, 1000);
}

document.addEventListener('DOMContentLoaded', function(){
  // No auth required - users can order directly

  const packages = {
    '1GB': 6.00,
    '2GB': 11.00,
    '3GB': 15.00,
    '4GB': 20.00,
    '5GB': 24.00,
    '6GB': 30.00,
    '7GB': 35.00,
    '8GB': 40.00,
    '10GB': 48.00,
    '15GB': 55.00,
    '20GB': 65.00,
    '30GB': 76.00,
    '40GB': 90.00,
    '50GB': 100.00,
    '100GB': 195.00,
    '200GB': 360.00
  };

  const sel = document.getElementById('packageSelectAirtelTigo');
  Object.keys(packages).forEach(k=>{
    const opt = document.createElement('option'); opt.value = k; opt.textContent = `${k} ------- GHS${packages[k].toFixed(2)}`; sel.appendChild(opt);
  });

  function isValidEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  const airtelForm = document.getElementById('airtelForm');
  if (!airtelForm) {
    console.error('ERROR: airtelForm element not found!');
    return;
  }

  airtelForm.addEventListener('submit', function(evt){
    // Prevent form submission and open Paystack inline using LIVE key
    evt.preventDefault();
    evt.stopPropagation();

    let msisdn = document.getElementById('msisdn').value.trim();
    const email = document.getElementById('email').value.trim();
    const pkg = document.getElementById('packageSelectAirtelTigo').value;

    if(!/^\d{10}$/.test(msisdn)){ alert('Please enter a valid 10 digit number (e.g., 0241234567)'); return; }
    if(!isValidEmail(email)){ alert('Please enter a valid email'); return; }
    if(!pkg){ alert('Please select an AirtelTigo package'); return; }

    const price = packages[pkg];
    if(typeof price === 'undefined'){ alert('Price not available for selected package'); return; }

    const LIVE_KEY = 'pk_live_91cfdef8bb6ab204ba3ec685224bbe3ff7aa0720';
    const amountInPesewas = Math.round(price * 100);
    let phone = msisdn;
    if (phone.startsWith('0')) phone = '233' + phone.substring(1);

    if (!window.PaystackPop) { alert('Payment service not available'); return; }

    const handler = PaystackPop.setup({
      key: LIVE_KEY,
      email: email,
      amount: amountInPesewas,
      currency: 'GHS',
      ref: `ATG-` + Date.now(),
      metadata: { custom_fields: [ {display_name:'Mobile', variable_name:'mobile', value:phone}, {display_name:'Package', variable_name:'package', value:pkg} ] },
      onClose: function(){ console.log('Payment closed'); },
      callback: function(response){
        try {
          const order = { id: response.reference, reference: response.reference, date: new Date().toISOString(), timestamp: Date.now(), email: email, phone: msisdn, mobile: phone, operator: 'AirtelTigo', network: 'AirtelTigo', package: pkg, amount: price, status: 'completed' };
          const orders = JSON.parse(localStorage.getItem('md_orders') || '[]'); orders.push(order); localStorage.setItem('md_orders', JSON.stringify(orders));
        } catch(e){ console.error('LocalStorage save error:', e); }

        if (typeof window.addOrderNotification === 'function') {
          window.addOrderNotification({ title: 'AirtelTigo Order Placed Successfully', message: `Your ${pkg} order has been placed successfully.`, orderId: response.reference, network: 'AirtelTigo', amount: `GH₵ ${price.toFixed(2)}` });
        }

        // Persist order (best-effort) then redirect to receipt page
        const orderPayload = { id: response.reference, reference: response.reference, date: new Date().toISOString(), email: email, phone: msisdn, operator: 'AirtelTigo', package: pkg, amount: price, status: 'completed' };
        try { if (navigator && typeof navigator.sendBeacon === 'function') { const blob = new Blob([JSON.stringify(orderPayload)], {type:'application/json'}); navigator.sendBeacon('/api/orders', blob); } } catch(e){ console.warn('Beacon failed', e); }

        try { document.getElementById('msisdn').value=''; document.getElementById('email').value=''; document.getElementById('packageSelectAirtelTigo').value=''; } catch(e){}

        const params = new URLSearchParams({ network: 'AirtelTigo', package: pkg, phone: msisdn, email: email, amount: price, reference: response.reference });
        window.location.href = 'receipt.html?' + params.toString();
      }
    });

    handler.openIframe();
  });
});
