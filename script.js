// Sample product data
const products = [
    {
        id: 1,
        name: "Arduino Uno R3",
        description: "Microcontroller board based on the ATmega328P. Perfect for beginners and prototyping.",
        price: 24.99,
        category: "microcontrollers",
        icon: "fas fa-microchip",
        seller: "TechComponents Inc.",
        rating: 4.8,
        stock: 150
    },
    {
        id: 2,
        name: "DHT22 Temperature & Humidity Sensor",
        description: "High-precision digital temperature and humidity sensor with calibrated output.",
        price: 12.50,
        category: "sensors",
        icon: "fas fa-thermometer-half",
        seller: "SensorWorld",
        rating: 4.6,
        stock: 89
    },
    {
        id: 3,
        name: "16x2 LCD Display with I2C",
        description: "Blue backlight LCD display with I2C interface for easy connection and control.",
        price: 8.75,
        category: "displays",
        icon: "fas fa-tv",
        seller: "DisplayTech Pro",
        rating: 4.7,
        stock: 203
    }
];

// Shopping cart
let cart = [];

// User authentication
let currentUser = null;
let users = JSON.parse(localStorage.getItem('electromarket_users') || '[]');
let userProducts = JSON.parse(localStorage.getItem('electromarket_user_products') || '{}');

// Image handling
let selectedImages = [];
const MAX_IMAGES = 5;

// DOM elements
const productsGrid = document.getElementById('productsGrid');
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

// Auth elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const sellerDashboardModal = document.getElementById('sellerDashboardModal');
const userMenu = document.getElementById('userMenu');
const userEmail = document.getElementById('userEmail');
const sellerDashboardBtn = document.getElementById('sellerDashboardBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize the website
document.addEventListener('DOMContentLoaded', function() {
    loadUserSession();
    displayProducts(getAllProducts());
    updateCartUI();
    setupEventListeners();
    setupAuthEventListeners();
    updateImagePreview();
});

// Get all products (default + user products)
function getAllProducts() {
    let allProducts = [...products];

    // Add user products
    Object.values(userProducts).forEach(userProductList => {
        allProducts = allProducts.concat(userProductList);
    });

    return allProducts;
}

// Display products in the grid
function displayProducts(productsToShow) {
    productsGrid.innerHTML = '';

    productsToShow.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Create a product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-category', product.category);

    // Create image display
    let imageDisplay;
    if (product.images && product.images.length > 0) {
        const mainImage = product.images[0];
        const imageCount = product.images.length;

        imageDisplay = `
            <div class="product-image-gallery" onclick="openImageModal(${product.id})">
                <img class="product-image-main" src="${mainImage}" alt="${product.name}">
                ${imageCount > 1 ? `<div class="product-image-count">+${imageCount - 1}</div>` : ''}
            </div>
        `;
    } else {
        imageDisplay = `
            <div class="product-image">
                <i class="${product.icon}"></i>
            </div>
        `;
    }

    card.innerHTML = `
        ${imageDisplay}
        <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-meta">
                <small>Seller: ${product.seller}</small><br>
                <small>Rating: ${'★'.repeat(Math.floor(product.rating))} ${product.rating}/5</small><br>
                <small>Stock: ${product.stock} units</small>
            </div>
        </div>
        <div class="product-price">$${product.price}</div>
        <div class="product-actions">
            <button class="btn btn-primary" onclick="addToCart(${product.id})">
                <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
            <button class="btn btn-secondary" onclick="viewProduct(${product.id})">
                <i class="fas fa-eye"></i> View
            </button>
        </div>
    `;

    return card;
}

// Add product to cart
function addToCart(productId) {
    const allProducts = getAllProducts();
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    updateCartUI();
    showNotification(`${product.name} added to cart!`);
}

// Remove product from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    displayCartItems();
}

// Update cart quantity
function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            updateCartUI();
            displayCartItems();
        }
    }
}

// Update cart UI
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
}

// Display cart items in modal
function displayCartItems() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #666;">Your cart is empty</p>';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div>
                <h4>${item.name}</h4>
                <p>$${item.price} each</p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})" style="background: #dc3545; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})" style="background: #28a745; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">+</button>
                <button onclick="removeFromCart(${item.id})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-left: 10px;">Remove</button>
            </div>
        </div>
    `).join('');
}

// View product details
function viewProduct(productId) {
    const allProducts = getAllProducts();
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    // Get seller information
    const seller = users.find(u => u.id === product.sellerId) || {
        email: 'info@electromarket.com',
        businessName: product.seller,
        businessDescription: 'Verified ElectroMarket seller',
        createdAt: '2024-01-01T00:00:00.000Z'
    };

    // Store current product ID for image modal
    currentProductIdForDetail = productId;

    // Populate product detail modal
    populateProductDetailModal(product, seller);

    // Show the modal
    document.getElementById('productDetailModal').style.display = 'block';
}

// Populate product detail modal
function populateProductDetailModal(product, seller) {
    // Set product title
    document.getElementById('productDetailTitle').textContent = `${product.name} - Product Details`;
    document.getElementById('productDetailName').textContent = product.name;

    // Set price
    document.getElementById('productDetailPriceValue').textContent = `$${product.price}`;

    // Set rating
    const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
    document.getElementById('productDetailRating').innerHTML = `<span class="stars">${stars}</span>`;
    document.getElementById('productDetailRatingText').textContent = `${product.rating}/5`;

    // Set stock with color coding
    const stockElement = document.getElementById('productDetailStock');
    let stockClass = 'in-stock';
    let stockText = `✓ ${product.stock} units in stock`;

    if (product.stock === 0) {
        stockClass = 'out-of-stock';
        stockText = '✗ Out of stock';
    } else if (product.stock < 10) {
        stockClass = 'low-stock';
        stockText = `⚠ Only ${product.stock} units left`;
    }

    stockElement.className = `product-detail-stock ${stockClass}`;
    stockElement.innerHTML = `<strong>${stockText}</strong>`;

    // Set category
    document.getElementById('productDetailCategory').textContent = product.category.charAt(0).toUpperCase() + product.category.slice(1);

    // Set description
    document.getElementById('productDetailDescriptionText').textContent = product.description;

    // Set images
    setupProductDetailImages(product);

    // Set seller information
    setupSellerInformation(seller, product.sellerId);

    // Setup action buttons
    setupProductDetailActions(product);
}

// Setup product detail images
function setupProductDetailImages(product) {
    const mainImageContainer = document.getElementById('productDetailMainImage');
    const thumbnailsContainer = document.getElementById('productDetailThumbnails');

    if (product.images && product.images.length > 0) {
        // Set main image
        mainImageContainer.innerHTML = `
            <img src="${product.images[0]}" alt="${product.name}" onclick="openImageModal(${product.id})">
        `;

        // Set thumbnails if there are multiple images
        if (product.images.length > 1) {
            thumbnailsContainer.innerHTML = product.images.map((image, index) => `
                <div class="product-detail-thumb ${index === 0 ? 'active' : ''}" onclick="changeProductDetailMainImage('${image}', ${index})">
                    <img src="${image}" alt="${product.name} - Image ${index + 1}">
                </div>
            `).join('');
        } else {
            thumbnailsContainer.innerHTML = '';
        }
    } else {
        // Show icon if no images
        mainImageContainer.innerHTML = `<i class="${product.icon}"></i>`;
        thumbnailsContainer.innerHTML = '';
    }
}

// Change main image in product detail
function changeProductDetailMainImage(imageSrc, index) {
    const mainImageContainer = document.getElementById('productDetailMainImage');
    const thumbnails = document.querySelectorAll('.product-detail-thumb');

    // Update main image
    const productId = getCurrentProductId(); // We'll need to store this
    mainImageContainer.innerHTML = `<img src="${imageSrc}" alt="Product Image" onclick="openImageModal(${productId})">`;

    // Update active thumbnail
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

// Setup seller information
function setupSellerInformation(seller, sellerId) {
    document.getElementById('sellerBusinessName').textContent = seller.businessName;
    document.getElementById('sellerEmail').textContent = seller.email;
    document.getElementById('sellerBusinessDescription').textContent = seller.businessDescription || 'No description provided';

    // Format member since date
    const memberSince = new Date(seller.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
    });
    document.getElementById('sellerMemberSince').textContent = memberSince;

    // Calculate total products for this seller
    const sellerProducts = userProducts[sellerId] || [];
    document.getElementById('sellerTotalProducts').textContent = sellerProducts.length;
}

// Setup product detail action buttons
function setupProductDetailActions(product) {
    const addToCartBtn = document.getElementById('productDetailAddToCart');
    const contactSellerBtn = document.getElementById('productDetailContactSeller');

    // Add to cart button
    addToCartBtn.onclick = () => {
        addToCart(product.id);
    };

    // Disable if out of stock
    if (product.stock === 0) {
        addToCartBtn.disabled = true;
        addToCartBtn.innerHTML = '<i class="fas fa-times"></i> Out of Stock';
        addToCartBtn.style.background = '#6c757d';
    } else {
        addToCartBtn.disabled = false;
        addToCartBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
        addToCartBtn.style.background = '';
    }

    // Contact seller button
    contactSellerBtn.onclick = () => {
        const seller = users.find(u => u.id === product.sellerId);
        const subject = `Inquiry about ${product.name}`;
        const body = `Hello,\n\nI'm interested in your product "${product.name}" listed on ElectroMarket.\n\nPlease provide more information.\n\nThank you!`;
        const mailtoLink = `mailto:${seller?.email || 'info@electromarket.com'}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
    };
}

// Store current product ID for image modal
let currentProductIdForDetail = null;

function getCurrentProductId() {
    return currentProductIdForDetail;
}

// Filter products by category
function filterProducts(category) {
    const allProducts = getAllProducts();
    const filteredProducts = category === 'all' ? allProducts : allProducts.filter(p => p.category === category);
    displayProducts(filteredProducts);
}

// Search products
function searchProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const allProducts = getAllProducts();

    if (searchTerm === '') {
        displayProducts(allProducts);
        return;
    }

    const filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );

    displayProducts(filteredProducts);
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const backgroundColor = type === 'error' ? '#dc3545' : '#28a745';

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 3000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Scroll to products section
function scrollToProducts() {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// Authentication Functions
function loadUserSession() {
    const savedUser = localStorage.getItem('electromarket_current_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
}

function updateAuthUI() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        userEmail.textContent = currentUser.email;
    } else {
        loginBtn.style.display = 'inline-block';
        registerBtn.style.display = 'inline-block';
        userMenu.style.display = 'none';
    }
}

function registerUser(userData) {
    // Check if user already exists
    const existingUser = users.find(user => user.email === userData.email);
    if (existingUser) {
        showNotification('User already exists with this email!', 'error');
        return false;
    }

    // Create new user
    const newUser = {
        id: Date.now(),
        email: userData.email,
        password: userData.password, // In real app, this should be hashed
        businessName: userData.businessName,
        businessDescription: userData.businessDescription,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('electromarket_users', JSON.stringify(users));

    // Initialize empty product list for user
    userProducts[newUser.id] = [];
    localStorage.setItem('electromarket_user_products', JSON.stringify(userProducts));

    showNotification('Registration successful!', 'success');
    return true;
}

function loginUser(email, password) {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('electromarket_current_user', JSON.stringify(currentUser));
        updateAuthUI();
        showNotification(`Welcome back, ${user.businessName}!`, 'success');
        return true;
    } else {
        showNotification('Invalid email or password!', 'error');
        return false;
    }
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('electromarket_current_user');
    updateAuthUI();
    closeModal('sellerDashboardModal');
    showNotification('Logged out successfully!', 'success');
}

// Product Management Functions
function addProduct(productData) {
    if (!currentUser) {
        showNotification('Please login first!', 'error');
        return false;
    }

    const newProduct = {
        id: Date.now(),
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        category: productData.category,
        icon: productData.icon,
        seller: currentUser.businessName,
        rating: 5.0, // New products start with 5 stars
        stock: parseInt(productData.stock),
        sellerId: currentUser.id,
        images: selectedImages.slice(), // Copy the selected images
        createdAt: new Date().toISOString()
    };

    if (!userProducts[currentUser.id]) {
        userProducts[currentUser.id] = [];
    }

    userProducts[currentUser.id].push(newProduct);
    localStorage.setItem('electromarket_user_products', JSON.stringify(userProducts));

    // Clear selected images
    selectedImages = [];
    updateImagePreview();

    // Refresh products display
    displayProducts(getAllProducts());
    displaySellerProducts();

    showNotification('Product added successfully!', 'success');
    return true;
}

function updateProductStock(productId, newStock) {
    if (!currentUser) return false;

    const userProductList = userProducts[currentUser.id] || [];
    const product = userProductList.find(p => p.id === productId);

    if (product) {
        product.stock = parseInt(newStock);
        localStorage.setItem('electromarket_user_products', JSON.stringify(userProducts));
        displayProducts(getAllProducts());
        displaySellerProducts();
        showNotification('Stock updated successfully!', 'success');
        return true;
    }

    return false;
}

function deleteProduct(productId) {
    if (!currentUser) return false;

    if (!userProducts[currentUser.id]) return false;

    userProducts[currentUser.id] = userProducts[currentUser.id].filter(p => p.id !== productId);
    localStorage.setItem('electromarket_user_products', JSON.stringify(userProducts));

    displayProducts(getAllProducts());
    displaySellerProducts();
    showNotification('Product deleted successfully!', 'success');
    return true;
}

function displaySellerProducts() {
    const sellerProductsContainer = document.getElementById('sellerProducts');
    if (!currentUser || !sellerProductsContainer) return;

    const userProductList = userProducts[currentUser.id] || [];

    if (userProductList.length === 0) {
        sellerProductsContainer.innerHTML = '<p>No products added yet. Use the "Add Product" tab to get started!</p>';
        return;
    }

    sellerProductsContainer.innerHTML = userProductList.map(product => {
        let imageDisplay = '';
        if (product.images && product.images.length > 0) {
            imageDisplay = `
                <div class="product-image-gallery" onclick="openImageModal(${product.id})" style="margin-bottom: 10px; height: 120px;">
                    <img class="product-image-main" src="${product.images[0]}" alt="${product.name}">
                    ${product.images.length > 1 ? `<div class="product-image-count">+${product.images.length - 1}</div>` : ''}
                </div>
            `;
        } else {
            imageDisplay = `
                <div class="product-image" style="margin-bottom: 10px; height: 120px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; border-radius: 8px;">
                    <i class="${product.icon}" style="font-size: 2rem; color: #666;"></i>
                </div>
            `;
        }

        return `
            <div class="seller-product-card">
                ${imageDisplay}
                <h4>${product.name}</h4>
                <div class="product-meta">
                    <p><strong>Price:</strong> $${product.price}</p>
                    <p><strong>Category:</strong> ${product.category}</p>
                    <p><strong>Stock:</strong> <input type="number" value="${product.stock}" min="0" onchange="updateProductStock(${product.id}, this.value)" style="width: 80px; padding: 2px;"></p>
                    <p><strong>Rating:</strong> ${product.rating}/5</p>
                    <p><strong>Images:</strong> ${product.images ? product.images.length : 0}</p>
                </div>
                <div class="seller-product-actions">
                    <button class="btn btn-danger btn-small" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Modal and UI Helper Functions
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Clear current product ID when closing product detail modal
    if (modalId === 'productDetailModal') {
        currentProductIdForDetail = null;
    }
}

function switchToLogin() {
    closeModal('registerModal');
    document.getElementById('loginModal').style.display = 'block';
}

function switchToRegister() {
    closeModal('loginModal');
    document.getElementById('registerModal').style.display = 'block';
}

function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');

    // Load seller products if products tab is selected
    if (tabName === 'products') {
        displaySellerProducts();
    }
}

// Image Handling Functions
function handleImageUpload(event) {
    const files = Array.from(event.target.files);

    if (files.length + selectedImages.length > MAX_IMAGES) {
        showNotification(`You can only upload up to ${MAX_IMAGES} images!`, 'error');
        return;
    }

    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                selectedImages.push(e.target.result);
                updateImagePreview();
            };
            reader.readAsDataURL(file);
        }
    });
}

function updateImagePreview() {
    const previewContainer = document.getElementById('imagePreview');

    if (selectedImages.length === 0) {
        previewContainer.innerHTML = '<p style="color: #666; text-align: center; margin: 20px 0;">No images selected</p>';
        return;
    }

    previewContainer.innerHTML = selectedImages.map((image, index) => `
        <div class="image-preview-item ${index === 0 ? 'main-image' : ''}">
            <img src="${image}" alt="Preview ${index + 1}">
            <button class="image-preview-remove" onclick="removeImage(${index})" type="button">×</button>
            ${index === 0 ? '<div class="main-image-badge">Main</div>' : ''}
        </div>
    `).join('');
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    updateImagePreview();
}

function openImageModal(productId) {
    const allProducts = getAllProducts();
    const product = allProducts.find(p => p.id === productId);

    if (!product || !product.images || product.images.length === 0) {
        return;
    }

    const modal = document.getElementById('imageModal');
    const mainImage = document.getElementById('imageModalMain');
    const thumbnailsContainer = document.getElementById('imageModalThumbnails');

    // Set main image
    mainImage.src = product.images[0];
    mainImage.alt = product.name;

    // Create thumbnails
    if (product.images.length > 1) {
        thumbnailsContainer.innerHTML = product.images.map((image, index) => `
            <img class="image-modal-thumb ${index === 0 ? 'active' : ''}"
                 src="${image}"
                 alt="Image ${index + 1}"
                 onclick="changeMainImage('${image}', ${index})">
        `).join('');
    } else {
        thumbnailsContainer.innerHTML = '';
    }

    modal.style.display = 'block';
}

function changeMainImage(imageSrc, index) {
    const mainImage = document.getElementById('imageModalMain');
    const thumbnails = document.querySelectorAll('.image-modal-thumb');

    mainImage.src = imageSrc;

    // Update active thumbnail
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

function closeImageModal() {
    document.getElementById('imageModal').style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
    // Cart modal
    cartBtn.addEventListener('click', () => {
        cartModal.style.display = 'block';
        displayCartItems();
    });
    
    // Close modal
    document.querySelector('.close').addEventListener('click', () => {
        cartModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });
    
    // Search functionality
    searchBtn.addEventListener('click', searchProducts);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchProducts();
        }
    });
    
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Filter products
            filterProducts(btn.getAttribute('data-category'));
        });
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Setup authentication event listeners
function setupAuthEventListeners() {
    // Login button
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });

    // Register button
    registerBtn.addEventListener('click', () => {
        registerModal.style.display = 'block';
    });

    // Seller dashboard button
    sellerDashboardBtn.addEventListener('click', () => {
        sellerDashboardModal.style.display = 'block';
        displaySellerProducts();
    });

    // Logout button
    logoutBtn.addEventListener('click', () => {
        logoutUser();
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (loginUser(email, password)) {
            closeModal('loginModal');
            document.getElementById('loginForm').reset();
        }
    });

    // Register form
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData);

        // Validate Gmail address
        if (!userData.email.endsWith('@gmail.com')) {
            showNotification('Please use a Gmail address!', 'error');
            return;
        }

        // Validate password confirmation
        if (userData.password !== userData.confirmPassword) {
            showNotification('Passwords do not match!', 'error');
            return;
        }

        if (registerUser(userData)) {
            closeModal('registerModal');
            document.getElementById('registerForm').reset();
        }
    });

    // Add product form
    document.getElementById('addProductForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const productData = Object.fromEntries(formData);

        if (addProduct(productData)) {
            document.getElementById('addProductForm').reset();
            selectedImages = [];
            updateImagePreview();
            showTab('products');
        }
    });

    // Image upload handling
    document.getElementById('productImages').addEventListener('change', handleImageUpload);

    // Image modal close
    document.querySelector('.image-modal-close').addEventListener('click', closeImageModal);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') || e.target.classList.contains('image-modal')) {
            e.target.style.display = 'none';
            // Clear current product ID when closing product detail modal
            if (e.target.id === 'productDetailModal') {
                currentProductIdForDetail = null;
            }
        }
    });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
