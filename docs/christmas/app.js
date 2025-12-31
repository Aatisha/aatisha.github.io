// Asset mapping based on available files
const ASSETS = {
    views: {
        nyc: 'assets/View/View-NYC.png',
        tokyo: 'assets/View/View-Tokyo.jpeg',
        paris: 'assets/View/View-Paris.jpeg',
        sf: 'assets/View/View-SF.jpeg'
    },
    chairs: {
        beige: 'assets/Chair/Chair-Beige.png',
        burgundy: 'assets/Chair/Chair-Burgundy.png',
        green: 'assets/Chair/Chair-Green.png'
    },
    tables: {
        candles: 'assets/Candle/candle-plain.png',
        decoration: 'assets/Candle/candle-decoration.png',
        cup: 'assets/Candle/candle-cup.png'
    }
};

// Default selections
const DEFAULT_SELECTIONS = {
    view: 'nyc',
    chair: 'beige',
    table: 'candles'
};

// State management
let currentSelections = { ...DEFAULT_SELECTIONS };

// DOM elements
const landingScreen = document.getElementById('landing-screen');
const designScreen = document.getElementById('design-screen');
const startButton = document.getElementById('start-button');
const cityViewImg = document.getElementById('city-view');
const chairImg = document.getElementById('chair');
const tableImg = document.getElementById('table');
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');
const randomizeBtn = document.getElementById('randomize-btn');

// Initialize the app
function init() {
    // Check for URL params and load selections
    const hasSharedParams = loadSelectionsFromUrl();
    
    // If shared link, go directly to design screen
    if (hasSharedParams) {
        showDesignScreen();
    }
    
    // Update thumbnails to match selections
    updateThumbnailActiveStates();
    
    // Load scene
    updateScene();

    // Event listeners
    startButton.addEventListener('click', showDesignScreen);
    
    // Thumbnail selectors
    document.querySelectorAll('.thumbnail-btn').forEach(btn => {
        btn.addEventListener('click', handleThumbnailClick);
    });

    // Action buttons
    downloadBtn.addEventListener('click', handleDownload);
    shareBtn.addEventListener('click', handleShare);
    randomizeBtn.addEventListener('click', handleRandomize);
}

// Load selections from URL parameters
function loadSelectionsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const chair = params.get('chair');
    const table = params.get('table');
    
    let hasParams = false;
    
    // Validate and apply view
    if (view && ASSETS.views[view]) {
        currentSelections.view = view;
        hasParams = true;
    }
    
    // Validate and apply chair
    if (chair && ASSETS.chairs[chair]) {
        currentSelections.chair = chair;
        hasParams = true;
    }
    
    // Validate and apply table
    if (table && ASSETS.tables[table]) {
        currentSelections.table = table;
        hasParams = true;
    }
    
    return hasParams;
}

// Update URL with current selections
function updateUrlParams() {
    const params = new URLSearchParams();
    params.set('view', currentSelections.view);
    params.set('chair', currentSelections.chair);
    params.set('table', currentSelections.table);
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
}

// Show design screen
function showDesignScreen() {
    landingScreen.classList.remove('active');
    designScreen.classList.add('active');
    updateScene();
    
    // Update URL with current selections
    updateUrlParams();
}

// Handle thumbnail click
function handleThumbnailClick(e) {
    const btn = e.currentTarget;
    const type = btn.dataset.type;
    const value = btn.dataset.value;

    // Update active state in the same group
    const parent = btn.parentElement;
    parent.querySelectorAll('.thumbnail-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update selection and scene
    if (type === 'view') {
        currentSelections.view = value;
        updateCityView();
    } else if (type === 'chair') {
        currentSelections.chair = value;
        updateChair();
    } else if (type === 'table') {
        currentSelections.table = value;
        updateTable();
    }
    
    // Update URL with new selections
    updateUrlParams();
}

// Handle randomize
function handleRandomize() {
    // Add spinning animation to button
    randomizeBtn.classList.add('spinning');
    
    // Get random selections
    const viewKeys = Object.keys(ASSETS.views);
    const chairKeys = Object.keys(ASSETS.chairs);
    const tableKeys = Object.keys(ASSETS.tables);
    
    const randomView = viewKeys[Math.floor(Math.random() * viewKeys.length)];
    const randomChair = chairKeys[Math.floor(Math.random() * chairKeys.length)];
    const randomTable = tableKeys[Math.floor(Math.random() * tableKeys.length)];
    
    // Update selections
    currentSelections.view = randomView;
    currentSelections.chair = randomChair;
    currentSelections.table = randomTable;
    
    // Update UI to reflect new selections
    updateThumbnailActiveStates();
    
    // Update URL with new selections
    updateUrlParams();
    
    // Update scene with staggered animation
    setTimeout(() => updateCityView(), 100);
    setTimeout(() => updateChair(), 200);
    setTimeout(() => updateTable(), 300);
    
    // Remove spinning class after animation
    setTimeout(() => {
        randomizeBtn.classList.remove('spinning');
    }, 600);
    
    // Show feedback
    showToast('🎲 Randomized!');
}

// Update thumbnail active states based on current selections
function updateThumbnailActiveStates() {
    // Update view thumbnails
    document.querySelectorAll('#view-selector .thumbnail-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === currentSelections.view);
    });
    
    // Update chair thumbnails
    document.querySelectorAll('#chair-selector .thumbnail-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === currentSelections.chair);
    });
    
    // Update table thumbnails
    document.querySelectorAll('#table-selector .thumbnail-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === currentSelections.table);
    });
}

// Update city view
function updateCityView() {
    const viewPath = ASSETS.views[currentSelections.view];
    if (viewPath && cityViewImg) {
        cityViewImg.src = viewPath;
        cityViewImg.style.opacity = '0';
        setTimeout(() => {
            cityViewImg.style.transition = 'opacity 0.3s ease';
            cityViewImg.style.opacity = '1';
        }, 10);
    }
}

// Update chair
function updateChair() {
    const chairPath = ASSETS.chairs[currentSelections.chair];
    if (chairPath && chairImg) {
        chairImg.src = chairPath;
        chairImg.style.opacity = '0';
        setTimeout(() => {
            chairImg.style.transition = 'opacity 0.3s ease';
            chairImg.style.opacity = '1';
        }, 10);
    }
}

// Update table
function updateTable() {
    const tablePath = ASSETS.tables[currentSelections.table];
    if (tablePath && tableImg) {
        tableImg.src = tablePath;
        tableImg.style.opacity = '0';
        setTimeout(() => {
            tableImg.style.transition = 'opacity 0.3s ease';
            tableImg.style.opacity = '1';
        }, 10);
    }
}

// Update entire scene
function updateScene() {
    updateCityView();
    updateChair();
    updateTable();
}

// Handle download
async function handleDownload() {
    try {
        // Create a canvas to composite the layers
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size - 9:16 aspect ratio (portrait)
        // 9:16 means width/height = 9/16 = 0.5625
        const height = 1920;
        const width = Math.round(height * (9 / 16)); // = 1080
        canvas.width = width;
        canvas.height = height;

        // Fill background (in case of any transparency issues)
        ctx.fillStyle = '#1a2e1c';
        ctx.fillRect(0, 0, width, height);

        // Load all images
        const images = await Promise.all([
            loadImage(cityViewImg.src),
            loadImage(document.getElementById('window-frame').src),
            loadImage(chairImg.src),
            loadImage(tableImg.src)
        ]);

        // Draw layers in order
        // Layer 0: City View (cover - fills entire canvas)
        drawCover(ctx, images[0], width, height);
        
        // Layer 1: Window Frame (contain - fits within canvas maintaining aspect ratio)
        drawContain(ctx, images[1], width, height);
        
        // Layer 2: Chair (bottom left) - matching CSS positioning
        const chairWidth = width * 0.65;
        const chairHeight = (images[2].height / images[2].width) * chairWidth;
        const chairX = -20 * (width / 1080); // Scale offset
        const chairY = height - chairHeight + (70 * (height / 1920)); // Scale offset
        ctx.drawImage(images[2], chairX, chairY, chairWidth, chairHeight);
        
        // Layer 3: Table (bottom center-right) - matching CSS positioning
        const tableWidth = width * 0.35;
        const tableHeight = (images[3].height / images[3].width) * tableWidth;
        const tableX = (width * 0.66) - (tableWidth / 2);
        const tableY = height - tableHeight + (15 * (height / 1920)); // Scale offset
        ctx.drawImage(images[3], tableX, tableY, tableWidth, tableHeight);

        // Download as PNG
        const link = document.createElement('a');
        link.download = 'my-cozy-christmas-space.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        // Show feedback
        showToast('Image downloaded!');
    } catch (error) {
        console.error('Download failed:', error);
        showToast('Download failed. Please try again.');
    }
}

// Helper function to load image
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Helper function to draw image with cover behavior
function drawCover(ctx, img, width, height) {
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imgRatio > canvasRatio) {
        drawHeight = height;
        drawWidth = img.width * (height / img.height);
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = width;
        drawHeight = img.height * (width / img.width);
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
    }
    
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// Helper function to draw image with contain behavior
function drawContain(ctx, img, width, height) {
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imgRatio > canvasRatio) {
        drawWidth = width;
        drawHeight = img.height * (width / img.width);
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
    } else {
        drawHeight = height;
        drawWidth = img.width * (height / img.height);
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
    }
    
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// Handle share
async function handleShare() {
    // Ensure URL has latest selections
    updateUrlParams();
    
    const shareData = {
        title: 'My Cozy Christmas Space',
        text: 'Check out my custom Christmas window view! 🎄',
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            showToast('🔗 Shared successfully!');
        } else {
            // Fallback: copy URL to clipboard
            await navigator.clipboard.writeText(window.location.href);
            showToast('🔗 Link copied with your selections!');
        }
    } catch (error) {
        console.error('Share failed:', error);
        // Fallback: copy URL to clipboard
        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast('🔗 Link copied with your selections!');
        } catch (e) {
            showToast('Unable to share. Please copy the URL manually.');
        }
    }
}

// Toast notification
function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: #2d4430;
        color: #f5f1eb;
        padding: 1rem 2rem;
        border-radius: 12px;
        font-size: 0.9rem;
        font-weight: 500;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: toastIn 0.3s ease;
    `;
    document.body.appendChild(toast);

    // Add animation keyframes
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes toastIn {
                from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    // Remove after delay
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Add error handlers for all images
window.addEventListener('DOMContentLoaded', () => {
    if (cityViewImg) {
        cityViewImg.onerror = () => console.warn('City view image failed to load');
    }
    if (chairImg) {
        chairImg.onerror = () => console.warn('Chair image failed to load');
    }
    if (tableImg) {
        tableImg.onerror = () => console.warn('Table image failed to load');
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
