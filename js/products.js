import { db, storage, collection, getDocs, addDoc, doc, deleteDoc } from './firebase-config.js';
import { ref, uploadBytes, getDownloadURL } from './firebase-config.js';
import { ITEMS_PER_PAGE, createPagination, updatePaginationButtons } from './pagination.js';
import { openModal, closeModal } from './ui.js';

// State for products
let allProducts = [];
let currentPage = 1;
let totalPages = 0;

// DOM Elements
let addProductForm;
let addProductModal;

// Initialize products module
function initProductsModule() {
    addProductModal = document.getElementById('add-product-modal');
    addProductForm = document.getElementById('add-product-form');
    
    // Add event listeners
    document.getElementById('add-product-btn').addEventListener('click', openAddProductModal);
    document.querySelector('.close').addEventListener('click', closeAddProductModal);
    addProductForm.addEventListener('submit', handleAddProduct);
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === addProductModal) {
            closeAddProductModal();
        }
    });
}

// Fetch products from Firestore
async function fetchProducts() {
    try {
        const productsCollection = collection(db, "products");
        const snapshot = await getDocs(productsCollection);
        
        allProducts = [];
        snapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });
        
        totalPages = Math.ceil(allProducts.length / ITEMS_PER_PAGE);
        displayProducts(1);
        createPagination('products', totalPages, currentPage, displayProducts);
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
    const productsToDisplay = allProducts.slice(startIndex, endIndex);
    
    if (productsToDisplay.length === 0) {
        productsList.innerHTML = '<div class="no-data">No products found</div>';
        return;
    }
    
    productsToDisplay.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'data-card product-card';
        
        // Create a concise product description (limit length)
        const shortDescription = product.description && product.description.length > 100 ? 
            product.description.substring(0, 100) + '...' : 
            (product.description || 'No description available');
        
        productCard.innerHTML = `
            <div class="product-header">
                <h3>${product.title || 'Unnamed Product'}</h3>
                <span class="product-price">${product.price || 'Price N/A'}</span>
            </div>
            <div class="product-main">
                <p><span class="label">Category:</span> ${product.category || 'N/A'}</p>
                <p><span class="label">About:</span> ${product.about || 'N/A'}</p>
                <p><span class="label">Description:</span> ${shortDescription}</p>
            </div>
            <details>
                <summary>Specifications and Guide</summary>
                <div class="product-details">
                    <p><span class="label">Specification:</span> ${product.specification || 'N/A'}</p>
                    <p><span class="label">Guide:</span> ${product.guide || 'N/A'}</p>
                </div>
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
    
    currentPage = page;
    updatePaginationButtons('products', currentPage);
}

// Open add product modal
function openAddProductModal() {
    openModal('add-product-modal');
    addProductForm.reset();
}

// Close add product modal
function closeAddProductModal() {
    closeModal('add-product-modal');
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

export { initProductsModule, fetchProducts, displayProducts, openAddProductModal, closeAddProductModal, handleAddProduct };