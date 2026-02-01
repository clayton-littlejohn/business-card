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

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
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
    
    // Set canvas size with proper DPR handling
    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = window.innerWidth;
        const height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }
    
    // Dot class
    class Dot {
        constructor() {
            const height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
            this.x = Math.random() * window.innerWidth;
            this.y = Math.random() * height;
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
        const width = window.innerWidth;
        const height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
        // Reduced dot count for better performance
        const divisor = width <= 768 ? 12000 : 20000;
        const dotCount = Math.min(Math.floor((width * height) / divisor), 150);
        for (let i = 0; i < dotCount; i++) {
            dots.push(new Dot());
        }
    }
    
    // Draw connections between nearby dots (optimized)
    function drawConnections() {
        const maxDistance = 150;
        const maxDistanceSq = maxDistance * maxDistance;
        
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dx = dots[i].x - dots[j].x;
                const dy = dots[i].y - dots[j].y;
                // Use squared distance to avoid sqrt
                const distanceSq = dx * dx + dy * dy;
                
                if (distanceSq < maxDistanceSq) {
                    const distance = Math.sqrt(distanceSq);
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
    
    // Animation loop with visibility optimization
    function animate() {
        if (!isVisible) {
            animationId = requestAnimationFrame(animate);
            return;
        }
        
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = window.innerWidth;
        const height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
        
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        // Update dots
        for (let i = 0; i < dots.length; i++) {
            dots[i].update(width, height);
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
    
    // Handle window resize - preserve dots on height-only changes
    function handleResize() {
        const oldWidth = canvas.width / (window.devicePixelRatio || 1);
        
        resizeCanvas();
        
        // Only reinitialize dots if width changed significantly (desktop resize)
        // Don't reinit for mobile scroll-based height changes
        const newWidth = window.innerWidth;
        const widthChanged = Math.abs(newWidth - oldWidth) > 50;
        
        if (widthChanged) {
            initDots();
        }
    }
    
    // Initialize
    resizeCanvas();
    initDots();
    animate();
    
    // Listen for resize with debounce for better performance
    window.addEventListener('resize', debounce(handleResize, 250));
    
    // Pause animation when tab is not visible
    document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;
    });
    
    // Update canvas height when content changes - use ResizeObserver if available
    if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(debounce(() => {
            resizeCanvas();
        }, 500));
        resizeObserver.observe(document.body);
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
    const mainNav = document.querySelector('.main-nav');
    if (!mainNav) return;
    
    // Cache computed values
    const isDesktop = window.innerWidth > 768;
    
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
                mainNav.style.backdropFilter = isDesktop ? `blur(${25 * opacity}px)` : 'none';
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