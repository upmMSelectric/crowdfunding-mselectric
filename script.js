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
   6. CATÁLOGO DE VARIANTES Y PANTALLA DE PRODUCTO
   ========================================= */

// Aquí configuras las fotos, colores y tallas de cada producto.
// Si un producto no tiene tallas o colores, deja el array vacío [].
// En colors, "imgIndex" indica qué foto de "images" (empezando por 0) se muestra al elegir ese color.
const PRODUCTS_DATA = {
    camiseta: {
        description: 'Camiseta oficial de algodón del equipo MotoStudent UPM Electric con el logo en el pecho y diseño racing en la espalda.',
        images: [
            'images/camisetas/camiseta-azul.jpeg',
            'images/camisetas/camiseta-negra.jpg',
            'images/camisetas/camiseta-blanca.jpg', 
            'images/camisetas/camiseta-verde.jpg'
        ],
        colors: [
            { name: 'Azul', imgIndex: 0 },
            { name: 'Negra', imgIndex: 1 },
            { name: 'Blanca', imgIndex: 2 },
            { name: 'Verde', imgIndex: 3 }
        ],
        sizes: ['S', 'M', 'L', 'XL']
    },
    sudadera: {
        description: 'Sudadera con capucha y bolsillo canguro. Tejido grueso de alta calidad con el diseño oficial de la temporada.',
        images: [
            'images/sudaderas/sudadera-blanca.png',  // índice 0
            'images/sudaderas/sudadera-azul.png',    // índice 1
            'images/sudaderas/sudadera-negra.jpg',   // índice 2
            'images/sudaderas/sudadera-verde.jpg'    // índice 3 (cambia el nombre por el de tu 4º color)
        ],
        colors: [
            { name: 'Blanca', imgIndex: 0 },
            { name: 'Azul', imgIndex: 1 },
            { name: 'Negra', imgIndex: 2 },
            { name: 'Verde', imgIndex: 3 }
        ],
        sizes: ['S', 'M', 'L', 'XL']
    },
    bomber: {
        description: 'Chaqueta estilo bomber oficial del equipo. Cortavientos, forro interior ligero y logo bordado.',
        images: ['images/bomber.jpg'],
        colors: [],
        sizes: ['S', 'M', 'L', 'XL']
    },
    gorra: {
        description: 'Gorra ajustable con el emblema del equipo bordado en el frontal.',
        images: ['images/gorra-negra.jpg', 'images/gorra-azul.jpg'],
        colors: [
            { name: 'Negra', imgIndex: 0 },
            { name: 'Azul', imgIndex: 1 }
        ],
        sizes: []
    },
    llavero: {
        description: 'Llavero bordado de doble cara estilo competición con el lema Remove Before Flight y el logo de MotoStudent UPM.',
        images: ['images/llavero-azul.jpg', 'images/llavero-verde.jpg'],
        colors: [
            { name: 'Azul', imgIndex: 0 },
            { name: 'Verde', imgIndex: 1 }
        ],
        sizes: []
    },
    parche: {
        description: 'Parche bordado termoadhesivo oficial del equipo, ideal para chaquetas o mochilas.',
        images: ['images/parche-1.jpg', 'images/parche-2.jpg'],
        colors: [
            { name: 'Azul', imgIndex: 0 },
            { name: 'Verde', imgIndex: 1 }
        ],
        sizes: []
    },
    mochila: {
        description: 'Mochila ligera de cuerdas con serigrafía oficial del equipo, perfecta para el día a día en la universidad.',
        images: ['images/mochila-negra.jpg', 'images/mochila-azul.jpg'],
        colors: [
            { name: 'Negra', imgIndex: 0 },
            { name: 'Azul', imgIndex: 1 }
        ],
        sizes: []
    },
    pegatinas: {
        description: 'Pack de pegatinas de vinilo resistente al agua para portátil, casco o carpeta.',
        images: [
            'images/pegatinas/pegatina (1).PNG',
            'images/pegatinas/pegatina (2).PNG',
            'images/pegatinas/pegatina (3).PNG',
            'images/pegatinas/pegatina (4).PNG',
            'images/pegatinas/pegatina (5).PNG',
            'images/pegatinas/pegatina (6).PNG',
            'images/pegatinas/pegatina (7).PNG',
            'images/pegatinas/pegatina (8).PNG',
            'images/pegatinas/pegatina (9).PNG'
        ],
        colors: [],
        sizes: []
    },
    pulsera: {
        description: 'Pulsera de silicona con los colores del equipo MotoStudent UPM Electric.',
        images: [],
        colors: [],
        sizes: []
    },
    'pack-basico': {
        description: 'Incluye: Camiseta Oficial + Llavero Remove Before Flight + Pack de Pegatinas.',
        images: [],
        colors: [],
        sizes: []
    },
    'pack-supporter': {
        description: 'Incluye: Sudadera Racing + Camiseta Oficial + Pulsera de Silicona + Pack de Pegatinas.',
        images: [],
        colors: [],
        sizes: []
    },
    'pack-premium': {
        description: 'El pack definitivo: Chaqueta Bomber + Sudadera Racing + Gorra Team + Llavero + Pack de Pegatinas.',
        images: [],
        colors: [],
        sizes: []
    }
};

// Referencias de la pantalla de detalle
const detailView = document.getElementById('product-detail-view');
const closeDetailBtn = document.getElementById('close-detail-btn');
const detailMainImg = document.getElementById('detail-main-img');
const detailMainImgBox = detailMainImg.parentElement;
const detailThumbs = document.getElementById('detail-thumbs');
const detailTitle = document.getElementById('detail-title');
const detailPrice = document.getElementById('detail-price');
const detailDesc = document.getElementById('detail-desc');
const colorGroup = document.getElementById('color-selector-group');
const colorOptions = document.getElementById('color-options');
const selectedColorLabel = document.getElementById('selected-color-label');
const sizeGroup = document.getElementById('size-selector-group');
const sizeOptions = document.getElementById('size-options');
const selectedSizeLabel = document.getElementById('selected-size-label');
const variantError = document.getElementById('variant-error');
const detailAddBtn = document.getElementById('detail-add-btn');

let currentProduct = null;
let selectedColor = null;
let selectedSize = null;

// Conectar todas las tarjetas del catálogo
document.querySelectorAll('.producto-card').forEach(card => {
    card.style.cursor = 'pointer';
    const id = card.dataset.id;
    const config = PRODUCTS_DATA[id] || { description: '', images: [], colors: [], sizes: [] };
    const hasVariants = config.colors.length > 0 || config.sizes.length > 0;
    const btn = card.querySelector('.btn-añadir');

    // Si tiene variantes, cambiamos el texto del botón de la tarjeta para guiar al usuario
    if (hasVariants && btn) {
        btn.innerText = 'Elegir opciones';
    }

    card.addEventListener('click', (e) => {
        const title = card.querySelector('h3').innerText;
        const priceText = card.querySelector('.precio').innerText;
        const price = parseFloat(priceText.replace('€', '').trim());
        const cardImg = card.querySelector('.producto-img img');

        // Si el producto NO tiene variantes y pulsa directamente en "Añadir al carrito", lo añade directo
        if (!hasVariants && e.target.closest('.btn-añadir')) {
            addToCart(id, title, price);
            return;
        }

        // En cualquier otro caso, abrimos la pantalla completa de producto
        openProductDetail({
            id,
            title,
            price,
            priceText,
            fallbackImg: cardImg ? cardImg.src : null,
            ...config
        });
    });
});

function openProductDetail(product) {
    currentProduct = product;
    selectedColor = null;
    selectedSize = null;
    variantError.innerText = '';

    // Cambia 'pegatinas' por el data-id exacto que tengas en PRODUCTS_DATA
    detailView.classList.toggle('es-pegatinas', product.title.toLowerCase().includes('pegatina'));

    detailTitle.innerText = product.title;
    detailPrice.innerText = product.priceText;
    detailDesc.innerText = product.description || 'Artículo oficial de MotoStudent UPM Electric.';

    // 1. Cargar galería de fotos
    const imagesToShow = product.images.length > 0
        ? product.images
        : (product.fallbackImg ? [product.fallbackImg] : []);

    detailThumbs.innerHTML = '';

    if (imagesToShow.length > 0) {
        detailMainImgBox.style.display = 'flex';
        setMainImage(imagesToShow[0]);

        if (imagesToShow.length > 1) {
            imagesToShow.forEach((src, idx) => {
                const thumb = document.createElement('div');
                thumb.className = 'detail-thumb' + (idx === 0 ? ' active' : '');
                thumb.innerHTML = `<img src="${src}" alt="${product.title}">`;
                thumb.addEventListener('click', () => {
                    setMainImage(src);
                    document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                });
                detailThumbs.appendChild(thumb);
            });
        }
    } else {
        detailMainImgBox.style.display = 'none';
    }

    // 2. Cargar selector de colores
    colorOptions.innerHTML = '';
    selectedColorLabel.innerText = '';
    if (product.colors.length > 0) {
        colorGroup.style.display = 'block';
        product.colors.forEach(colorObj => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'variant-btn';
            btn.innerText = colorObj.name;
            btn.addEventListener('click', () => {
                selectedColor = colorObj.name;
                selectedColorLabel.innerText = colorObj.name;
                variantError.innerText = '';
                colorOptions.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');

                // Cambiar la foto grande automáticamente al color elegido
                if (typeof colorObj.imgIndex === 'number' && imagesToShow[colorObj.imgIndex]) {
                    setMainImage(imagesToShow[colorObj.imgIndex]);
                    const thumbs = detailThumbs.querySelectorAll('.detail-thumb');
                    thumbs.forEach(t => t.classList.remove('active'));
                    if (thumbs[colorObj.imgIndex]) thumbs[colorObj.imgIndex].classList.add('active');
                }
            });
            colorOptions.appendChild(btn);
        });
    } else {
        colorGroup.style.display = 'none';
    }

    // 3. Cargar selector de tallas
    sizeOptions.innerHTML = '';
    selectedSizeLabel.innerText = '';
    if (product.sizes.length > 0) {
        sizeGroup.style.display = 'block';
        product.sizes.forEach(size => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'variant-btn';
            btn.innerText = size;
            btn.addEventListener('click', () => {
                selectedSize = size;
                selectedSizeLabel.innerText = size;
                variantError.innerText = '';
                sizeOptions.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
            sizeOptions.appendChild(btn);
        });
    } else {
        sizeGroup.style.display = 'none';
    }

    // Mostrar pantalla completa y bloquear scroll de fondo
    detailView.classList.add('active');
    detailView.scrollTop = 0;
    document.body.style.overflow = 'hidden';
}

function setMainImage(src) {
    detailMainImg.src = src;
}

function closeProductDetail() {
    detailView.classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
}

// Añadir al carrito desde la pantalla de producto (validando color y talla)
detailAddBtn.addEventListener('click', () => {
    if (!currentProduct) return;

    const needsColor = currentProduct.colors.length > 0;
    const needsSize = currentProduct.sizes.length > 0;

    if (needsColor && !selectedColor) {
        variantError.innerText = 'Por favor, selecciona un color antes de añadir al carrito.';
        return;
    }
    if (needsSize && !selectedSize) {
        variantError.innerText = 'Por favor, selecciona una talla antes de añadir al carrito.';
        return;
    }

    // Construimos un nombre y un ID único por combinación (para que en el carrito y en el Excel salga detallado)
    const details = [];
    if (selectedColor) details.push(selectedColor);
    if (selectedSize) details.push('Talla ' + selectedSize);

    const finalName = details.length > 0
        ? `${currentProduct.title} (${details.join(', ')})`
        : currentProduct.title;

    const finalId = `${currentProduct.id}-${selectedColor || 'unico'}-${selectedSize || 'unica'}`;

    addToCart(finalId, finalName, currentProduct.price);
});

closeDetailBtn.addEventListener('click', closeProductDetail);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detailView.classList.contains('active')) {
        closeProductDetail();
    }
});