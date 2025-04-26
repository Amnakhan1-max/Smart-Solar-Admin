// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, query, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHeQY0lvfGMfF6oU_f9pmQciBuDQutYy4",
    authDomain: "smartsolar-58e95.firebaseapp.com",
    projectId: "smartsolar-58e95",
    storageBucket: "smartsolar-58e95.firebasestorage.app",
    messagingSenderId: "996412775119",
    appId: "1:996412775119:web:270bcb56cefc5a6429f5ba",
    measurementId: "G-M742NLPMJJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const ordersBtn = document.getElementById('ordersBtn');
const bookingsBtn = document.getElementById('bookingsBtn');
const productsBtn = document.getElementById('productsBtn');
const contentContainers = document.querySelectorAll('.content-container');
const addProductBtn = document.getElementById('add-product-btn');
const addProductModal = document.getElementById('add-product-modal');
const closeModalBtn = document.querySelector('.close');
const addProductForm = document.getElementById('add-product-form');

// Pagination settings
const ITEMS_PER_PAGE = 5;
let lastVisibleDocs = {
    orders: null,
    bookings: null,
    products: null
};
let currentPages = {
    orders: 1,
    bookings: 1,
    products: 1
};
let totalPages = {
    orders: 0,
    bookings: 0,
    products: 0
};
let allDocs = {
    orders: [],
    bookings: [],
    products: []
};

// Event Listeners
ordersBtn.addEventListener('click', () => switchTab('orders'));
bookingsBtn.addEventListener('click', () => switchTab('bookings'));
productsBtn.addEventListener('click', () => switchTab('products'));
addProductBtn.addEventListener('click', openAddProductModal);
closeModalBtn.addEventListener('click', closeAddProductModal);
addProductForm.addEventListener('submit', handleAddProduct);

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === addProductModal) {
        closeAddProductModal();
    }
});

// Initialize data
document.addEventListener('DOMContentLoaded', () => {
    fetchOrders();
});

// Tab switching function
function switchTab(tabName) {
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${tabName}Btn`).classList.add('active');

    // Show active content container
    contentContainers.forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(`${tabName}-container`).classList.add('active');

    // Load data for selected tab if not already loaded
    if (tabName === 'orders' && document.getElementById('orders-list').children.length === 0) {
        fetchOrders();
    } else if (tabName === 'bookings' && document.getElementById('bookings-list').children.length === 0) {
        fetchBookings();
    } else if (tabName === 'products' && document.getElementById('products-list').children.length === 0) {
        fetchProducts();
    }
}

// Fetch orders from Firestore
async function fetchOrders() {
    try {
        const ordersCollection = collection(db, "orders");
        const snapshot = await getDocs(ordersCollection);
        
        allDocs.orders = [];
        snapshot.forEach(doc => {
            allDocs.orders.push({ id: doc.id, ...doc.data() });
        });
        
        totalPages.orders = Math.ceil(allDocs.orders.length / ITEMS_PER_PAGE);
        displayOrders(1);
        createPagination('orders', totalPages.orders);
    } catch (error) {
        console.error("Error fetching orders: ", error);
        document.getElementById('orders-list').innerHTML = `<div class="error-message">Error loading orders. Please try again later.</div>`;
    }
}

// Display orders with pagination
function displayOrders(page) {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';
    
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const ordersToDisplay = allDocs.orders.slice(startIndex, endIndex);
    
    if (ordersToDisplay.length === 0) {
        ordersList.innerHTML = '<div class="no-data">No orders found</div>';
        return;
    }
    
    ordersToDisplay.forEach(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
        
        const orderCard = document.createElement('div');
        orderCard.className = 'data-card';
        
        let itemsList = '';
        if (order.items && order.items.length > 0) {
            itemsList = '<ul class="items-list">';
            order.items.forEach(item => {
                itemsList += `<li>${item.quantity} x ${item.title} - RS ${item.price} (Total: RS ${item.total})</li>`;
            });
            itemsList += '</ul>';
        }
        
        orderCard.innerHTML = `
            <div class="order-header">
                <h3>Order</h3>
                <span class="status ${order.status || 'pending'}">${order.status || 'Pending'}</span>
            </div>
            <p><span class="label">Date:</span> ${orderDate}</p>
            <p><span class="label">Total Amount:</span> RS ${order.totalAmount}</p>
            <p><span class="label">Payment Method:</span> ${order.paymentMethod}</p>
            <p><span class="label">Address:</span> ${order.address}, ${order.city}</p>
            <p><span class="label">Items:</span></p>
            ${itemsList}
        `;
        
        ordersList.appendChild(orderCard);
    });
    
    currentPages.orders = page;
    updatePaginationButtons('orders');
}

// Fetch bookings from Firestore
async function fetchBookings() {
    try {
        const bookingsCollection = collection(db, "bookings");
        const snapshot = await getDocs(bookingsCollection);
        
        allDocs.bookings = [];
        snapshot.forEach(doc => {
            allDocs.bookings.push({ id: doc.id, ...doc.data() });
        });
        
        totalPages.bookings = Math.ceil(allDocs.bookings.length / ITEMS_PER_PAGE);
        displayBookings(1);
        createPagination('bookings', totalPages.bookings);
    } catch (error) {
        console.error("Error fetching bookings: ", error);
        document.getElementById('bookings-list').innerHTML = `<div class="error-message">Error loading bookings. Please try again later.</div>`;
    }
}

// Display bookings with pagination
function displayBookings(page) {
    const bookingsList = document.getElementById('bookings-list');
    bookingsList.innerHTML = '';
    
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const bookingsToDisplay = allDocs.bookings.slice(startIndex, endIndex);
    
    if (bookingsToDisplay.length === 0) {
        bookingsList.innerHTML = '<div class="no-data">No bookings found</div>';
        return;
    }
    
    bookingsToDisplay.forEach(booking => {
        const bookingDate = booking.timestamp ? new Date(booking.timestamp.seconds * 1000).toLocaleDateString() : booking.date || 'N/A';
        
        const bookingCard = document.createElement('div');
        bookingCard.className = 'data-card';
        
        let packagesList = '';
        if (booking.packageNames && booking.packageNames.length > 0) {
            packagesList = '<ul class="packages-list">';
            booking.packageNames.forEach((pkg, index) => {
                const price = booking.packagePrices && booking.packagePrices[index] ? booking.packagePrices[index] : 'N/A';
                packagesList += `<li>${pkg} - RS ${price}</li>`;
            });
            packagesList += '</ul>';
        }
        
        bookingCard.innerHTML = `
            <div class="booking-header">
                <h3>${booking.serviceType || 'Service Booking'}</h3>
                <span class="status ${booking.status || 'pending'}">${booking.status || 'Pending'}</span>
            </div>
            <p><span class="label">Date:</span> ${booking.date || 'N/A'} at ${booking.time || 'N/A'}</p>
            <p><span class="label">Category:</span> ${booking.category || 'N/A'}</p>
            <p><span class="label">Location:</span> ${booking.location || 'N/A'}</p>
            <p><span class="label">System:</span> ${booking.companyAndModel || 'N/A'} (${booking.watt || 'N/A'})</p>
            <p><span class="label">Total Price:</span> RS ${booking.totalPrice || 'N/A'}</p>
            <p><span class="label">Packages:</span></p>
            ${packagesList}
            <p><span class="label">User Email:</span> ${booking.userEmail || 'N/A'}</p>
        `;
        
        bookingsList.appendChild(bookingCard);
    });
    
    currentPages.bookings = page;
    updatePaginationButtons('bookings');
}

// Fetch products from Firestore
async function fetchProducts() {
    try {
        const productsCollection = collection(db, "products");
        const snapshot = await getDocs(productsCollection);
        
        allDocs.products = [];
        snapshot.forEach(doc => {
            allDocs.products.push({ id: doc.id, ...doc.data() });
        });
        
        totalPages.products = Math.ceil(allDocs.products.length / ITEMS_PER_PAGE);
        displayProducts(1);
        createPagination('products', totalPages.products);
    } catch (error) {
        console.error("Error fetching products: ", error);
        document.getElementById('products-list').innerHTML = `<div class="error-message">Error loading products. Please try again later.</div>`;
    }
}

// Display products with pagination
function displayProducts(page) {
    const productsList = document.getElementById('products-list');
    productsList.innerHTML = '';
    
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const productsToDisplay = allDocs.products.slice(startIndex, endIndex);
    
    if (productsToDisplay.length === 0) {
        productsList.innerHTML = '<div class="no-data">No products found</div>';
        return;
    }
    
    productsToDisplay.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'data-card product-card';
        
        // Extract the numeric value from the price string (RS 50000 -> 50000)
        const priceValue = product.price ? product.price.replace(/[^\d]/g, '') : 'N/A';
        
        productCard.innerHTML = `
            <div class="product-header">
                <h3>${product.title || 'Unnamed Product'}</h3>
                <span class="product-price">${product.price || 'Price N/A'}</span>
            </div>
            <p><span class="label">Category:</span> ${product.category || 'N/A'}</p>
            <p><span class="label">About:</span> ${product.about || 'N/A'}</p>
            <p><span class="label">Description:</span> ${product.description || 'N/A'}</p>
            <details>
                <summary>Specifications and Guide</summary>
                <p><span class="label">Specification:</span> ${product.specification || 'N/A'}</p>
                <p><span class="label">Guide:</span> ${product.guide || 'N/A'}</p>
            </details>
            <div class="product-actions">
                <button class="delete-btn" data-id="${product.id}">Delete</button>
            </div>
        `;
        
        productsList.appendChild(productCard);
    });
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            if (productId) {
                deleteProduct(productId);
            }
        });
    });
    
    currentPages.products = page;
    updatePaginationButtons('products');
}

// Create pagination controls
function createPagination(type, totalPages) {
    const paginationContainer = document.getElementById(`${type}-pagination`);
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Prev';
    prevBtn.addEventListener('click', () => {
        if (currentPages[type] > 1) {
            navigateToPage(type, currentPages[type] - 1);
        }
    });
    paginationContainer.appendChild(prevBtn);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => navigateToPage(type, i));
        if (i === 1) {
            pageBtn.classList.add('active');
        }
        paginationContainer.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.addEventListener('click', () => {
        if (currentPages[type] < totalPages) {
            navigateToPage(type, currentPages[type] + 1);
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// Navigate to specific page
function navigateToPage(type, page) {
    if (page < 1 || page > totalPages[type]) return;
    
    if (type === 'orders') {
        displayOrders(page);
    } else if (type === 'bookings') {
        displayBookings(page);
    } else if (type === 'products') {
        displayProducts(page);
    }
}

// Update pagination buttons active state
function updatePaginationButtons(type) {
    const paginationContainer = document.getElementById(`${type}-pagination`);
    const pageButtons = paginationContainer.querySelectorAll('button');
    
    pageButtons.forEach(btn => {
        if (!isNaN(parseInt(btn.textContent))) {
            if (parseInt(btn.textContent) === currentPages[type]) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

// Open add product modal
function openAddProductModal() {
    addProductModal.style.display = 'block';
    addProductForm.reset();
}

// Close add product modal
function closeAddProductModal() {
    addProductModal.style.display = 'none';
}

// Upload image to Firebase Storage
async function uploadImage(file) {
    const timestamp = new Date().getTime();
    const fileName = `product_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `product_images/${fileName}`);
    
    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
}

// Handle adding new product
async function handleAddProduct(e) {
    e.preventDefault();
    
    const submitBtn = addProductForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Adding...';
    submitBtn.disabled = true;
    
    try {
        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const priceValue = document.getElementById('price').value;
        const about = document.getElementById('about').value;
        const description = document.getElementById('description').value;
        const specification = document.getElementById('specification').value;
        const guide = document.getElementById('guide').value;
        const imageUrl = document.getElementById('image').value;
        
        // if (imageFile) {
        //     // Show loading state
        //     document.getElementById('upload-status').textContent = 'Uploading image...';
            
        //     // Upload image and get URL
        //     imageUrl = await uploadImage(imageFile);
            
        //     document.getElementById('upload-status').textContent = 'Image uploaded successfully!';
        // }
        
        const newProduct = {
            title: title,
            title_lowercase: title.toLowerCase(),
            category: category,
            price: `RS ${priceValue}`,
            about: about,
            description: description,
            specification: specification,
            guide: guide,
            image: imageUrl
        };
        
        const productsCollection = collection(db, "products");
        await addDoc(productsCollection, newProduct);
        
        // Refresh products list
        closeAddProductModal();
        fetchProducts();
        
        // Show success message
        alert('Product added successfully!');
    } catch (error) {
        console.error("Error adding product: ", error);
        alert('Failed to add product. Please try again.');
        document.getElementById('upload-status').textContent = 'Error: Failed to upload image';
    } finally {
        // Reset button state
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const productRef = doc(db, "products", productId);
        await deleteDoc(productRef);
        
        // Refresh products list
        fetchProducts();
        
        // Show success message
        alert('Product deleted successfully!');
    } catch (error) {
        console.error("Error deleting product: ", error);
        alert('Failed to delete product. Please try again.');
    }
}