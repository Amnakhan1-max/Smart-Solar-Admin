import { db, collection, getDocs, doc, deleteDoc } from './firebase-config.js';
import { ITEMS_PER_PAGE, createPagination, updatePaginationButtons } from './pagination.js';

// State for users
let allUsers = [];
let currentPage = 1;
let totalPages = 0;

// Fetch users from Firestore
async function fetchUsers() {
    try {
        const usersCollection = collection(db, "users");
        const snapshot = await getDocs(usersCollection);
        
        allUsers = [];
        snapshot.forEach(doc => {
            // Only add non-admin users to the list
            const userData = doc.data();
            if (userData.userType !== 'admin') {
                allUsers.push({ id: doc.id, ...userData });
            }
        });
        
        totalPages = Math.ceil(allUsers.length / ITEMS_PER_PAGE);
        displayUsers(1);
        createPagination('users', totalPages, currentPage, displayUsers);
    } catch (error) {
        console.error("Error fetching users: ", error);
        document.getElementById('users-list').innerHTML = `<div class="error-message">Error loading users. Please try again later.</div>`;
    }
}

// Format timestamp to readable date
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    
    try {
        if (timestamp.seconds) {
            // Firestore timestamp
            return new Date(timestamp.seconds * 1000).toLocaleString();
        } else {
            // Regular date
            return new Date(timestamp).toLocaleString();
        }
    } catch (error) {
        return 'Invalid Date';
    }
}

// Display users with pagination
function displayUsers(page) {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const usersToDisplay = allUsers.slice(startIndex, endIndex);
    
    if (usersToDisplay.length === 0) {
        usersList.innerHTML = '<div class="no-data">No users found</div>';
        return;
    }
    
    usersToDisplay.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'data-card user-card';
        
        // Format dates
        const createdAt = formatTimestamp(user.createdAt);
        const updatedAt = formatTimestamp(user.updatedAt);
        
        // Capitalize first letter of userType
        const userTypeDisplay = user.userType ? 
            user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : 
            'Customer';
        
        // Format full name
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User';
        
        userCard.innerHTML = `
            <div class="user-header">
                <h3>${fullName}</h3>
                <span class="user-type ${user.userType || 'customer'}">${userTypeDisplay}</span>
            </div>
            <div class="user-contact">
                <p><span class="label">Email:</span> ${user.email || 'N/A'}</p>
                <p><span class="label">Phone:</span> ${user.phone || 'N/A'}</p>
            </div>
            <div class="user-address">
                <p><span class="label">Address:</span> ${user.address || 'N/A'}${user.city ? ', ' + user.city : ''}</p>
            </div>
            <div class="user-dates">
                <p><span class="label">Created:</span> ${createdAt}</p>
                <p><span class="label">Updated:</span> ${updatedAt}</p>
            </div>
            <div class="user-actions">
                <button class="delete-btn" data-id="${user.id}">Delete User</button>
            </div>
        `;
        
        usersList.appendChild(userCard);
    });
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.user-actions .delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.target.getAttribute('data-id');
            if (userId) {
                deleteUser(userId);
            }
        });
    });
    
    currentPage = page;
    updatePaginationButtons('users', currentPage);
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        const userRef = doc(db, "users", userId);
        await deleteDoc(userRef);
        
        // Refresh users list
        fetchUsers();
        
        // Show success message
        alert('User deleted successfully!');
    } catch (error) {
        console.error("Error deleting user: ", error);
        alert('Failed to delete user. Please try again.');
    }
}

export { fetchUsers, displayUsers };