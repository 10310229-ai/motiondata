// Dedicated Telecel page logic — uses its own package list and Paystack handling

function showSuccessPopup() {
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
    <button class="btn-popup" onclick="window.location.href='index.html'" style="background:#22c55e;color:#04261a;border:none;padding:0.8rem 2rem;border-radius:10px;font-weight:800;cursor:pointer;font-size:1rem;">Back to Home</button>
  `;
  
  document.body.appendChild(overlay);
  document.body.appendChild(popup);
}

document.addEventListener('DOMContentLoaded', function(){
  // No auth required - users can order directly

  const packages = {
    '5GB': 24.00,
    '10GB': 45.00,
    '15GB': 63.00,
    '20GB': 83.00,
    '25GB': 100.00,
    '30GB': 120.00,
    '40GB': 160.00,
    '50GB': 195.00
  };

  const sel = document.getElementById('packageSelectTelecel');
  Object.keys(packages).forEach(k=>{
    const opt = document.createElement('option'); opt.value = k; opt.textContent = `${k} ------- GHS${packages[k].toFixed(2)}`; sel.appendChild(opt);
  });

  function isValidEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  document.getElementById('telecelForm').addEventListener('submit', function(evt){
    evt.preventDefault();
    const msisdn = document.getElementById('msisdn').value.trim();
    const email = document.getElementById('email').value.trim();
    const pkg = document.getElementById('packageSelectTelecel').value;
    if(!/^\d{10}$/.test(msisdn)){ alert('Please enter a valid 10 digit number'); return; }
    if(!isValidEmail(email)){ alert('Please enter a valid email'); return; }
    if(!pkg){ alert('Please select a Telecel package'); return; }

    const price = packages[pkg];
    if(typeof price === 'undefined'){ alert('Price not available for selected package'); return; }

    const amountInPesewas = Math.round(price * 100);
    const publicKey = 'pk_live_91cfdef8bb6ab204ba3ec685224bbe3ff7aa0720';
    
    // Validate Paystack library is loaded
    if(!window.PaystackPop){ 
      alert('Payment library failed to load. Please refresh the page and try again.'); 
      return; 
    }
    
    // Validate amount
    if(amountInPesewas < 100 || isNaN(amountInPesewas)){
      alert('Invalid amount. Please select a valid package.');
      return;
    }

    const handler = PaystackPop.setup({
      key: publicKey,
      email: email,
      amount: amountInPesewas,
      currency: 'GHS',
      ref: 'TEL-' + Date.now(),
      metadata: { custom_fields:[{display_name:'Mobile',variable_name:'mobile',value:msisdn},{display_name:'Operator',variable_name:'operator',value:'Telecel'},{display_name:'Package',variable_name:'package',value:pkg}] },
      onClose: function(){ alert('Payment cancelled.'); },
      onSuccess: function(response){
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
            operator: 'Telecel',
            network: 'Telecel',
            package: pkg,
            amount: price,
            status: 'completed'
          };
          const orders = JSON.parse(localStorage.getItem('md_orders') || '[]');
          orders.push(order);
          localStorage.setItem('md_orders', JSON.stringify(orders));
          
          // Save to Supabase in background
          (async function(){
            try {
              const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
              const customer = await saveCustomer({name: currentUser.name || 'Guest', email: email, phone: msisdn});
              const savedOrder = await saveOrder({customer_id: customer.id, network: 'Telecel', package: pkg, phone: msisdn, email: email, amount: price, status: 'completed'});
              await saveTransaction({order_id: savedOrder.id, reference: response.reference, amount: price, status: 'success', payment_method: 'paystack', metadata: {response: response}});
            } catch(e) { console.error('Background save error:', e); }
          })();
        } catch(e) { console.error('Storage error:', e); }
        
        // Clear form fields
        document.getElementById('msisdn').value = '';
        document.getElementById('email').value = '';
        document.getElementById('packageSelectTelecel').value = '';
        
        // Show success alert (blocks until user clicks OK)
        alert(`Payment Successful!\n\nReference: ${response.reference}\nNetwork: Telecel\nPackage: ${pkg}\nAmount: GHS ${price}\n\nYour data bundle will be delivered within 10-30 minutes.`);
        
        // Redirect to homepage after user closes alert
        window.location.href = 'index.html';
      }
    });

    try {
      handler.openIframe();
    } catch(error) {
      console.error('Paystack error:', error);
      alert('Unable to open payment window. Please try again or contact support.');
    }
  });
});
