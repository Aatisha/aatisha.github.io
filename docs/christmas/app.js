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

// Mobile drawer elements
const controlsSection = document.getElementById('controls-section');
const drawerHandle = document.getElementById('drawer-handle');
const drawerToggle = document.getElementById('drawer-toggle');
const drawerOverlay = document.getElementById('drawer-overlay');
const previewSection = document.querySelector('.preview-section');

// Drawer state
let isDrawerExpanded = false;
let touchStartY = 0;
let touchCurrentY = 0;
let isDragging = false;

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

    // Action buttons with touch handling
    setupActionButton(downloadBtn, handleDownload);
    setupActionButton(shareBtn, handleShare);
    setupActionButton(randomizeBtn, handleRandomize);

    // Mobile drawer interactions
    initDrawerInteractions();
}

// Setup touch-friendly action buttons
function setupActionButton(btn, handler) {
    if (!btn) return;
    
    let touchStarted = false;
    
    // Touch events for mobile
    btn.addEventListener('touchstart', (e) => {
        touchStarted = true;
        btn.classList.add('pressed');
    }, { passive: true });
    
    btn.addEventListener('touchend', (e) => {
        if (touchStarted) {
            btn.classList.remove('pressed');
            // Small delay before triggering action for visual feedback
            setTimeout(() => handler(), 50);
        }
        touchStarted = false;
    }, { passive: true });
    
    btn.addEventListener('touchcancel', () => {
        btn.classList.remove('pressed');
        touchStarted = false;
    }, { passive: true });
    
    // Click event for desktop
    btn.addEventListener('click', (e) => {
        // Prevent double-triggering on touch devices
        if (!touchStarted) {
            handler();
        }
    });
}

// Initialize drawer interactions for mobile
function initDrawerInteractions() {
    if (!controlsSection || !drawerHandle) return;

    // Toggle button - handle both click and touch
    if (drawerToggle) {
        // Prevent touch events from bubbling to header
        drawerToggle.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });
        
        drawerToggle.addEventListener('touchend', (e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleDrawer();
        }, { passive: false });
        
        drawerToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDrawer();
        });
    }

    // Handle click/tap to expand on drawer handle
    drawerHandle.addEventListener('click', handleDrawerTap);

    // Overlay click to close
    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', closeDrawer);
    }

    // Touch gestures on drawer handle
    drawerHandle.addEventListener('touchstart', handleTouchStart, { passive: true });
    drawerHandle.addEventListener('touchmove', handleTouchMove, { passive: false });
    drawerHandle.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Also allow dragging from the header area (but not the toggle button)
    const drawerHeader = document.querySelector('.drawer-header');
    if (drawerHeader) {
        drawerHeader.addEventListener('touchstart', (e) => {
            // Don't start drag if touching the toggle button
            if (e.target.closest('.drawer-toggle')) return;
            handleTouchStart(e);
        }, { passive: true });
        
        drawerHeader.addEventListener('touchmove', (e) => {
            if (e.target.closest('.drawer-toggle')) return;
            handleTouchMove(e);
        }, { passive: false });
        
        drawerHeader.addEventListener('touchend', (e) => {
            if (e.target.closest('.drawer-toggle')) return;
            handleTouchEnd(e);
        }, { passive: true });
    }

    // Allow swiping on the entire collapsed drawer area
    controlsSection.addEventListener('touchstart', handleDrawerTouchStart, { passive: true });
    controlsSection.addEventListener('touchmove', handleDrawerTouchMove, { passive: false });
    controlsSection.addEventListener('touchend', handleDrawerTouchEnd, { passive: true });
}

// Handle tap on drawer (separate from swipe)
let tapStartTime = 0;
let tapStartY = 0;

function handleDrawerTap(e) {
    // Only toggle if it was a quick tap, not a drag
    if (!isDragging) {
        toggleDrawer();
    }
}

// Toggle drawer state
function toggleDrawer() {
    if (isDrawerExpanded) {
        closeDrawer();
    } else {
        openDrawer();
    }
}

// Open drawer with haptic feedback if available
function openDrawer() {
    isDrawerExpanded = true;
    controlsSection.classList.add('expanded');
    if (previewSection) previewSection.classList.add('drawer-open');
    if (drawerOverlay) drawerOverlay.classList.add('active');
    
    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

// Close drawer
function closeDrawer() {
    isDrawerExpanded = false;
    controlsSection.classList.remove('expanded');
    if (previewSection) previewSection.classList.remove('drawer-open');
    if (drawerOverlay) drawerOverlay.classList.remove('active');
}

// Drawer-level touch handlers (for swipe anywhere on drawer)
let drawerTouchStartY = 0;
let drawerTouchCurrentY = 0;
let isDrawerDragging = false;
let dragStartTime = 0;

function handleDrawerTouchStart(e) {
    // Only initiate drag from handle/header area when collapsed
    const target = e.target;
    const isHandleArea = target.closest('.drawer-handle') || target.closest('.drawer-header');
    
    if (!isDrawerExpanded && !isHandleArea) return;
    
    drawerTouchStartY = e.touches[0].clientY;
    drawerTouchCurrentY = drawerTouchStartY;
    dragStartTime = Date.now();
    isDrawerDragging = false;
}

function handleDrawerTouchMove(e) {
    if (drawerTouchStartY === 0) return;
    
    drawerTouchCurrentY = e.touches[0].clientY;
    const deltaY = drawerTouchCurrentY - drawerTouchStartY;
    
    // Start dragging after 10px threshold
    if (Math.abs(deltaY) > 10) {
        isDrawerDragging = true;
    }
    
    if (!isDrawerDragging) return;

    if (isDrawerExpanded && deltaY > 0) {
        // Dragging down when expanded - close gesture
        e.preventDefault();
        controlsSection.style.transition = 'none';
        if (previewSection) previewSection.style.transition = 'none';
        
        const progress = Math.min(deltaY / (window.innerHeight * 0.5), 1);
        const translateY = deltaY * 0.8; // Slight resistance
        controlsSection.style.transform = `translateY(${translateY}px)`;
        
        // Also animate preview section
        if (previewSection) {
            const newBottom = 50 - (progress * 40); // 50vh to ~10vh
            previewSection.style.bottom = `${newBottom}vh`;
        }
    }
}

function handleDrawerTouchEnd(e) {
    if (drawerTouchStartY === 0) return;
    
    const deltaY = drawerTouchCurrentY - drawerTouchStartY;
    const velocity = deltaY / (Date.now() - dragStartTime); // px/ms
    const threshold = 80; // Minimum distance
    const velocityThreshold = 0.5; // Fast swipe threshold
    
    // Reset styles
    controlsSection.style.transition = '';
    controlsSection.style.transform = '';
    if (previewSection) {
        previewSection.style.transition = '';
        previewSection.style.bottom = '';
    }
    
    if (isDrawerDragging) {
        // Determine action based on distance and velocity
        if (isDrawerExpanded) {
            if (deltaY > threshold || velocity > velocityThreshold) {
                closeDrawer();
            }
            // Otherwise stays open (spring back)
        }
    }
    
    // Reset
    drawerTouchStartY = 0;
    isDrawerDragging = false;
}

// Original touch handlers for handle/header area
function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
    touchCurrentY = touchStartY;
    isDragging = false;
    tapStartTime = Date.now();
    tapStartY = touchStartY;
    controlsSection.style.transition = 'none';
    if (previewSection) previewSection.style.transition = 'none';
}

function handleTouchMove(e) {
    if (touchStartY === 0) return;
    
    touchCurrentY = e.touches[0].clientY;
    const deltaY = touchCurrentY - touchStartY;
    
    // Start dragging after small threshold
    if (Math.abs(deltaY) > 8) {
        isDragging = true;
    }
    
    if (!isDragging) return;
    
    e.preventDefault();
    
    if (isDrawerExpanded) {
        // When expanded, only allow dragging down
        if (deltaY > 0) {
            const translateY = deltaY * 0.85; // Slight resistance
            controlsSection.style.transform = `translateY(${translateY}px)`;
            
            // Animate preview
            if (previewSection) {
                const progress = Math.min(deltaY / (window.innerHeight * 0.5), 1);
                const newBottom = 50 - (progress * 40);
                previewSection.style.bottom = `${newBottom}vh`;
            }
        }
    } else {
        // When collapsed, allow dragging up
        if (deltaY < 0) {
            const absY = Math.abs(deltaY);
            const maxDrag = window.innerHeight * 0.5 - 100;
            const clampedY = Math.min(absY, maxDrag);
            const progress = clampedY / maxDrag;
            
            // Animate drawer up
            const baseTranslate = window.innerHeight * 0.5 - 100;
            const newTranslate = baseTranslate - clampedY;
            controlsSection.style.transform = `translateY(calc(100% - 100px - ${clampedY}px))`;
            
            // Animate preview shrinking
            if (previewSection) {
                const newBottom = 100 + (progress * (window.innerHeight * 0.5 - 100));
                previewSection.style.bottom = `${newBottom}px`;
            }
        }
    }
}

function handleTouchEnd(e) {
    if (touchStartY === 0) return;
    
    const deltaY = touchCurrentY - touchStartY;
    const elapsed = Date.now() - tapStartTime;
    const velocity = Math.abs(deltaY) / elapsed;
    const threshold = 60;
    const velocityThreshold = 0.4;
    
    // Reset transitions
    controlsSection.style.transition = '';
    controlsSection.style.transform = '';
    if (previewSection) {
        previewSection.style.transition = '';
        previewSection.style.bottom = '';
    }
    
    // Was it a tap or a swipe?
    if (!isDragging && elapsed < 300 && Math.abs(deltaY) < 15) {
        // It was a tap
        toggleDrawer();
    } else if (isDragging) {
        // It was a swipe
        if (isDrawerExpanded) {
            // Swipe down to close
            if (deltaY > threshold || velocity > velocityThreshold) {
                closeDrawer();
            }
        } else {
            // Swipe up to open
            if (deltaY < -threshold || velocity > velocityThreshold) {
                openDrawer();
            }
        }
    }
    
    // Reset
    touchStartY = 0;
    isDragging = false;
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
    
    // Add visual feedback on mobile
    if (isMobile()) {
        btn.style.transform = 'scale(0.92)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 150);
    }
}

// Check if mobile viewport
function isMobile() {
    return window.innerWidth <= 768;
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
    
    const shareTitle = 'My Cozy Christmas Space';
    const shareText = 'Check out my custom Christmas cozy space! 🎄';
    const shareUrl = window.location.href;
    
    // Formatted text for clipboard (includes title, text, and URL)
    const clipboardText = `${shareTitle}\n${shareText}\n\n${shareUrl}`;
    
    const shareData = {
        title: shareTitle,
        text: shareText,
        url: shareUrl
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            // Only show success if share completed (not cancelled)
            showToast('🔗 Shared successfully!');
        } else {
            // Fallback: copy formatted text to clipboard
            await navigator.clipboard.writeText(clipboardText);
            showToast('📋 Copied to clipboard!');
        }
    } catch (error) {
        // Check if user just cancelled the share dialog
        if (error.name === 'AbortError' || error.message?.includes('cancel') || error.message?.includes('abort')) {
            // User cancelled - don't show any message
            return;
        }

        console.error('Share failed:', error);
        // Fallback: copy formatted text to clipboard
        try {
            await navigator.clipboard.writeText(clipboardText);
            showToast('📋 Copied to clipboard!');
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

    // Adjust position for mobile (above drawer)
    const bottomPosition = isMobile() ? '100px' : '2rem';

    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: ${bottomPosition};
        left: 50%;
        transform: translateX(-50%);
        background: rgba(30, 45, 30, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        color: #f5f1eb;
        padding: 0.875rem 1.5rem;
        border-radius: 100px;
        font-size: 0.85rem;
        font-weight: 500;
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        border: 1px solid rgba(255,255,255,0.1);
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
