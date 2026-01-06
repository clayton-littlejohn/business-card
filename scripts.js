// ============================================
// UTILITY FUNCTIONS
// ============================================

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// CONSTELLATION BACKGROUND
// ============================================

function createConstellationBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'constellation-canvas';
    document.body.prepend(canvas);
    
    const ctx = canvas.getContext('2d');
    let dots = [];
    let animationId;
    
    // Set canvas size with proper DPR handling
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = document.documentElement.scrollHeight;
        
        // Set actual canvas size (scaled for DPR)
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        // Set display size (CSS pixels)
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        // Scale context to match DPR
        ctx.scale(dpr, dpr);
    }
    
    // Dot class
    class Dot {
        constructor() {
            // Use CSS pixel dimensions for positioning
            this.x = Math.random() * window.innerWidth;
            this.y = Math.random() * document.documentElement.scrollHeight;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = Math.random() * 1.5 + 0.5;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            // Bounce off edges (use CSS pixel dimensions)
            if (this.x < 0 || this.x > window.innerWidth) this.vx *= -1;
            if (this.y < 0 || this.y > document.documentElement.scrollHeight) this.vy *= -1;
            
            // Keep within bounds
            this.x = Math.max(0, Math.min(window.innerWidth, this.x));
            this.y = Math.max(0, Math.min(document.documentElement.scrollHeight, this.y));
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
            ctx.fill();
        }
    }
    
    // Initialize dots
    function initDots() {
        dots = [];
        const width = window.innerWidth;
        const height = document.documentElement.scrollHeight;
        // Use smaller divisor on mobile to get more dots
        const divisor = width <= 768 ? 8000 : 15000;
        const dotCount = Math.floor((width * height) / divisor);
        for (let i = 0; i < dotCount; i++) {
            dots.push(new Dot());
        }
    }
    
    // Draw connections between nearby dots
    function drawConnections() {
        const maxDistance = 150;
        
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dx = dots[i].x - dots[j].x;
                const dy = dots[i].y - dots[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.3;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(26, 117, 222, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.stroke();
                }
            }
        }
    }
    
    // Animation loop
    function animate() {
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        // Update and draw dots
        dots.forEach(dot => {
            dot.update();
            dot.draw();
        });
        
        // Draw connections
        drawConnections();
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Track last known width for resize detection
    let lastKnownWidth = window.innerWidth;
    
    // Handle window resize - preserve dots on mobile scroll
    function handleResize() {
        const currentWidth = window.innerWidth;
        const widthChanged = Math.abs(currentWidth - lastKnownWidth) > 100;
        
        resizeCanvas();
        
        // Only reinitialize dots if width changed significantly (rotation/desktop resize)
        if (widthChanged) {
            lastKnownWidth = currentWidth;
            initDots();
        }
    }
    
    // Initialize
    resizeCanvas();
    initDots();
    animate();
    
    // Listen for resize with longer throttle on mobile
    const isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', throttle(handleResize, isMobile ? 500 : 250));
    
    // Disable the height update interval - it's causing issues on mobile
    // The canvas will be sized correctly initially and on actual resizes only
}

// ============================================
// FLOATING BACKGROUND ELEMENTS
// ============================================

function createFloatingElements() {
    const container = document.getElementById('globalFloatingElements');
    if (!container) return;
    
    const elementCount = window.innerWidth <= 768 ? 10 : 20;
    const opacity = 0.3 + Math.random() * 0.5;
    
    // Create triangle
    const triangle = document.createElement('div');
    triangle.className = 'float-element float-triangle';
    triangle.style.left = Math.random() * 100 + '%';
    triangle.style.top = Math.random() * 100 + '%';
    triangle.style.animationDelay = Math.random() * 8 + 's';
    triangle.style.animationDuration = (Math.random() * 4 + 6) + 's';
    triangle.style.setProperty('--float-opacity', opacity);
    container.appendChild(triangle);

    // Create circles and rectangles
    for (let i = 0; i < elementCount; i++) {
        const element = document.createElement('div');
        const isCircle = Math.random() > 0.6;
        
        element.className = `float-element ${isCircle ? 'float-circle' : 'float-rect'}`;
        element.style.left = Math.random() * 100 + '%';
        element.style.top = Math.random() * 100 + '%';
        element.style.animationDelay = Math.random() * 8 + 's';
        element.style.animationDuration = (Math.random() * 4 + 6) + 's';
        element.style.setProperty('--float-opacity', opacity);

        container.appendChild(element);
    }
}

// ============================================
// FULLSCREEN FUNCTIONALITY
// ============================================

function initializeFullscreen() {
    const fullscreenBtn = document.getElementById('navFullscreen');
    if (!fullscreenBtn) return;

    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    document.addEventListener('mozfullscreenchange', updateFullscreenButton);
    document.addEventListener('MSFullscreenChange', updateFullscreenButton);
    
    updateFullscreenButton();
}

function toggleFullscreen() {
    if (!isFullscreenSupported()) {
        alert('Fullscreen mode is not supported in your browser.');
        return;
    }

    if (isInFullscreen()) {
        exitFullscreen();
    } else {
        requestFullscreen();
    }

    if (navigator.vibrate) {
        navigator.vibrate(30);
    }
}

function isFullscreenSupported() {
    return !!(document.fullscreenEnabled || 
              document.webkitFullscreenEnabled || 
              document.mozFullScreenEnabled ||
              document.msFullscreenEnabled);
}

function isInFullscreen() {
    return !!(document.fullscreenElement || 
              document.webkitFullscreenElement || 
              document.mozFullScreenElement ||
              document.msFullscreenElement);
}

function requestFullscreen() {
    const docElm = document.documentElement;
    
    if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
    } else if (docElm.webkitRequestFullScreen) {
        docElm.webkitRequestFullScreen();
    } else if (docElm.mozRequestFullScreen) {
        docElm.mozRequestFullScreen();
    } else if (docElm.msRequestFullscreen) {
        docElm.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

function updateFullscreenButton() {
    const fullscreenBtn = document.getElementById('navFullscreen');
    if (!fullscreenBtn) return;

    if (isInFullscreen()) {
        fullscreenBtn.classList.add('fullscreen-active');
    } else {
        fullscreenBtn.classList.remove('fullscreen-active');
    }
}

// ============================================
// SCROLL HANDLING
// ============================================

function initializeScrollHandling() {
    const handleScroll = throttle(() => {
        const mainNav = document.querySelector('.main-nav');
        if (!mainNav) return;
        
        const scrollDistance = Math.min(window.scrollY, 150);
        const opacity = scrollDistance / 150;
        
        requestAnimationFrame(() => {
            if (scrollDistance > 10) {
                mainNav.style.background = `linear-gradient(180deg, 
                    rgba(0, 0, 0, ${0.95 * opacity}) 0%, 
                    rgba(16, 16, 16, ${0.9 * opacity}) 100%)`;
                mainNav.style.borderBottomColor = `rgba(59, 130, 246, ${0.3 * opacity})`;
                mainNav.style.boxShadow = `0 8px 32px rgba(0, 0, 0, ${0.4 * opacity}), 
                                           0 0 0 1px rgba(59, 130, 246, ${0.1 * opacity})`;
                
                // Only apply backdrop-filter on desktop
                if (window.innerWidth > 768) {
                    mainNav.style.backdropFilter = `blur(${25 * opacity}px)`;
                } else {
                    mainNav.style.backdropFilter = 'none';
                }
            } else {
                mainNav.style.background = 'transparent';
                mainNav.style.backdropFilter = 'none';
                mainNav.style.borderBottomColor = 'transparent';
                mainNav.style.boxShadow = 'none';
            }
        });
    }, 16);

    window.addEventListener('scroll', handleScroll, { passive: true });
}

// ============================================
// ANIMATION OBSERVERS
// ============================================

function initializeAnimationObservers() {
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const target = entry.target;
                
                if (target.classList.contains('content-section')) {
                    target.classList.add('fade-in');
                    setTimeout(() => sectionObserver.unobserve(target), 800);
                } else if (target.classList.contains('focus-area')) {
                    target.classList.add('visible');
                    setTimeout(() => sectionObserver.unobserve(target), 700);
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px 0px'
    });

    // Observe sections and focus areas
    document.querySelectorAll('.content-section, .focus-area').forEach(el => {
        sectionObserver.observe(el);
    });
}

// ============================================
// MAIN INITIALIZATION
// ============================================

function initializeApp() {
    createConstellationBackground();
    // createFloatingElements(); // Disabled - using constellation background instead
    initializeFullscreen();
    initializeScrollHandling();
    initializeAnimationObservers();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);