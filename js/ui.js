// Tab switching function
function switchTab(tabName, callbacks) {
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${tabName}Btn`).classList.add('active');

    // Show active content container
    const contentContainers = document.querySelectorAll('.content-container');
    contentContainers.forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(`${tabName}-container`).classList.add('active');

    // Call appropriate data loading function
    if (callbacks && callbacks[tabName]) {
        const contentList = document.getElementById(`${tabName}-list`);
        if (contentList && contentList.children.length === 0) {
            callbacks[tabName]();
        }
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

export { switchTab, openModal, closeModal };