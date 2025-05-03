import { db, collection, getDocs, doc, getDoc } from './firebase-config.js';
import { ITEMS_PER_PAGE, createPagination, updatePaginationButtons } from './pagination.js';

// State for orders
let allOrders = [];
let currentPage = 1;
let totalPages = 0;
let userCache = {}; // Cache user data to avoid redundant fetches

// Fetch user information by userId
async function fetchUserInfo(userId) {
    // Return from cache if available
    if (userCache[userId]) {
        return userCache[userId];
    }
    
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            // Store in cache
            userCache[userId] = userData;
            return userData;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}

// Fetch orders from Firestore
async function fetchOrders() {
    try {
        const ordersCollection = collection(db, "orders");
        const snapshot = await getDocs(ordersCollection);
        
        allOrders = [];
        snapshot.forEach(doc => {
            allOrders.push({ id: doc.id, ...doc.data() });
        });
        
        totalPages = Math.ceil(allOrders.length / ITEMS_PER_PAGE);
        displayOrders(1);
        createPagination('orders', totalPages, currentPage, displayOrders);
    } catch (error) {
        console.error("Error fetching orders: ", error);
        document.getElementById('orders-list').innerHTML = `<div class="error-message">Error loading orders. Please try again later.</div>`;
    }
}

// Display orders with pagination
async function displayOrders(page) {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';
    
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const ordersToDisplay = allOrders.slice(startIndex, endIndex);
    
    if (ordersToDisplay.length === 0) {
        ordersList.innerHTML = '<div class="no-data">No orders found</div>';
        return;
    }
    
    // Process each order and add to DOM
    for (const order of ordersToDisplay) {
        const orderDate = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
        
        // Fetch user information if userId exists
        let userData = null;
        if (order.userId) {
            userData = await fetchUserInfo(order.userId);
        }
        
        const orderCard = document.createElement('div');
        orderCard.className = 'data-card';
        
        // Get user email and phone from userData
        const userEmail = userData ? userData.email || 'N/A' : 'N/A';
        const userPhone = userData ? userData.phone || 'N/A' : 'N/A';
        
        // Format items list
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
                <h3>Order #${order.id.substring(0, 6).toUpperCase()}</h3>
                <span class="status ${order.status || 'pending'}">${order.status || 'Pending'}</span>
            </div>
            <div class="order-details">
                <p><span class="label">Date:</span> ${orderDate}</p>
                <p><span class="label">Total:</span> RS ${order.totalAmount}</p>
                <p><span class="label">Payment:</span> ${order.paymentMethod}</p>
                <p><span class="label">Ship To:</span> ${order.address}, ${order.city}</p>
            </div>
            <div class="order-items">
                <p><span class="label">Items:</span></p>
                ${itemsList || '<p style="margin-left: 110px;">No items in this order</p>'}
            </div>
            <div class="user-info">
                <span class="title">Customer Details</span>
                <div class="user-details">
                    <p><span class="label">Name:</span> ${userData ? `${userData.firstName || ''} ${userData.lastName || ''}` : 'N/A'}</p>
                    <p><span class="label">Address:</span> ${userData ? `${userData.address || ''}, ${userData.city || ''}` : 'N/A'}</p>
                    <p><span class="label">Email:</span> ${userEmail}</p>
                    <p><span class="label">Phone:</span> ${userPhone}</p>
                </div>
            </div>
        `;
        
        ordersList.appendChild(orderCard);
    }
    
    currentPage = page;
    updatePaginationButtons('orders', currentPage);
}

export { fetchOrders, displayOrders };