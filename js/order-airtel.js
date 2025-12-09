// Dedicated AirtelTigo order logic (separate file)
document.addEventListener('DOMContentLoaded', function(){
  // No auth required - users can order directly

  const packages = {
    '1GB': 6.00,'2GB': 11.00,'3GB': 15.00,'4GB': 20.00,'5GB': 25.00,'6GB': 30.00,'7GB': 35.00,'8GB': 40.00,'10GB': 50.00,'20GB': 75.00,'30GB': 85.00,'40GB': 120.00,'50GB': 130.00,'100GB':230.00
  };

  const sel = document.getElementById('packageSelectAirtelTigo');
  Object.keys(packages).forEach(k=>{
    const opt = document.createElement('option'); opt.value = k; opt.textContent = `${k} ------- GHS${packages[k].toFixed(2)}`; sel.appendChild(opt);
  });

  function isValidEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  document.getElementById('airtelForm').addEventListener('submit', function(evt){
    evt.preventDefault();
    const msisdn = document.getElementById('msisdn').value.trim();
    const email = document.getElementById('email').value.trim();
    const pkg = document.getElementById('packageSelectAirtelTigo').value;
    if(!/^\d{10}$/.test(msisdn)){ alert('Please enter a valid 10 digit number'); return; }
    if(!isValidEmail(email)){ alert('Please enter a valid email'); return; }
    if(!pkg){ alert('Please select an AirtelTigo package'); return; }

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
      ref: 'AIR-' + Date.now(),
      metadata: { custom_fields:[{display_name:'Mobile',variable_name:'mobile',value:msisdn},{display_name:'Operator',variable_name:'operator',value:'AirtelTigo'},{display_name:'Package',variable_name:'package',value:pkg}] },
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
            network: 'AirtelTigo',
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
            operator: 'AirtelTigo',
            network: 'AirtelTigo',
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
