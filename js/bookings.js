import { db, collection, getDocs, doc, getDoc } from './firebase-config.js';
import { ITEMS_PER_PAGE, createPagination, updatePaginationButtons } from './pagination.js';

// State for bookings
let allBookings = [];
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

// Fetch bookings from Firestore
async function fetchBookings() {
    try {
        const bookingsCollection = collection(db, "bookings");
        const snapshot = await getDocs(bookingsCollection);
        
        allBookings = [];
        snapshot.forEach(doc => {
            allBookings.push({ id: doc.id, ...doc.data() });
        });
        
        totalPages = Math.ceil(allBookings.length / ITEMS_PER_PAGE);
        displayBookings(1);
        createPagination('bookings', totalPages, currentPage, displayBookings);
    } catch (error) {
        console.error("Error fetching bookings: ", error);
        document.getElementById('bookings-list').innerHTML = `<div class="error-message">Error loading bookings. Please try again later.</div>`;
    }
}

// Display bookings with pagination
async function displayBookings(page) {
    const bookingsList = document.getElementById('bookings-list');
    bookingsList.innerHTML = '';
    
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const bookingsToDisplay = allBookings.slice(startIndex, endIndex);
    
    if (bookingsToDisplay.length === 0) {
        bookingsList.innerHTML = '<div class="no-data">No bookings found</div>';
        return;
    }
    
    // Process each booking and add to DOM
    for (const booking of bookingsToDisplay) {
        const bookingDate = booking.timestamp ? new Date(booking.timestamp.seconds * 1000).toLocaleDateString() : booking.date || 'N/A';
        
        // Fetch user information if userId exists
        let userData = null;
        if (booking.userId) {
            userData = await fetchUserInfo(booking.userId);
        }
        
        const bookingCard = document.createElement('div');
        bookingCard.className = 'data-card';
        
        // Get user email and phone (either from userData or from booking)
        const userEmail = userData ? userData.email : booking.userEmail || 'N/A';
        const userPhone = userData ? userData.phone || 'N/A' : 'N/A';
        
        // Prepare packages list
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
            <div class="booking-details">
                <p><span class="label">Date & Time:</span> ${booking.date || 'N/A'} at ${booking.time || 'N/A'}</p>
                <p><span class="label">Category:</span> ${booking.category || 'N/A'}</p>
                <p><span class="label">Location:</span> ${booking.location || 'N/A'}</p>
                <p><span class="label">System:</span> ${booking.companyAndModel || 'N/A'} (${booking.watt || 'N/A'})</p>
                <p><span class="label">Total Price:</span> RS ${booking.totalPrice || 'N/A'}</p>
            </div>
            <div class="packages-section">
                <p><span class="label">Services:</span></p>
                ${packagesList || '<p style="margin-left: 110px;">No packages selected</p>'}
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
        
        bookingsList.appendChild(bookingCard);
    }
    
    currentPage = page;
    updatePaginationButtons('bookings', currentPage);
}

export { fetchBookings, displayBookings };