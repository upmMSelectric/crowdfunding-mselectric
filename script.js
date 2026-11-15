/* =========================================
   ESTADO DE LA APLICACIÓN
   ========================================= */
   let cart = []; // Aquí guardaremos los productos que el usuario añada

   /* =========================================
      REFERENCIAS AL DOM (Elementos de la web)
      ========================================= */
   const cartBtn = document.getElementById('open-cart');
   const closeCartBtn = document.getElementById('close-cart');
   const cartSidebar = document.getElementById('cart-sidebar');
   const cartOverlay = document.getElementById('cart-overlay');
   const cartItemsContainer = document.getElementById('cart-items');
   const cartTotalPrice = document.getElementById('cart-total-price');
   const checkoutForm = document.getElementById('checkout-form');
   const addButtons = document.querySelectorAll('.btn-añadir'); // Selecciona todos los botones de las tarjetas
   const successModal = document.getElementById('success-modal');
  const successNameMsg = document.getElementById('success-name-msg');
  const successOrderCode = document.getElementById('success-order-code');
  const btnVolver = document.getElementById('btn-volver');
   
   /* =========================================
      1. LÓGICA DE LA INTERFAZ DEL CARRITO
      ========================================= */
   function openCart() {
       cartSidebar.classList.add('active');
       cartOverlay.classList.add('active');
   }
   
   function closeCart() {
       cartSidebar.classList.remove('active');
       cartOverlay.classList.remove('active');
   }
   
   // Asignar los eventos de clic para abrir/cerrar
   cartBtn.addEventListener('click', openCart);
   closeCartBtn.addEventListener('click', closeCart);
   cartOverlay.addEventListener('click', closeCart);
   
   /* =========================================
      2. LÓGICA DE PRODUCTOS (AÑADIR Y ELIMINAR)
      ========================================= */
   
   // Leer automáticamente la información de las tarjetas HTML
   addButtons.forEach((btn, index) => {
       btn.addEventListener('click', (e) => {
           // Encontramos la tarjeta a la que pertenece el botón pulsado
           const card = e.target.closest('.producto-card');
           
           // Extraemos el nombre y el precio leyendo el HTML
           const title = card.querySelector('h3').innerText;
           const priceText = card.querySelector('.precio').innerText;
           const price = parseFloat(priceText.replace('€', '').trim());
           const id = 'prod-' + index; // Creamos un ID único basado en su posición
   
           addToCart(id, title, price);
       });
   });
   
   function addToCart(id, name, price) {
       // Comprobamos si el producto ya está en el carrito
       const existingItem = cart.find(item => item.id === id);
       
       if (existingItem) {
           existingItem.quantity += 1; // Si existe, sumamos uno
       } else {
           cart.push({ id, name, price, quantity: 1 }); // Si no, lo añadimos nuevo
       }
       
       updateCartUI();
       openCart(); // Abrimos el carrito para que el usuario vea que se ha añadido
   }
   
   // Importante: Esta función debe ser global (window) para que el HTML pueda usarla al pulsar "Eliminar"
   window.removeFromCart = (id) => {
       cart = cart.filter(item => item.id !== id);
       updateCartUI();
   };
   
   /* =========================================
      3. ACTUALIZAR LA PANTALLA (RENDERIZADO)
      ========================================= */
   function updateCartUI() {
       // 3.1 Actualizar contador del botón de la cabecera
       const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
       cartBtn.innerHTML = `CARRITO (${totalItems}) ↗`;
   
       // 3.2 Limpiar y repintar la lista del panel lateral
       cartItemsContainer.innerHTML = '';
       let total = 0;
   
       if (cart.length === 0) {
           cartItemsContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 2rem;">El carrito está vacío</p>';
       } else {
           cart.forEach((item) => {
               total += item.price * item.quantity;
               cartItemsContainer.innerHTML += `
                   <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                       <div>
                           <h4 style="font-size: 0.9rem; margin-bottom: 0.2rem;">${item.name}</h4>
                           <p style="color: var(--text-muted); font-size: 0.8rem;">${item.quantity} ud. x ${item.price}€</p>
                       </div>
                       <button onclick="removeFromCart('${item.id}')" style="background:none; border:none; color:#ff4444; font-size:0.8rem; cursor:pointer; font-weight:bold;">Eliminar</button>
                   </div>
               `;
           });
       }
       
       // 3.3 Actualizar precio total
       cartTotalPrice.innerText = total + '€';
   }
   
   /* =========================================
   4. PROCESAR EL PEDIDO (CHECKOUT)
   ========================================= */
checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault(); 
  
  if (cart.length === 0) {
      alert("El carrito está vacío. Añade productos antes de confirmar el pedido.");
      return;
  }

  const name = document.getElementById('user-name').value;
  const email = document.getElementById('user-email').value;
  const phone = document.getElementById('user-phone').value;

  const orderCode = 'UPM-' + Math.floor(1000 + Math.random() * 9000);

  // === AQUÍ IRA LA CONEXIÓN CON GOOGLE SHEETS EN EL PRÓXIMO PASO ===
  console.log("Datos listos para enviar:", { orderCode, name, email, phone, cart });
  
  // Inyectar datos en la pantalla de éxito
  successNameMsg.innerText = `¡Gracias por tu apoyo, ${name}!`;
  successOrderCode.innerText = orderCode;
  
  // Mostrar la pantalla de éxito
  successModal.classList.add('active');
  
  // Resetear el carrito en segundo plano
  cart = [];
  updateCartUI();
  checkoutForm.reset();
  closeCart(); // Cerramos el carrito lateral por debajo
});

// Función para el botón "Volver a la página principal"
btnVolver.addEventListener('click', () => {
  successModal.classList.remove('active');
});