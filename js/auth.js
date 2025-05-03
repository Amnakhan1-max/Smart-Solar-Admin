import { auth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from './firebase-config.js';

// Admin credentials - in a real production app, these would be stored securely
// For demo purposes, we're hardcoding them here
const ADMIN_EMAIL = 'admin@smartsolar.com';
const ADMIN_ROLE = 'admin';

// Check if user is authenticated and is an admin
function checkAuth() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, check if admin
                isAdmin(user).then(isAdminUser => {
                    resolve(isAdminUser);
                });
            } else {
                // User is signed out
                resolve(false);
            }
        });
    });
}

// Login with email and password
async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if the logged in user is an admin
        const isAdminUser = await isAdmin(userCredential.user);
        
        if (!isAdminUser) {
            // If not admin, log them out and return error
            await signOut(auth);
            return { 
                success: false, 
                error: 'Access denied. Only administrators can access this panel.' 
            };
        }
        
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("Login error:", error);
        let errorMessage;
        switch (error.code) {
            case 'auth/invalid-credential':
                errorMessage = 'Invalid email or password';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No user found with this email';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many login attempts. Please try again later';
                break;
            default:
                errorMessage = 'An error occurred during login';
        }
        return { success: false, error: errorMessage };
    }
}

// Logout
async function logout() {
    try {
        await signOut(auth);
        return true;
    } catch (error) {
        console.error("Logout error:", error);
        return false;
    }
}

// Check if current user is an admin by checking their userType field in Firestore
async function isAdmin(user) {
    if (!user) {
        return false;
    }

    try {
        // Import needed Firestore functions
        const { db, doc, getDoc } = await import('./firebase-config.js');
        
        // Get the user document from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userDocRef);
        
        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            // Check if userType is 'admin'
            return userData.userType === 'admin';
        }
        
        return false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

// Get currently logged in user
function getCurrentUser() {
    return auth.currentUser;
}

export { checkAuth, login, logout, isAdmin, getCurrentUser };