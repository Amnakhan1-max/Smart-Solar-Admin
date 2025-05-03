// Pagination settings
const ITEMS_PER_PAGE = 5;

// Create pagination controls
function createPagination(type, totalPages, currentPage, navigateCallback) {
    const paginationContainer = document.getElementById(`${type}-pagination`);
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Prev';
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            navigateCallback(currentPage - 1);
        }
    });
    paginationContainer.appendChild(prevBtn);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => navigateCallback(i));
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        paginationContainer.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            navigateCallback(currentPage + 1);
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// Update pagination buttons active state
function updatePaginationButtons(type, currentPage) {
    const paginationContainer = document.getElementById(`${type}-pagination`);
    const pageButtons = paginationContainer.querySelectorAll('button');
    
    pageButtons.forEach(btn => {
        if (!isNaN(parseInt(btn.textContent))) {
            if (parseInt(btn.textContent) === currentPage) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

export { ITEMS_PER_PAGE, createPagination, updatePaginationButtons };