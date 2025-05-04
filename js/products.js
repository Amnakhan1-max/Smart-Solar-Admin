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
    
    // Dynamic fields event listeners
    document.getElementById('add-specification-btn').addEventListener('click', () => addNewField('specification'));
    document.getElementById('add-guide-btn').addEventListener('click', () => addNewField('guide'));
    
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
        
        let specificationHTML = 'N/A';
        if (Array.isArray(product.specification) && product.specification.length > 0) {
            specificationHTML = '<ul>' + 
                product.specification.map(spec => `<li>${spec}</li>`).join('') + 
                '</ul>';
        } else if (product.specification) {
            specificationHTML = product.specification;
        }
        
        let guideHTML = 'N/A';
        if (Array.isArray(product.guide) && product.guide.length > 0) {
            guideHTML = '<ul>' + 
                product.guide.map(item => `<li>${item}</li>`).join('') + 
                '</ul>';
        } else if (product.guide) {
            guideHTML = product.guide;
        }
        
        productCard.innerHTML = `
            <div class="product-header">
                <h3>${product.title || 'Unnamed Product'}</h3>
                <span class="product-price">Rs ${product.price || 'Price N/A'}</span>
            </div>
            <div class="product-main">
                <p><span class="label">Category:</span> ${product.category || 'N/A'}</p>
                <p><span class="label">About:</span> ${product.about || 'N/A'}</p>
                <p><span class="label">Description:</span> ${product.description || 'No description available'}</p>
            </div>
            <details>
                <summary>Specifications and Guide</summary>
                <div class="product-details">
                    <p><span class="label">Specification:</span> ${specificationHTML}</p>
                    <p><span class="label">Guide:</span> ${guideHTML}</p>
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
    
    // Reset dynamic fields
    resetDynamicFields('specification');
    resetDynamicFields('guide');
}

// Close add product modal
function closeAddProductModal() {
    closeModal('add-product-modal');
}

// Function to reset dynamic fields to a single empty input
function resetDynamicFields(fieldType) {
    const container = document.getElementById(`${fieldType}-container`);
    
    if (fieldType === 'guide') {
        container.innerHTML = `
            <div class="dynamic-field-row">
                <input type="text" class="${fieldType}-field" placeholder="Enter step 1">
                <button type="button" class="remove-field-btn" style="display: none;"><i class="fas fa-minus"></i></button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="dynamic-field-row">
                <input type="text" class="${fieldType}-field" placeholder="Enter ${fieldType}">
                <button type="button" class="remove-field-btn" style="display: none;"><i class="fas fa-minus"></i></button>
            </div>
        `;
    }
}

// Function to add a new input field
function addNewField(fieldType) {
    const container = document.getElementById(`${fieldType}-container`);
    const newField = document.createElement('div');
    newField.className = 'dynamic-field-row';
    
    if (fieldType === 'guide') {
        const stepNumber = container.querySelectorAll('.dynamic-field-row').length + 1;
        newField.innerHTML = `
            <input type="text" class="${fieldType}-field" placeholder="Enter step ${stepNumber}">
            <button type="button" class="remove-field-btn"><i class="fas fa-minus"></i></button>
        `;
    } else {
        newField.innerHTML = `
            <input type="text" class="${fieldType}-field" placeholder="Enter ${fieldType}">
            <button type="button" class="remove-field-btn"><i class="fas fa-minus"></i></button>
        `;
    }
    
    container.appendChild(newField);
    
    // Show remove button on all fields if there's more than one field
    if (container.querySelectorAll('.dynamic-field-row').length > 1) {
        container.querySelectorAll('.remove-field-btn').forEach(btn => {
            btn.style.display = 'block';
        });
    }
    
    // Add event listeners to all remove buttons
    setupRemoveButtonListeners(container, fieldType);
}

// Setup event listeners for all remove buttons in a container
function setupRemoveButtonListeners(container, fieldType) {
    container.querySelectorAll('.remove-field-btn').forEach(btn => {
        // Remove old event listeners to prevent duplicates
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add new event listener
        newBtn.addEventListener('click', function() {
            const fieldRow = this.closest('.dynamic-field-row');
            container.removeChild(fieldRow);
            
            // If only one field remains, hide its remove button
            if (container.querySelectorAll('.dynamic-field-row').length === 1) {
                container.querySelector('.remove-field-btn').style.display = 'none';
            }
            
            // Update placeholders for guide fields to maintain sequential step numbers
            if (fieldType === 'guide') {
                updateGuidePlaceholders(container);
            }
        });
    });
}

// Update placeholders for guide fields to show sequential step numbers
function updateGuidePlaceholders(container) {
    const guideFields = container.querySelectorAll('.guide-field');
    guideFields.forEach((field, index) => {
        field.placeholder = `Enter step ${index + 1}`;
    });
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
        const priceValue = parseFloat(document.getElementById('price').value) || 0;
        const about = document.getElementById('about').value;
        const description = document.getElementById('description').value;
        const imageUrl = document.getElementById('image').value;
        
        // Get specification values as array
        const specificationFields = document.querySelectorAll('.specification-field');
        const specificationValues = [];
        specificationFields.forEach(field => {
            if (field.value.trim() !== '') {
                specificationValues.push(field.value.trim());
            }
        });
        
        // Get guide values as array
        const guideFields = document.querySelectorAll('.guide-field');
        const guideValues = [];
        guideFields.forEach(field => {
            if (field.value.trim() !== '') {
                guideValues.push(field.value.trim());
            }
        });
        
        const newProduct = {
            title: title,
            title_lowercase: title.toLowerCase(),
            category: category,
            price: priceValue,
            about: about,
            description: description,
            specification: specificationValues,
            guide: guideValues,
            image: imageUrl
        };
        
        const productsCollection = collection(db, "products");
        await addDoc(productsCollection, newProduct);
        
        // Close modal first
        closeAddProductModal();
        
        // Then refresh products list to show the newly added product
        await fetchProducts();
        
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