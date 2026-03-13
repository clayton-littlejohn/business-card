'use strict';

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
    
    const ctx = canvas.getContext('2d', { alpha: true });
    let dots = [];
    let animationId;
    let isVisible = true;
    
    // Store stable dimensions to prevent mobile browser UI resize jitter
    let stableWidth = window.innerWidth;
    let stableHeight = window.innerHeight;
    
    // Set canvas size with proper DPR handling
    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        
        canvas.width = stableWidth * dpr;
        canvas.height = stableHeight * dpr;
        canvas.style.width = stableWidth + 'px';
        canvas.style.height = stableHeight + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }
    
    // Dot class
    class Dot {
        constructor() {
            this.x = Math.random() * stableWidth;
            this.y = Math.random() * stableHeight;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = Math.random() * 1.5 + 0.5;
        }
        
        update(width, height) {
            this.x += this.vx;
            this.y += this.vy;
            
            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
            
            // Keep within bounds
            this.x = Math.max(0, Math.min(width, this.x));
            this.y = Math.max(0, Math.min(height, this.y));
        }
    }
    
    // Initialize dots
    function initDots() {
        dots = [];
        // Reduced dot count for better performance
        const divisor = stableWidth <= 768 ? 12000 : 20000;
        const dotCount = Math.min(Math.floor((stableWidth * stableHeight) / divisor), 150);
        for (let i = 0; i < dotCount; i++) {
            dots.push(new Dot());
        }
    }
    
    // Draw connections between nearby dots (optimized with batching)
    function drawConnections() {
        const maxDistance = 150;
        const maxDistanceSq = maxDistance * maxDistance;
        
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dx = dots[i].x - dots[j].x;
                const dy = dots[i].y - dots[j].y;
                const distanceSq = dx * dx + dy * dy;
                
                if (distanceSq < maxDistanceSq) {
                    const distance = Math.sqrt(distanceSq);
                    const opacity = (1 - distance / maxDistance) * 0.3;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(26, 117, 222, ${opacity})`;
                    ctx.moveTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.stroke();
                }
            }
        }
    }
    
    // Animation loop with visibility optimization
    function animate() {
        if (!isVisible) {
            animationId = requestAnimationFrame(animate);
            return;
        }
        
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        // Update dots using stable dimensions
        for (let i = 0; i < dots.length; i++) {
            dots[i].update(stableWidth, stableHeight);
        }
        
        // Batch draw all dots with single fillStyle
        ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
        for (let i = 0; i < dots.length; i++) {
            ctx.beginPath();
            ctx.arc(dots[i].x, dots[i].y, dots[i].radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw connections
        drawConnections();
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Handle window resize - scale existing dots smoothly
    function handleResize() {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        
        // Calculate the change in dimensions
        const widthDiff = Math.abs(newWidth - stableWidth);
        const heightDiff = Math.abs(newHeight - stableHeight);
        
        // Ignore height-only changes under 150px (mobile browser UI appearing/disappearing)
        // Only resize if width changed OR height changed significantly (orientation change)
        const isWidthChange = widthDiff > 1;
        const isSignificantHeightChange = heightDiff > 150;
        
        if (!isWidthChange && !isSignificantHeightChange) {
            return;
        }
        
        const oldWidth = stableWidth;
        const oldHeight = stableHeight;
        
        // Update stable dimensions
        stableWidth = newWidth;
        stableHeight = newHeight;
        
        // Scale existing dot positions to new canvas size
        const scaleX = newWidth / oldWidth;
        const scaleY = newHeight / oldHeight;
        
        for (let i = 0; i < dots.length; i++) {
            dots[i].x *= scaleX;
            dots[i].y *= scaleY;
            // Ensure dots stay within bounds
            dots[i].x = Math.max(0, Math.min(newWidth, dots[i].x));
            dots[i].y = Math.max(0, Math.min(newHeight, dots[i].y));
        }
        
        // Resize the canvas
        resizeCanvas();
        
        // Adjust dot count to match new area density
        const divisor = newWidth <= 768 ? 12000 : 20000;
        const targetDotCount = Math.min(Math.floor((newWidth * newHeight) / divisor), 150);
        
        // Add dots if needed
        while (dots.length < targetDotCount) {
            const newDot = new Dot();
            // Spawn new dots at edges for smoother appearance
            if (Math.random() < 0.5) {
                newDot.x = Math.random() < 0.5 ? 0 : newWidth;
                newDot.y = Math.random() * newHeight;
            } else {
                newDot.x = Math.random() * newWidth;
                newDot.y = Math.random() < 0.5 ? 0 : newHeight;
            }
            dots.push(newDot);
        }
        
        // Remove excess dots gradually (from end of array)
        while (dots.length > targetDotCount) {
            dots.pop();
        }
    }
    
    // Initialize
    resizeCanvas();
    initDots();
    animate();
    
    // Listen for resize with throttle for smoother updates
    window.addEventListener('resize', throttle(handleResize, 50));
    
    // Pause animation when tab is not visible
    document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;
    });
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
    const mainNav = document.querySelector('.main-nav');
    if (!mainNav) return;
    
    // Cache computed values
    const isDesktop = window.innerWidth > 768;
    
    // On mobile, always show navbar background
    if (!isDesktop) {
        mainNav.style.background = `linear-gradient(180deg, 
            rgba(0, 0, 0, 0.95) 0%, 
            rgba(16, 16, 16, 0.9) 100%)`;
        mainNav.style.borderBottomColor = `rgba(59, 130, 246, 0.3)`;
        mainNav.style.boxShadow = `0 8px 32px rgba(0, 0, 0, 0.4), 
                                   0 0 0 1px rgba(59, 130, 246, 0.1)`;
        return;
    }
    
    const handleScroll = throttle(() => {
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
                mainNav.style.backdropFilter = `blur(${25 * opacity}px)`;
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
    initializeFullscreen();
    initializeScrollHandling();
    initializeAnimationObservers();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);