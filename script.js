/* =========================================
   ESTADO DE LA APLICACIÓN
   ========================================= */
   let cart = [];

   /* =========================================
      REFERENCIAS AL DOM (Elementos de la web)
      ========================================= */
   // 1. Referencias del carrito y botones
   const cartBtn = document.getElementById('open-cart');
   const closeCartBtn = document.getElementById('close-cart');
   const cartSidebar = document.getElementById('cart-sidebar');
   const cartOverlay = document.getElementById('cart-overlay');
   const cartItemsContainer = document.getElementById('cart-items');
   const cartTotalPrice = document.getElementById('cart-total-price');
   const checkoutForm = document.getElementById('checkout-form');
   const addButtons = document.querySelectorAll('.producto-card .btn-añadir');
   
   // 2. Referencias para la pantalla de éxito
   const mainContent = document.getElementById('main-content');
   const pantallaExito = document.getElementById('pantalla-exito');
   const successNameMsg = document.getElementById('success-name-msg');
   const successOrderCode = document.getElementById('success-order-code');
   const btnVolver = document.getElementById('btn-volver');
// Seleccionamos todas las secciones de tu web original para poder ocultarlas de golpe
const webPrincipal = document.querySelectorAll('header, main, section');
   
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
   
   /* ===========================================
      3. ACTUALIZAR LA PANTALLA (RENDERIZADO)
      =========================================== */
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
   
/* ==================================================
   4. PROCESAR EL PEDIDO (CHECKOUT + GOOGLE SHEETS)
   ========================================= */
   const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzKKo0lQngpx8Sv0uKEN9zn2Lv68Eggvb_poIINJOwcgLV-dfTvPLHdtGmZWqC6JnMN/exec';

   checkoutForm.addEventListener('submit', async (e) => {
       e.preventDefault(); 
       
       if (cart.length === 0) {
           alert("El carrito está vacío.");
           return;
       }
   
       // Bloqueamos el botón mientras se envía para evitar pedidos duplicados
       const submitBtn = checkoutForm.querySelector('.btn-submit');
       const originalBtnText = submitBtn.innerText;
       submitBtn.disabled = true;
       submitBtn.innerText = 'REGISTRANDO PEDIDO...';
   
       // Recogemos los datos del formulario y calculamos el resumen
       const name = document.getElementById('user-name').value;
       const surname = document.getElementById('user-surnames').value;
       const email = document.getElementById('user-email').value;
       const phone = document.getElementById('user-phone').value;
       
       const itemsSummary = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
       const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

       const orderData = { name, surname, email, phone, itemsSummary, total };
    
       try {
           // Enviamos los datos a Google Apps Script
           const response = await fetch(SCRIPT_URL, {
               method: 'POST',
               headers: {
                   'Content-Type': 'text/plain;charset=utf-8'
               },
               body: JSON.stringify(orderData)
           });
   
           if (!response.ok) throw new Error('Error en la respuesta del servidor');
           const result = await response.json();
           
           if (result.status !== 'success') throw new Error(result.message);

            // Mostramos el código real asignado por Google Sheets
            successNameMsg.innerText = `¡Gracias por tu apoyo, ${name}!`;
            successOrderCode.innerText = result.orderCode;
           
           mainContent.style.display = 'none';
           pantallaExito.style.display = 'flex';
           window.scrollTo(0, 0);
           
           // Reseteamos el carrito
           cart = [];
           updateCartUI();
           checkoutForm.reset();
           closeCart();
   
       } catch (error) {
           console.error('Error al enviar el pedido:', error);
           alert('Hubo un problema al registrar tu pedido. Por favor, inténtalo de nuevo.');
       } finally {
           // Restauramos el botón pase lo que pase
           submitBtn.disabled = false;
           submitBtn.innerText = originalBtnText;
       }
   });

   // Botón para volver a la página principal
    btnVolver.addEventListener('click', () => {
        pantallaExito.style.display = 'none';
        mainContent.style.display = 'block';
        window.scrollTo(0, 0);
    });
    
/* =========================================
   5. MENÚ HAMBURGUESA (MÓVIL)
   ========================================= */
   const menuToggle = document.getElementById('menu-toggle');
   const navMenu = document.getElementById('nav-menu');
   const navLinks = document.querySelectorAll('#nav-menu a');
   
   menuToggle.addEventListener('click', () => {
       navMenu.classList.toggle('active');
   });
   
   navLinks.forEach(link => {
       link.addEventListener('click', () => {
           navMenu.classList.remove('active');
       });
   });
/* =========================================
   6. MODAL DE DETALLE DE PRODUCTO
   ========================================= */
   const productModalOverlay = document.getElementById('product-modal-overlay');
   const closeProductModalBtn = document.getElementById('close-product-modal');
   const modalImg = document.getElementById('modal-img');
   const modalTitle = document.getElementById('modal-title');
   const modalPrice = document.getElementById('modal-price');
   const modalDesc = document.getElementById('modal-desc');
   const modalAddBtn = document.getElementById('modal-add-btn');
   
   let activeCardAddBtn = null;
   
   // Hacemos que cada tarjeta abra el modal al hacer clic en ella
   addButtons.forEach(btn => {
       const card = btn.closest('.producto-card');
       card.style.cursor = 'pointer';
   
       card.addEventListener('click', (e) => {
           // Si se pulsa directamente en "Añadir al carrito", no abrimos el modal
           if (e.target.closest('.btn-añadir')) return;
   
           const img = card.querySelector('.producto-img img');
           const title = card.querySelector('h3').innerText;
           const price = card.querySelector('.precio').innerText;
           const description = card.dataset.description || 'Artículo oficial del crowdfunding de MotoStudent UPM Electric.';
   
           // Si ya hay una etiqueta <img> real la mostramos; si no, ocultamos el hueco de foto
           if (img) {
               modalImg.src = img.src;
               modalImg.alt = title;
               modalImg.parentElement.style.display = 'flex';
           } else {
               modalImg.parentElement.style.display = 'none';
           }
   
           modalTitle.innerText = title;
           modalPrice.innerText = price;
           modalDesc.innerText = description;
   
           activeCardAddBtn = btn;
           productModalOverlay.classList.add('active');
       });
   });
   
   function closeProductModal() {
       productModalOverlay.classList.remove('active');
       activeCardAddBtn = null;
   }
   
   // Al pulsar "Añadir al carrito" dentro del modal, dispara el botón original de esa tarjeta
   modalAddBtn.addEventListener('click', () => {
       if (activeCardAddBtn) {
           activeCardAddBtn.click();
       }
       closeProductModal();
   });
   
   // Cerrar con la X, clic fuera del cuadro o tecla Escape
   closeProductModalBtn.addEventListener('click', closeProductModal);
   
   productModalOverlay.addEventListener('click', (e) => {
       if (e.target === productModalOverlay) {
           closeProductModal();
       }
   });
   
   document.addEventListener('keydown', (e) => {
       if (e.key === 'Escape' && productModalOverlay.classList.contains('active')) {
           closeProductModal();
       }
   });