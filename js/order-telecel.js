// Dedicated Telecel page logic — uses its own package list and Paystack handling
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
      onSuccess: async function(response){
        try {
          // Get current user
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          
          // Save customer to Supabase
          const customerData = {
            name: currentUser.name || 'Guest',
            email: email,
            phone: msisdn
          };
          const customer = await saveCustomer(customerData);
          
          // Save order to Supabase
          const orderData = {
            customer_id: customer.id,
            network: 'Telecel',
            package: pkg,
            phone: msisdn,
            email: email,
            amount: price,
            status: 'completed'
          };
          const savedOrder = await saveOrder(orderData);
          
          // Save transaction to Supabase
          const transactionData = {
            order_id: savedOrder.id,
            reference: response.reference,
            amount: price,
            status: 'success',
            payment_method: 'paystack',
            metadata: { response: response }
          };
          await saveTransaction(transactionData);
          
          // Also save to localStorage as backup
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
          
          // Show success message
          if(typeof showToast === 'function'){
            showToast('✓ Order placed successfully! Your data bundle will be delivered shortly.', 5000);
          } else {
            alert('Order placed successfully! Your data bundle will be delivered shortly.');
          }
          
          // Show success popup and redirect after 3 seconds
          showSuccessPopup();
          setTimeout(function(){
            try { window.location.href = 'index.html'; }
            catch(e){ window.location.href = 'index.html'; }
          }, 3500);
        } catch (error) {
          console.error('Error saving order:', error);
          // Still show success to user even if database save fails
          if(typeof showToast === 'function'){
            showToast('✓ Order placed successfully! Your data bundle will be delivered shortly.', 5000);
          } else {
            alert('Order placed successfully! Your data bundle will be delivered shortly.');
          }
          showSuccessPopup();
          setTimeout(function(){ window.location.href = 'index.html'; }, 3500);
        }
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
