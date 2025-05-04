// Import modules
import { fetchOrders } from './js/orders.js';
import { fetchBookings } from './js/bookings.js';
import { initProductsModule, fetchProducts } from './js/products.js';
import { fetchUsers } from './js/users.js';
import { switchTab } from './js/ui.js';
import { checkAuth, login, logout, getCurrentUser } from './js/auth.js';

// DOM Elements
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

const ordersBtn = document.getElementById('ordersBtn');
const bookingsBtn = document.getElementById('bookingsBtn');
const productsBtn = document.getElementById('productsBtn');
const usersBtn = document.getElementById('usersBtn');

// Tab callbacks
const tabCallbacks = {
    orders: fetchOrders,
    bookings: fetchBookings,
    products: fetchProducts,
    users: fetchUsers
};

// Authentication
async function checkAuthentication() {
    // Check if we have a stored user first
    const storedUser = JSON.parse(localStorage.getItem('smartSolarUser'));
    
    if (storedUser) {
        // Show dashboard right away
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        
        // Display the user email
        userEmail.textContent = storedUser.email;
        
        // Check if there's a saved tab in localStorage
        const savedTab = localStorage.getItem('smartSolarActiveTab') || 'users';
        
        // Switch to the saved tab
        switchTab(savedTab, tabCallbacks);
    }
    
    // Verify with Firebase (this will handle cases where the token is expired)
    const isAuthenticated = await checkAuth();
    
    if (isAuthenticated) {
        // Show dashboard and hide login
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        
        // Show user email
        const user = getCurrentUser();
        if (user) {
            userEmail.textContent = user.email;
        }
        
        // Check if there's a saved tab in localStorage
        const savedTab = localStorage.getItem('smartSolarActiveTab') || 'users';
        
        // Switch to the saved tab
        switchTab(savedTab, tabCallbacks);
    } else {
        // No valid authentication, show login
        localStorage.removeItem('smartSolarUser'); // Clear any invalid stored user
        loginContainer.style.display = 'flex';
        dashboardContainer.style.display = 'none';
    }
}

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Simple validation
    if (!email || !password) {
        showLoginError('Please enter both email and password');
        return;
    }
    
    // Disable form during login
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    // Attempt login
    const result = await login(email, password);
    
    if (result.success) {
        // Login successful
        hideLoginError();
        checkAuthentication();
    } else {
        // Login failed
        showLoginError(result.error);
    }
    
    // Reset button state
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
});

// Logout button click
logoutBtn.addEventListener('click', async () => {
    await logout();
    checkAuthentication();
});

// Show login error
function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
}

// Hide login error
function hideLoginError() {
    loginError.textContent = '';
    loginError.style.display = 'none';
}

// Event Listeners for tabs
ordersBtn.addEventListener('click', () => switchTab('orders', tabCallbacks));
bookingsBtn.addEventListener('click', () => switchTab('bookings', tabCallbacks));
productsBtn.addEventListener('click', () => switchTab('products', tabCallbacks));
usersBtn.addEventListener('click', () => switchTab('users', tabCallbacks));

// Initialize products module (for product-specific event listeners)
initProductsModule();

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
});