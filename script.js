// ===== Point of Sale Application =====
// Complete POS system with integrated warehouse stock management
// Uses localStorage for data persistence

(function () {
  'use strict';

  // ===== DATA STORE =====
  const STORAGE_KEYS = {
    PRODUCTS: 'swiftpos_products',
    TRANSACTIONS: 'swiftpos_transactions',
    HELD_ORDERS: 'swiftpos_held_orders',
  };

  // Default sample products
  const DEFAULT_PRODUCTS = [
    { id: 'P001', name: 'Espresso Coffee', sku: 'COF-001', category: 'Beverages', emoji: '☕', price: 3.50, cost: 1.20, stock: 150, minStock: 20 },
    { id: 'P002', name: 'Green Tea Latte', sku: 'COF-002', category: 'Beverages', emoji: '🍵', price: 4.50, cost: 1.50, stock: 120, minStock: 15 },
    { id: 'P003', name: 'Fresh Orange Juice', sku: 'BEV-001', category: 'Beverages', emoji: '🍊', price: 5.00, cost: 2.00, stock: 80, minStock: 10 },
    { id: 'P004', name: 'Chocolate Croissant', sku: 'BAK-001', category: 'Bakery', emoji: '🥐', price: 3.25, cost: 1.00, stock: 45, minStock: 10 },
    { id: 'P005', name: 'Blueberry Muffin', sku: 'BAK-002', category: 'Bakery', emoji: '🧁', price: 2.75, cost: 0.80, stock: 60, minStock: 12 },
    { id: 'P006', name: 'Sourdough Bread', sku: 'BAK-003', category: 'Bakery', emoji: '🍞', price: 5.50, cost: 2.00, stock: 30, minStock: 8 },
    { id: 'P007', name: 'Caesar Salad', sku: 'FOD-001', category: 'Food', emoji: '🥗', price: 8.50, cost: 3.50, stock: 25, minStock: 5 },
    { id: 'P008', name: 'Grilled Chicken Wrap', sku: 'FOD-002', category: 'Food', emoji: '🌯', price: 9.00, cost: 4.00, stock: 35, minStock: 8 },
    { id: 'P009', name: 'Margherita Pizza', sku: 'FOD-003', category: 'Food', emoji: '🍕', price: 12.00, cost: 4.50, stock: 20, minStock: 5 },
    { id: 'P010', name: 'Cheeseburger Deluxe', sku: 'FOD-004', category: 'Food', emoji: '🍔', price: 10.50, cost: 4.00, stock: 40, minStock: 8 },
    { id: 'P011', name: 'Bottled Water', sku: 'BEV-002', category: 'Beverages', emoji: '💧', price: 1.50, cost: 0.30, stock: 200, minStock: 30 },
    { id: 'P012', name: 'Iced Caramel Macchiato', sku: 'COF-003', category: 'Beverages', emoji: '🧋', price: 5.50, cost: 2.00, stock: 90, minStock: 15 },
    { id: 'P013', name: 'Tiramisu Cake', sku: 'DST-001', category: 'Desserts', emoji: '🍰', price: 6.50, cost: 2.50, stock: 15, minStock: 5 },
    { id: 'P014', name: 'Chocolate Ice Cream', sku: 'DST-002', category: 'Desserts', emoji: '🍫', price: 4.00, cost: 1.50, stock: 50, minStock: 10 },
    { id: 'P015', name: 'Fruit Smoothie Bowl', sku: 'BEV-003', category: 'Beverages', emoji: '🫐', price: 7.50, cost: 3.00, stock: 30, minStock: 8 },
    { id: 'P016', name: 'French Fries', sku: 'SNK-001', category: 'Snacks', emoji: '🍟', price: 3.50, cost: 1.00, stock: 0, minStock: 15 },
    { id: 'P017', name: 'Chicken Nuggets', sku: 'SNK-002', category: 'Snacks', emoji: '🍗', price: 5.50, cost: 2.00, stock: 8, minStock: 12 },
    { id: 'P018', name: 'Mineral Water (Sparkling)', sku: 'BEV-004', category: 'Beverages', emoji: '🫧', price: 2.50, cost: 0.60, stock: 100, minStock: 20 },
    { id: 'P019', name: 'Avocado Toast', sku: 'FOD-005', category: 'Food', emoji: '🥑', price: 8.00, cost: 3.00, stock: 22, minStock: 5 },
    { id: 'P020', name: 'Cinnamon Roll', sku: 'BAK-004', category: 'Bakery', emoji: '🧇', price: 3.75, cost: 1.10, stock: 35, minStock: 10 },
  ];

  // ===== STATE =====
  let products = [];
  let transactions = [];
  let heldOrders = [];
  let cart = [];
  let currentDiscount = { type: null, value: 0 };
  let currentView = 'pos';
  let editingProductId = null;
  let adjustingStockProductId = null;
  let stockAdjType = 'add';
  let paymentMethod = 'cash';

  // ===== INITIALIZATION =====
  function init() {
    loadData();
    setupEventListeners();
    renderAll();
    startClock();
    updateLowStockBadge();
    setupMobileCart();
  }

  // ===== MOBILE CART DRAWER =====
  function isMobile() {
    return window.innerWidth <= 768;
  }

  function setupMobileCart() {
    const fab = document.getElementById('mobile-cart-toggle');
    const overlay = document.getElementById('mobile-cart-overlay');
    const cartPanel = document.querySelector('.pos-cart');

    fab.addEventListener('click', toggleMobileCart);
    overlay.addEventListener('click', closeMobileCart);

    // Show/hide FAB based on current view and screen size
    function updateFabVisibility() {
      if (isMobile() && currentView === 'pos') {
        fab.classList.remove('hidden');
      } else {
        fab.classList.add('hidden');
        closeMobileCart();
      }
    }

    window.addEventListener('resize', updateFabVisibility);
    updateFabVisibility();

    // Store original switchView to hook into it
    const origSwitchView = switchView;
  }

  function toggleMobileCart() {
    const cartPanel = document.querySelector('.pos-cart');
    const overlay = document.getElementById('mobile-cart-overlay');
    const isOpen = cartPanel.classList.contains('cart-open');

    if (isOpen) {
      closeMobileCart();
    } else {
      cartPanel.classList.add('cart-open');
      overlay.classList.remove('hidden');
    }
  }

  function closeMobileCart() {
    const cartPanel = document.querySelector('.pos-cart');
    const overlay = document.getElementById('mobile-cart-overlay');
    cartPanel.classList.remove('cart-open');
    overlay.classList.add('hidden');
  }

  function updateMobileCartBadge() {
    const badge = document.getElementById('mobile-cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
  }

  function loadData() {
    const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    products = storedProducts ? JSON.parse(storedProducts) : [...DEFAULT_PRODUCTS];
    if (!storedProducts) saveProducts();

    const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    transactions = storedTx ? JSON.parse(storedTx) : [];

    const storedHeld = localStorage.getItem(STORAGE_KEYS.HELD_ORDERS);
    heldOrders = storedHeld ? JSON.parse(storedHeld) : [];
  }

  function saveProducts() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  function saveTransactions() {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  function saveHeldOrders() {
    localStorage.setItem(STORAGE_KEYS.HELD_ORDERS, JSON.stringify(heldOrders));
  }

  // ===== CLOCK =====
  function startClock() {
    function update() {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');
      document.getElementById('clock-time').textContent = `${h}:${m}:${s}`;
    }
    update();
    setInterval(update, 1000);
  }

  // ===== NAVIGATION =====
  function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-view="${view}"]`).classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');

    if (view === 'inventory') renderInventory();
    if (view === 'transactions') renderTransactions();
    if (view === 'dashboard') renderDashboard();
    if (view === 'pos') renderProducts();

    // Mobile: show/hide FAB, close cart drawer
    const fab = document.getElementById('mobile-cart-toggle');
    if (isMobile() && view === 'pos') {
      fab.classList.remove('hidden');
    } else {
      fab.classList.add('hidden');
    }
    closeMobileCart();

    // Scroll main content to top on mobile
    if (isMobile()) {
      document.getElementById('main-content').scrollTop = 0;
    }
  }

  // ===== CATEGORIES =====
  function getCategories() {
    const cats = new Set(products.map(p => p.category));
    return [...cats].sort();
  }

  function renderCategoryTabs() {
    const container = document.getElementById('category-tabs');
    const cats = getCategories();
    container.innerHTML = `<button class="cat-tab active" data-category="all">All</button>` +
      cats.map(c => `<button class="cat-tab" data-category="${c}">${c}</button>`).join('');

    container.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderProducts();
      });
    });

    // Update category filter in inventory
    const catFilter = document.getElementById('inventory-category-filter');
    catFilter.innerHTML = `<option value="all">All Categories</option>` +
      cats.map(c => `<option value="${c}">${c}</option>`).join('');

    // Update category datalist in form
    const datalist = document.getElementById('category-list');
    datalist.innerHTML = cats.map(c => `<option value="${c}">`).join('');
  }

  // ===== PRODUCTS GRID (POS) =====
  function renderProducts() {
    const grid = document.getElementById('products-grid');
    const search = document.getElementById('pos-search').value.toLowerCase();
    const activeTab = document.querySelector('.cat-tab.active');
    const category = activeTab ? activeTab.dataset.category : 'all';

    let filtered = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search);
      const matchCat = category === 'all' || p.category === category;
      return matchSearch && matchCat;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
                <span class="material-icons-round">search_off</span>
                <p>No products found</p>
            </div>`;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const stockClass = p.stock === 0 ? 'out-of-stock' : '';
      const dotClass = p.stock === 0 ? 'red' : p.stock <= p.minStock ? 'yellow' : 'green';
      const stockText = p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`;

      return `<div class="product-card ${stockClass}" data-product-id="${p.id}" title="${p.name}">
                <div class="product-card-add-anim"></div>
                <span class="product-emoji">${p.emoji || '📦'}</span>
                <span class="product-name">${p.name}</span>
                <span class="product-price">$${p.price.toFixed(2)}</span>
                <span class="product-stock-indicator">
                    <span class="stock-dot ${dotClass}"></span>
                    ${stockText}
                </span>
            </div>`;
    }).join('');

    grid.querySelectorAll('.product-card:not(.out-of-stock)').forEach(card => {
      card.addEventListener('click', () => addToCart(card.dataset.productId));
    });
  }

  // ===== CART =====
  function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) return;

    const existing = cart.find(item => item.productId === productId);
    if (existing) {
      if (existing.qty >= product.stock) {
        showToast('Not enough stock available', 'warning');
        return;
      }
      existing.qty++;
    } else {
      cart.push({ productId, qty: 1 });
    }

    // Flash animation
    const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
    if (card) {
      const anim = card.querySelector('.product-card-add-anim');
      anim.style.animation = 'none';
      void anim.offsetWidth;
      anim.style.animation = 'addToCartFlash 0.35s ease';
    }

    renderCart();
    updateMobileCartBadge();
  }

  function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    renderCart();
    updateMobileCartBadge();
  }

  function updateCartQty(productId, delta) {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    const product = products.find(p => p.id === productId);
    const newQty = item.qty + delta;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > product.stock) {
      showToast('Not enough stock available', 'warning');
      return;
    }

    item.qty = newQty;
    renderCart();
  }

  function clearCart() {
    if (cart.length === 0) return;
    cart = [];
    currentDiscount = { type: null, value: 0 };
    renderCart();
    updateMobileCartBadge();
    showToast('Cart cleared', 'info');
  }

  function getCartTotals() {
    let subtotal = 0;
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) subtotal += product.price * item.qty;
    });

    const tax = subtotal * 0.11;
    let discountAmount = 0;

    if (currentDiscount.type === 'percentage') {
      discountAmount = (subtotal + tax) * (currentDiscount.value / 100);
    } else if (currentDiscount.type === 'fixed') {
      discountAmount = Math.min(currentDiscount.value, subtotal + tax);
    }

    const total = subtotal + tax - discountAmount;
    return { subtotal, tax, discountAmount, total };
  }

  function renderCart() {
    const container = document.getElementById('cart-items');
    const payBtn = document.getElementById('pay-btn');
    const payAmount = document.getElementById('pay-amount');
    const discountRow = document.getElementById('discount-row');

    // Build or retrieve the empty-state element
    let emptyEl = document.getElementById('cart-empty');
    if (!emptyEl) {
      emptyEl = document.createElement('div');
      emptyEl.className = 'cart-empty';
      emptyEl.id = 'cart-empty';
      emptyEl.innerHTML = `
                <span class="material-icons-round">add_shopping_cart</span>
                <p>No items in cart</p>
                <span class="cart-empty-hint">Click products or scan barcode to add</span>`;
    }

    if (cart.length === 0) {
      container.innerHTML = '';
      emptyEl.classList.remove('hidden');
      container.appendChild(emptyEl);
      payBtn.disabled = true;
      document.getElementById('cart-subtotal').textContent = '$0.00';
      document.getElementById('cart-tax').textContent = '$0.00';
      document.getElementById('cart-discount').textContent = '-$0.00';
      document.getElementById('cart-total').textContent = '$0.00';
      payAmount.textContent = '$0.00';
      discountRow.classList.add('hidden');
      return;
    }

    // Remove empty-state from DOM if it's currently a child
    if (emptyEl.parentNode === container) {
      container.removeChild(emptyEl);
    }

    container.innerHTML = cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return '';
      const itemTotal = product.price * item.qty;
      return `<div class="cart-item" data-product-id="${product.id}">
                <span class="cart-item-emoji">${product.emoji || '📦'}</span>
                <div class="cart-item-info">
                    <div class="cart-item-name">${product.name}</div>
                    <div class="cart-item-price">$${product.price.toFixed(2)} each</div>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn" data-action="dec" data-id="${product.id}">−</button>
                    <span class="qty-value">${item.qty}</span>
                    <button class="qty-btn" data-action="inc" data-id="${product.id}">+</button>
                </div>
                <span class="cart-item-total">$${itemTotal.toFixed(2)}</span>
                <button class="cart-item-remove" data-id="${product.id}">
                    <span class="material-icons-round">close</span>
                </button>
            </div>`;
    }).join('');

    // Event listeners for qty and remove
    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const delta = btn.dataset.action === 'inc' ? 1 : -1;
        updateCartQty(id, delta);
      });
    });

    container.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
    });

    const totals = getCartTotals();
    document.getElementById('cart-subtotal').textContent = `$${totals.subtotal.toFixed(2)}`;
    document.getElementById('cart-tax').textContent = `$${totals.tax.toFixed(2)}`;
    document.getElementById('cart-discount').textContent = `-$${totals.discountAmount.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${totals.total.toFixed(2)}`;
    payAmount.textContent = `$${totals.total.toFixed(2)}`;

    if (currentDiscount.type) {
      discountRow.classList.remove('hidden');
    } else {
      discountRow.classList.add('hidden');
    }

    payBtn.disabled = false;
    updateMobileCartBadge();
  }

  // ===== PAYMENT =====
  function openPaymentModal() {
    if (cart.length === 0) return;

    const totals = getCartTotals();
    document.getElementById('payment-total').textContent = `$${totals.total.toFixed(2)}`;
    document.getElementById('card-amount').textContent = `$${totals.total.toFixed(2)}`;
    document.getElementById('ewallet-amount').textContent = `$${totals.total.toFixed(2)}`;
    document.getElementById('cash-received').value = '';
    document.getElementById('change-display').classList.add('hidden');
    document.getElementById('complete-payment-btn').disabled = true;

    // Generate quick cash buttons
    const quickCash = document.getElementById('quick-cash-btns');
    const total = totals.total;
    const suggestions = getQuickCashSuggestions(total);
    quickCash.innerHTML = suggestions.map(amt =>
      `<button class="quick-cash-btn" data-amount="${amt}">$${amt.toFixed(2)}</button>`
    ).join('');

    quickCash.querySelectorAll('.quick-cash-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('cash-received').value = btn.dataset.amount;
        handleCashInput();
      });
    });

    paymentMethod = 'cash';
    updatePaymentMethod('cash');
    showModal('payment-modal');
  }

  function getQuickCashSuggestions(total) {
    const suggestions = new Set();
    suggestions.add(Math.ceil(total));
    suggestions.add(Math.ceil(total / 5) * 5);
    suggestions.add(Math.ceil(total / 10) * 10);
    suggestions.add(Math.ceil(total / 20) * 20);
    suggestions.add(Math.ceil(total / 50) * 50);
    if (total <= 100) suggestions.add(100);
    return [...suggestions].filter(v => v >= total).sort((a, b) => a - b).slice(0, 5);
  }

  function updatePaymentMethod(method) {
    paymentMethod = method;
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
    document.querySelector(`.payment-method[data-method="${method}"]`).classList.add('active');

    document.getElementById('cash-payment-section').classList.toggle('hidden', method !== 'cash');
    document.getElementById('card-payment-section').classList.toggle('hidden', method !== 'card');
    document.getElementById('ewallet-payment-section').classList.toggle('hidden', method !== 'ewallet');

    const btn = document.getElementById('complete-payment-btn');
    if (method === 'card' || method === 'ewallet') {
      btn.disabled = false;
    } else {
      handleCashInput();
    }
  }

  function handleCashInput() {
    const totals = getCartTotals();
    const received = parseFloat(document.getElementById('cash-received').value) || 0;
    const change = received - totals.total;
    const changeDisplay = document.getElementById('change-display');
    const btn = document.getElementById('complete-payment-btn');

    if (received >= totals.total && received > 0) {
      changeDisplay.classList.remove('hidden');
      document.getElementById('change-value').textContent = `$${change.toFixed(2)}`;
      btn.disabled = false;
    } else {
      changeDisplay.classList.add('hidden');
      btn.disabled = true;
    }
  }

  function completePayment() {
    const totals = getCartTotals();
    const received = paymentMethod === 'cash' ? parseFloat(document.getElementById('cash-received').value) : totals.total;
    const change = paymentMethod === 'cash' ? received - totals.total : 0;

    // Deduct stock
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.qty);
      }
    });
    saveProducts();

    // Create transaction
    const tx = {
      id: generateTxId(),
      date: new Date().toISOString(),
      items: cart.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          name: product ? product.name : 'Unknown',
          emoji: product ? product.emoji : '📦',
          price: product ? product.price : 0,
          qty: item.qty,
          total: product ? product.price * item.qty : 0,
        };
      }),
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discountAmount,
      discountInfo: currentDiscount.type ? { type: currentDiscount.type, value: currentDiscount.value } : null,
      total: totals.total,
      paymentMethod,
      amountReceived: received,
      change,
    };

    transactions.unshift(tx);
    saveTransactions();

    // Show receipt
    hideModal('payment-modal');
    showReceipt(tx);

    // Clear cart
    cart = [];
    currentDiscount = { type: null, value: 0 };
    renderCart();
    renderProducts();
    updateLowStockBadge();
    updateMobileCartBadge();
    closeMobileCart();

    showToast('Payment completed successfully!', 'success');
  }

  function generateTxId() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TX-${date}-${rand}`;
  }

  // ===== RECEIPT =====
  function showReceipt(tx) {
    const date = new Date(tx.date);
    const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const receiptHTML = `
            <div class="receipt-header">
                <div class="receipt-brand">SWIFTPOS</div>
                <div class="receipt-subtitle">Point of Sale Receipt</div>
            </div>
            <div class="receipt-info">
                <div><span>Receipt:</span><span>${tx.id}</span></div>
                <div><span>Date:</span><span>${dateStr}</span></div>
                <div><span>Time:</span><span>${timeStr}</span></div>
                <div><span>Cashier:</span><span>Cashier</span></div>
            </div>
            <div class="receipt-items">
                ${tx.items.map(item => `
                    <div class="receipt-item">
                        <span class="receipt-item-name">${item.name}</span>
                        <span class="receipt-item-qty">x${item.qty}</span>
                        <span class="receipt-item-total">$${item.total.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="receipt-totals">
                <div><span>Subtotal</span><span>$${tx.subtotal.toFixed(2)}</span></div>
                <div><span>Tax (10%)</span><span>$${tx.tax.toFixed(2)}</span></div>
                ${tx.discount > 0 ? `<div><span>Discount</span><span>-$${tx.discount.toFixed(2)}</span></div>` : ''}
                <div class="receipt-total-final"><span>TOTAL</span><span>$${tx.total.toFixed(2)}</span></div>
            </div>
            <div class="receipt-payment-info">
                <div><span>Payment:</span><span>${tx.paymentMethod.toUpperCase()}</span></div>
                ${tx.paymentMethod === 'cash' ? `
                    <div><span>Received:</span><span>$${tx.amountReceived.toFixed(2)}</span></div>
                    <div><span>Change:</span><span>$${tx.change.toFixed(2)}</span></div>
                ` : ''}
            </div>
            <div class="receipt-footer">
                <p>Thank you for shopping!</p>
                <p>Visit us again soon ♥</p>
            </div>
        `;

    document.getElementById('receipt-content').innerHTML = receiptHTML;
    showModal('receipt-modal');
  }

  // ===== DISCOUNT =====
  function openDiscountModal() {
    if (cart.length === 0) {
      showToast('Add items to cart first', 'warning');
      return;
    }
    document.getElementById('discount-value').value = currentDiscount.value || '';
    const activeType = currentDiscount.type || 'percentage';
    document.querySelectorAll('.discount-type').forEach(b => {
      b.classList.toggle('active', b.dataset.type === activeType);
    });
    updateDiscountLabel(activeType);
    showModal('discount-modal');
  }

  function updateDiscountLabel(type) {
    const label = document.getElementById('discount-label');
    const input = document.getElementById('discount-value');
    if (type === 'percentage') {
      label.textContent = 'Discount (%)';
      input.max = 100;
      input.placeholder = '0';
    } else {
      label.textContent = 'Discount Amount ($)';
      input.max = '';
      input.placeholder = '0.00';
    }
  }

  function applyDiscount() {
    const activeType = document.querySelector('.discount-type.active').dataset.type;
    const value = parseFloat(document.getElementById('discount-value').value) || 0;

    if (value <= 0) {
      showToast('Enter a valid discount value', 'warning');
      return;
    }

    if (activeType === 'percentage' && value > 100) {
      showToast('Percentage cannot exceed 100%', 'warning');
      return;
    }

    currentDiscount = { type: activeType, value };
    renderCart();
    hideModal('discount-modal');
    showToast(`Discount applied: ${activeType === 'percentage' ? value + '%' : '$' + value.toFixed(2)}`, 'success');
  }

  function removeDiscount() {
    currentDiscount = { type: null, value: 0 };
    renderCart();
    hideModal('discount-modal');
    showToast('Discount removed', 'info');
  }

  // ===== HOLD ORDER =====
  function holdOrder() {
    if (cart.length === 0) {
      showToast('No items to hold', 'warning');
      return;
    }

    const totals = getCartTotals();
    heldOrders.push({
      id: 'HLD-' + Date.now(),
      date: new Date().toISOString(),
      items: [...cart],
      discount: { ...currentDiscount },
      total: totals.total,
    });
    saveHeldOrders();

    cart = [];
    currentDiscount = { type: null, value: 0 };
    renderCart();
    showToast('Order held successfully', 'success');
  }

  function showHeldOrders() {
    const panel = document.getElementById('held-orders-panel');
    panel.classList.toggle('hidden');
    renderHeldOrders();
  }

  function renderHeldOrders() {
    const list = document.getElementById('held-orders-list');
    if (heldOrders.length === 0) {
      list.innerHTML = `<div class="empty-state"><span class="material-icons-round">pause_circle</span><p>No held orders</p></div>`;
      return;
    }

    list.innerHTML = heldOrders.map((order, idx) => {
      const date = new Date(order.date);
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0);
      return `<div class="held-order-card">
                <div class="held-order-header">
                    <span class="held-order-items-count">${itemCount} items</span>
                    <span class="held-order-time">${timeStr}</span>
                </div>
                <div class="held-order-total">$${order.total.toFixed(2)}</div>
                <div class="held-order-actions">
                    <button class="btn btn-sm btn-primary" data-action="restore" data-idx="${idx}">
                        <span class="material-icons-round" style="font-size:14px">restore</span> Restore
                    </button>
                    <button class="btn btn-sm btn-outline" data-action="delete" data-idx="${idx}">
                        <span class="material-icons-round" style="font-size:14px">delete</span>
                    </button>
                </div>
            </div>`;
    }).join('');

    list.querySelectorAll('[data-action="restore"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const order = heldOrders[idx];
        cart = [...order.items];
        currentDiscount = { ...order.discount };
        heldOrders.splice(idx, 1);
        saveHeldOrders();
        renderCart();
        renderHeldOrders();
        document.getElementById('held-orders-panel').classList.add('hidden');
        showToast('Order restored', 'success');
      });
    });

    list.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        heldOrders.splice(idx, 1);
        saveHeldOrders();
        renderHeldOrders();
        showToast('Held order deleted', 'info');
      });
    });
  }

  // ===== INVENTORY =====
  function renderInventory() {
    renderInventoryStats();
    renderInventoryTable();
  }

  function renderInventoryStats() {
    const totalProducts = products.length;
    const totalStock = products.reduce((s, p) => s + p.stock, 0);
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    const outOfStock = products.filter(p => p.stock === 0).length;

    document.getElementById('stat-total-products').textContent = totalProducts;
    document.getElementById('stat-total-stock').textContent = totalStock.toLocaleString();
    document.getElementById('stat-low-stock').textContent = lowStock;
    document.getElementById('stat-out-of-stock').textContent = outOfStock;
  }

  function renderInventoryTable() {
    const tbody = document.getElementById('inventory-tbody');
    const search = document.getElementById('inventory-search').value.toLowerCase();
    const catFilter = document.getElementById('inventory-category-filter').value;
    const stockFilter = document.getElementById('inventory-stock-filter').value;

    let filtered = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search);
      const matchCat = catFilter === 'all' || p.category === catFilter;
      let matchStock = true;
      if (stockFilter === 'in-stock') matchStock = p.stock > p.minStock;
      if (stockFilter === 'low-stock') matchStock = p.stock > 0 && p.stock <= p.minStock;
      if (stockFilter === 'out-of-stock') matchStock = p.stock === 0;
      return matchSearch && matchCat && matchStock;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">No products found</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      let statusClass = 'in-stock';
      let statusText = 'In Stock';
      if (p.stock === 0) { statusClass = 'out-of-stock'; statusText = 'Out of Stock'; }
      else if (p.stock <= p.minStock) { statusClass = 'low-stock'; statusText = 'Low Stock'; }

      return `<tr>
                <td>
                    <div class="product-cell">
                        <span class="product-cell-emoji">${p.emoji || '📦'}</span>
                        <span class="product-cell-name">${p.name}</span>
                    </div>
                </td>
                <td style="color:var(--text-muted);font-family:monospace;">${p.sku}</td>
                <td>${p.category}</td>
                <td style="font-weight:600;">$${p.price.toFixed(2)}</td>
                <td style="color:var(--text-muted);">$${p.cost.toFixed(2)}</td>
                <td style="font-weight:700;">${p.stock}</td>
                <td><span class="stock-status ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn" title="Adjust Stock" data-action="stock" data-id="${p.id}">
                            <span class="material-icons-round">add_circle</span>
                        </button>
                        <button class="action-btn" title="Edit Product" data-action="edit" data-id="${p.id}">
                            <span class="material-icons-round">edit</span>
                        </button>
                        <button class="action-btn danger" title="Delete Product" data-action="delete" data-id="${p.id}">
                            <span class="material-icons-round">delete</span>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-action="stock"]').forEach(btn => {
      btn.addEventListener('click', () => openStockModal(btn.dataset.id));
    });
    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => openEditProduct(btn.dataset.id));
    });
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
  }

  function updateLowStockBadge() {
    const lowCount = products.filter(p => (p.stock === 0 || p.stock <= p.minStock)).length;
    const badge = document.getElementById('low-stock-badge');
    if (lowCount > 0) {
      badge.textContent = lowCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // ===== PRODUCT FORM =====
  function openAddProduct() {
    editingProductId = null;
    document.getElementById('product-modal-title').innerHTML = '<span class="material-icons-round">add_box</span> Add Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-min-stock').value = '10';
    showModal('product-modal');
  }

  function openEditProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    document.getElementById('product-modal-title').innerHTML = '<span class="material-icons-round">edit</span> Edit Product';
    document.getElementById('product-id').value = id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-sku').value = product.sku;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-emoji').value = product.emoji || '';
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-cost').value = product.cost;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-min-stock').value = product.minStock;
    showModal('product-modal');
  }

  function saveProduct(e) {
    e.preventDefault();

    const data = {
      name: document.getElementById('product-name').value.trim(),
      sku: document.getElementById('product-sku').value.trim().toUpperCase(),
      category: document.getElementById('product-category').value.trim(),
      emoji: document.getElementById('product-emoji').value.trim() || '📦',
      price: parseFloat(document.getElementById('product-price').value) || 0,
      cost: parseFloat(document.getElementById('product-cost').value) || 0,
      stock: parseInt(document.getElementById('product-stock').value) || 0,
      minStock: parseInt(document.getElementById('product-min-stock').value) || 10,
    };

    if (!data.name || !data.sku || !data.category) {
      showToast('Please fill all required fields', 'warning');
      return;
    }

    if (editingProductId) {
      const idx = products.findIndex(p => p.id === editingProductId);
      if (idx > -1) {
        products[idx] = { ...products[idx], ...data };
      }
      showToast('Product updated successfully', 'success');
    } else {
      // Check SKU uniqueness
      if (products.some(p => p.sku === data.sku)) {
        showToast('SKU already exists', 'warning');
        return;
      }
      data.id = 'P' + Date.now().toString().slice(-6);
      products.push(data);
      showToast('Product added successfully', 'success');
    }

    saveProducts();
    hideModal('product-modal');
    renderCategoryTabs();
    renderProducts();
    renderInventory();
    updateLowStockBadge();
  }

  function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    products = products.filter(p => p.id !== id);
    saveProducts();
    renderCategoryTabs();
    renderProducts();
    renderInventory();
    updateLowStockBadge();
    showToast('Product deleted', 'info');
  }

  // ===== STOCK ADJUSTMENT =====
  function openStockModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    adjustingStockProductId = id;
    stockAdjType = 'add';
    document.getElementById('stock-product-name').textContent = `${product.emoji} ${product.name}`;
    document.getElementById('stock-current-display').textContent = `Current Stock: ${product.stock} units`;
    document.getElementById('stock-adj-value').value = '';
    document.getElementById('stock-adj-reason').value = '';
    document.getElementById('stock-adj-label').textContent = 'Quantity to Add';

    document.querySelectorAll('.stock-adj-type').forEach(b => b.classList.remove('active'));
    document.querySelector('.stock-adj-type[data-adj="add"]').classList.add('active');

    showModal('stock-modal');
  }

  function saveStockAdjustment() {
    const product = products.find(p => p.id === adjustingStockProductId);
    if (!product) return;

    const value = parseInt(document.getElementById('stock-adj-value').value) || 0;
    if (value < 0) {
      showToast('Enter a valid quantity', 'warning');
      return;
    }

    if (stockAdjType === 'add') {
      product.stock += value;
    } else {
      product.stock = value;
    }

    saveProducts();
    hideModal('stock-modal');
    renderInventory();
    renderProducts();
    updateLowStockBadge();
    showToast(`Stock updated: ${product.name} → ${product.stock} units`, 'success');
  }

  // ===== TRANSACTIONS =====
  function renderTransactions() {
    const list = document.getElementById('transactions-list');
    const dateFilter = document.getElementById('tx-date-filter').value;

    let filtered = transactions;
    if (dateFilter) {
      filtered = transactions.filter(tx => tx.date.startsWith(dateFilter));
    }

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state">
                <span class="material-icons-round">receipt_long</span>
                <p>No transactions found</p>
            </div>`;
      return;
    }

    list.innerHTML = filtered.map(tx => {
      const date = new Date(tx.date);
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const itemCount = tx.items.reduce((s, i) => s + i.qty, 0);
      const itemNames = tx.items.map(i => i.name).join(', ');

      return `<div class="tx-card" data-tx-id="${tx.id}">
                <div class="tx-icon"><span class="material-icons-round">check_circle</span></div>
                <div class="tx-info">
                    <div class="tx-id">${tx.id}</div>
                    <div class="tx-details">${itemCount} items • ${tx.paymentMethod.toUpperCase()}</div>
                    <div class="tx-details" style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${itemNames}</div>
                </div>
                <div class="tx-amount">$${tx.total.toFixed(2)}</div>
                <div class="tx-time">
                    <div>${timeStr}</div>
                    <div>${dateStr}</div>
                </div>
            </div>`;
    }).join('');

    list.querySelectorAll('.tx-card').forEach(card => {
      card.addEventListener('click', () => {
        const tx = transactions.find(t => t.id === card.dataset.txId);
        if (tx) showReceipt(tx);
      });
    });
  }

  // ===== DASHBOARD =====
  function renderDashboard() {
    const today = new Date().toISOString().slice(0, 10);
    const todayTx = transactions.filter(tx => tx.date.startsWith(today));

    const revenue = todayTx.reduce((s, tx) => s + tx.total, 0);
    const orders = todayTx.length;
    const itemsSold = todayTx.reduce((s, tx) => s + tx.items.reduce((si, i) => si + i.qty, 0), 0);
    const avgOrder = orders > 0 ? revenue / orders : 0;

    document.getElementById('metric-revenue').textContent = `$${revenue.toFixed(2)}`;
    document.getElementById('metric-orders').textContent = orders;
    document.getElementById('metric-items-sold').textContent = itemsSold;
    document.getElementById('metric-avg-order').textContent = `$${avgOrder.toFixed(2)}`;

    renderHourlyChart(todayTx);
    renderTopProducts(todayTx);
    renderCategoryChart(todayTx);
    renderRecentSales();
  }

  function renderHourlyChart(todayTx) {
    const container = document.getElementById('hourly-chart');
    const hourData = {};
    for (let h = 8; h <= 22; h++) hourData[h] = 0;

    todayTx.forEach(tx => {
      const hour = new Date(tx.date).getHours();
      if (hourData[hour] !== undefined) hourData[hour] += tx.total;
    });

    const maxVal = Math.max(...Object.values(hourData), 1);

    container.innerHTML = Object.entries(hourData).map(([hour, val]) => {
      const heightPercent = (val / maxVal) * 100;
      const h = parseInt(hour);
      const label = h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`;
      return `<div class="chart-bar-wrap">
                ${val > 0 ? `<span class="chart-bar-value">$${val.toFixed(0)}</span>` : ''}
                <div class="chart-bar" style="height:${Math.max(heightPercent, 2)}%"></div>
                <span class="chart-bar-label">${label}</span>
            </div>`;
    }).join('');
  }

  function renderTopProducts(todayTx) {
    const container = document.getElementById('top-products');
    const productSales = {};

    todayTx.forEach(tx => {
      tx.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, emoji: item.emoji, qty: 0, revenue: 0 };
        }
        productSales[item.productId].qty += item.qty;
        productSales[item.productId].revenue += item.total;
      });
    });

    const sorted = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    if (sorted.length === 0) {
      container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:20px;">No sales today</div>`;
      return;
    }

    const rankClasses = ['gold', 'silver', 'bronze', '', ''];
    container.innerHTML = sorted.map((p, i) => `
            <div class="top-product-item">
                <span class="top-product-rank ${rankClasses[i]}">${i + 1}</span>
                <div class="top-product-info">
                    <div class="top-product-name">${p.emoji} ${p.name}</div>
                    <div class="top-product-qty">${p.qty} sold</div>
                </div>
                <span class="top-product-revenue">$${p.revenue.toFixed(2)}</span>
            </div>
        `).join('');
  }

  function renderCategoryChart(todayTx) {
    const container = document.getElementById('category-chart');
    const catSales = {};

    todayTx.forEach(tx => {
      tx.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cat = product ? product.category : 'Other';
        if (!catSales[cat]) catSales[cat] = 0;
        catSales[cat] += item.total;
      });
    });

    const sorted = Object.entries(catSales).sort((a, b) => b[1] - a[1]);
    const maxVal = Math.max(...Object.values(catSales), 1);
    const colors = ['#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#74b9ff', '#fd79a8'];

    if (sorted.length === 0) {
      container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:20px;">No category data</div>`;
      return;
    }

    container.innerHTML = sorted.map(([cat, val], i) => {
      const widthPercent = (val / maxVal) * 100;
      const color = colors[i % colors.length];
      return `<div class="category-bar-item">
                <span class="category-bar-name">${cat}</span>
                <div class="category-bar-track">
                    <div class="category-bar-fill" style="width:${widthPercent}%;background:${color}"></div>
                </div>
                <span class="category-bar-value">$${val.toFixed(2)}</span>
            </div>`;
    }).join('');
  }

  function renderRecentSales() {
    const container = document.getElementById('recent-sales');
    const recent = transactions.slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:20px;">No recent sales</div>`;
      return;
    }

    container.innerHTML = recent.map(tx => {
      const time = new Date(tx.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const itemNames = tx.items.map(i => `${i.emoji} ${i.name}`).join(', ');
      return `<div class="recent-sale-item">
                <span class="recent-sale-id">${tx.id.slice(-8)}</span>
                <span class="recent-sale-items">${itemNames}</span>
                <span class="recent-sale-total">$${tx.total.toFixed(2)}</span>
                <span class="recent-sale-time">${time}</span>
            </div>`;
    }).join('');
  }

  // ===== EXPORT INVENTORY =====
  function exportInventory() {
    const headers = ['Name', 'SKU', 'Category', 'Price', 'Cost', 'Stock', 'Min Stock', 'Status'];
    const rows = products.map(p => {
      let status = 'In Stock';
      if (p.stock === 0) status = 'Out of Stock';
      else if (p.stock <= p.minStock) status = 'Low Stock';
      return [p.name, p.sku, p.category, p.price.toFixed(2), p.cost.toFixed(2), p.stock, p.minStock, status];
    });

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(v => `"${v}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Inventory exported as CSV', 'success');
  }

  // ===== MODALS =====
  function showModal(id) {
    document.getElementById(id).classList.remove('hidden');
  }

  function hideModal(id) {
    document.getElementById(id).classList.add('hidden');
  }

  // ===== TOAST =====
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const iconMap = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
            <span class="material-icons-round toast-icon">${iconMap[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close"><span class="material-icons-round">close</span></button>
        `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => dismissToast(toast));

    setTimeout(() => dismissToast(toast), 3500);
  }

  function dismissToast(toast) {
    if (toast.classList.contains('toast-exit')) return;
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }

  // ===== RENDER ALL =====
  function renderAll() {
    renderCategoryTabs();
    renderProducts();
    renderCart();
  }

  // ===== EVENT LISTENERS =====
  function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => switchView(item.dataset.view));
    });

    // POS Search
    document.getElementById('pos-search').addEventListener('input', renderProducts);

    // Keyboard shortcut for search
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('pos-search').focus();
      }
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => {
          m.classList.add('hidden');
        });
        document.getElementById('held-orders-panel').classList.add('hidden');
      }
    });

    // Cart actions
    document.getElementById('clear-cart-btn').addEventListener('click', clearCart);
    document.getElementById('pay-btn').addEventListener('click', openPaymentModal);
    document.getElementById('discount-btn').addEventListener('click', openDiscountModal);
    document.getElementById('hold-btn').addEventListener('click', () => {
      if (cart.length > 0) {
        holdOrder();
      } else {
        showHeldOrders();
      }
    });

    // Hold panel
    document.getElementById('close-held-panel').addEventListener('click', () => {
      document.getElementById('held-orders-panel').classList.add('hidden');
    });

    // Payment modal
    document.getElementById('close-payment-modal').addEventListener('click', () => hideModal('payment-modal'));
    document.querySelectorAll('.payment-method').forEach(m => {
      m.addEventListener('click', () => updatePaymentMethod(m.dataset.method));
    });
    document.getElementById('cash-received').addEventListener('input', handleCashInput);
    document.getElementById('complete-payment-btn').addEventListener('click', completePayment);

    // Receipt modal
    document.getElementById('close-receipt-modal').addEventListener('click', () => hideModal('receipt-modal'));
    document.getElementById('new-sale-btn').addEventListener('click', () => {
      hideModal('receipt-modal');
      switchView('pos');
    });
    document.getElementById('print-receipt-btn').addEventListener('click', () => {
      const receipt = document.getElementById('receipt-content');
      const printWin = window.open('', '_blank', 'width=400,height=600');
      printWin.document.write(`
                <html><head><title>Receipt</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 10px; }
                    .receipt-header { text-align: center; padding-bottom: 10px; border-bottom: 2px dashed #ccc; margin-bottom: 10px; }
                    .receipt-brand { font-size: 18px; font-weight: 900; letter-spacing: 2px; }
                    .receipt-subtitle { font-size: 10px; color: #888; }
                    .receipt-info div, .receipt-totals div, .receipt-payment-info div, .receipt-item { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
                    .receipt-items { border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 6px 0; margin-bottom: 6px; }
                    .receipt-item-name { flex: 1; }
                    .receipt-item-qty { width: 40px; text-align: center; }
                    .receipt-item-total { width: 60px; text-align: right; font-weight: 600; }
                    .receipt-totals { padding: 4px 0; border-bottom: 2px dashed #ccc; margin-bottom: 10px; }
                    .receipt-total-final { font-size: 14px; font-weight: 900; }
                    .receipt-footer { text-align: center; font-size: 10px; color: #888; padding-top: 10px; border-top: 1px dashed #ccc; }
                </style></head><body>
                ${receipt.innerHTML}
                </body></html>
            `);
      printWin.document.close();
      printWin.focus();
      printWin.print();
    });

    // Product form modal
    document.getElementById('add-product-btn').addEventListener('click', openAddProduct);
    document.getElementById('close-product-modal').addEventListener('click', () => hideModal('product-modal'));
    document.getElementById('cancel-product-btn').addEventListener('click', () => hideModal('product-modal'));
    document.getElementById('product-form').addEventListener('submit', saveProduct);

    // Discount modal
    document.getElementById('close-discount-modal').addEventListener('click', () => hideModal('discount-modal'));
    document.querySelectorAll('.discount-type').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.discount-type').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateDiscountLabel(btn.dataset.type);
      });
    });
    document.getElementById('apply-discount-btn').addEventListener('click', applyDiscount);
    document.getElementById('remove-discount-btn').addEventListener('click', removeDiscount);

    // Stock modal
    document.getElementById('close-stock-modal').addEventListener('click', () => hideModal('stock-modal'));
    document.getElementById('cancel-stock-btn').addEventListener('click', () => hideModal('stock-modal'));
    document.querySelectorAll('.stock-adj-type').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.stock-adj-type').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        stockAdjType = btn.dataset.adj;
        document.getElementById('stock-adj-label').textContent =
          stockAdjType === 'add' ? 'Quantity to Add' : 'Set Stock To';
      });
    });
    document.getElementById('save-stock-btn').addEventListener('click', saveStockAdjustment);

    // Inventory search & filters
    document.getElementById('inventory-search').addEventListener('input', renderInventoryTable);
    document.getElementById('inventory-category-filter').addEventListener('change', renderInventoryTable);
    document.getElementById('inventory-stock-filter').addEventListener('change', renderInventoryTable);

    // Export
    document.getElementById('export-inventory-btn').addEventListener('click', exportInventory);

    // Transaction date filter
    document.getElementById('tx-date-filter').addEventListener('change', renderTransactions);

    // Modal overlay click to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.add('hidden');
      });
    });
  }

  // Start application
  document.addEventListener('DOMContentLoaded', init);
})();
