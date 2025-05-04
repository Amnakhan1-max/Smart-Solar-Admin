import { db, collection, getDocs, doc, getDoc, deleteDoc } from './firebase-config.js';
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

        // Sort bookings by timestamp descending (latest first)
        allBookings.sort((a, b) => {
            const aTime = a.timestamp?.seconds || 0;
            const bTime = b.timestamp?.seconds || 0;
            return bTime - aTime;
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
        // Add bookedAtTime for display
        const bookedAtTime = booking.timestamp ? new Date(booking.timestamp.seconds * 1000).toLocaleTimeString() : 'N/A';
        
        // Prepare bookedAtDateTime from timestamp
        let bookedAtDateTime = 'N/A';
        if (booking.timestamp) {
            const dateObj = new Date(booking.timestamp.seconds * 1000);
            bookedAtDateTime = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`;
        }
        
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
                packagesList += `<li>${pkg} - Rs ${price}</li>`;
            });
            packagesList += '</ul>';
        }
        
        bookingCard.innerHTML = `
            <div class="booking-header">
                <h3>${booking.serviceType || 'Service Booking'}</h3>
                <div>
                    <span class="status ${booking.status || 'pending'}">${booking.status || 'Pending'}</span>
                    <button class="delete-btn del-top" data-id="${booking.id}">Delete</button>
                </div>
            </div>
            <div class="booking-details">
                <p><span class="label">Category:</span> ${booking.category || 'N/A'}</p>
                <p><span class="label">Location:</span> ${booking.location || 'N/A'}</p>
                <p><span class="label">Timings:</span> ${booking.date || 'N/A'} at ${booking.time || 'N/A'}</p>
                <p><span class="label">Booked At:</span> ${bookedAtDateTime}</p>
                <p><span class="label">System:</span> ${booking.companyAndModel || 'N/A'} (${booking.watt || 'N/A'})</p>
                <p><span class="label">Total Price:</span> Rs ${booking.totalPrice || 'N/A'}</p>
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

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bookingId = e.target.getAttribute('data-id');
            if (bookingId) {
                deleteBooking(bookingId);
            }
        });
    });

    currentPage = page;
    updatePaginationButtons('bookings', currentPage);
}

// Delete booking
async function deleteBooking(bookingId) {
    if (!confirm('Are you sure you want to delete this booking?')) {
        return;
    }
    try {
        const bookingRef = doc(db, "bookings", bookingId);
        await deleteDoc(bookingRef);
        // Refresh bookings list
        fetchBookings();
        alert('Booking deleted successfully!');
    } catch (error) {
        console.error("Error deleting booking: ", error);
        alert('Failed to delete booking. Please try again.');
    }
}

export { fetchBookings, displayBookings };