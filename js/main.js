// Main JavaScript file for Phillip Castro Portfolio
// Handles responsive behavior and user interactions

(function() {
    'use strict';

    // DOM Content Loaded Event
    document.addEventListener('DOMContentLoaded', function() {
        initializePortfolio();
    });

    // Initialize portfolio functionality
    function initializePortfolio() {
        setupImageLazyLoading();
        setupResponsiveNavigation();
        setupSmoothScrolling();
        setupProjectCardInteractions();
        setupKeyboardNavigation();
        setupErrorHandling();

    }

    // Lazy loading for project images
    function setupImageLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver(function(entries, observer) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            img.classList.remove('lazy');
                            observer.unobserve(img);
                        }
                    }
                });
            });

            const lazyImages = document.querySelectorAll('img.lazy');
            lazyImages.forEach(function(img) {
                imageObserver.observe(img);
            });
        }
    }

    // Responsive navigation handling
    function setupResponsiveNavigation() {
        const header = document.querySelector('.header');
        if (!header) return;

        // Add scroll behavior for header on mobile
        let lastScrollTop = 0;
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (window.innerWidth <= 768) {
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    header.style.transform = 'translateY(-100%)';
                } else {
                    header.style.transform = 'translateY(0)';
                }
            } else {
                header.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
        });
    }

    // Smooth scrolling for anchor links
    function setupSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(function(link) {
            link.addEventListener('click', function(e) {
                const href = link.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Project card interaction enhancements
    function setupProjectCardInteractions() {
        const projectCards = document.querySelectorAll('.project-card');
        
        projectCards.forEach(function(card) {
            const link = card.querySelector('.project-link');
            if (!link) return;

            // Add keyboard support
            card.setAttribute('tabindex', '0');
            
            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    link.click();
                }
            });

            // Enhanced touch support for iOS scrolling fix
            let touchStartTime = 0;
            let touchStartY = 0;
            let isTouchScrolling = false;
            
            card.addEventListener('touchstart', function(e) {
                touchStartTime = Date.now();
                touchStartY = e.touches[0].clientY;
                isTouchScrolling = false;
            }, { passive: true });
            
            card.addEventListener('touchmove', function(e) {
                const touchMoveY = e.touches[0].clientY;
                const deltaY = Math.abs(touchMoveY - touchStartY);
                
                if (deltaY > 10) { // User is scrolling
                    isTouchScrolling = true;
                }
            }, { passive: true });
            
            card.addEventListener('touchend', function(e) {
                const touchEndTime = Date.now();
                const touchDuration = touchEndTime - touchStartTime;
                
                // Only navigate if it was a quick tap and not a scroll
                if (!isTouchScrolling && touchDuration < 500) {
                    e.preventDefault();
                    link.click();
                }
            });
        });
    }

    // Enhanced keyboard navigation
    function setupKeyboardNavigation() {
        // Grid navigation for homepage
        const gridItems = document.querySelectorAll('.grid-item');
        if (gridItems.length > 0) {
            gridItems.forEach(function(item, index) {
                const link = item.querySelector('.grid-link');
                if (!link) return;

                item.setAttribute('tabindex', '0');
                
                item.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        link.click();
                    }
                    
                    // Arrow key navigation
                    if (e.key === 'ArrowRight' && index < gridItems.length - 1) {
                        e.preventDefault();
                        gridItems[index + 1].focus();
                    } else if (e.key === 'ArrowLeft' && index > 0) {
                        e.preventDefault();
                        gridItems[index - 1].focus();
                    }
                });
            });
        }

        // Escape key to go back
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const backLink = document.querySelector('.back-link');
                if (backLink) {
                    backLink.click();
                }
            }
        });
    }

    // Error handling for images and links
    function setupErrorHandling() {
        // Handle missing images
        const images = document.querySelectorAll('img');
        images.forEach(function(img) {
            img.addEventListener('error', function() {
                this.style.display = 'none';
                
                // Create placeholder
                const placeholder = document.createElement('div');
                placeholder.className = 'image-placeholder';
                placeholder.style.cssText = `
                    width: 100%;
                    height: 200px;
                    background-color: #f0f0f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #999;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                `;
                placeholder.textContent = 'Image Unavailable';
                
                this.parentNode.insertBefore(placeholder, this);
            });
        });

        // Handle PDF resume link errors
        const resumeLinks = document.querySelectorAll('a[href*=".pdf"]');
        resumeLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                // Add loading state
                const originalText = this.textContent;
                this.textContent = 'Loading...';
                
                setTimeout(() => {
                    this.textContent = originalText;
                }, 1000);
            });
        });
    }



    // Utility function for responsive breakpoint detection
    function getBreakpoint() {
        const width = window.innerWidth;
        if (width <= 480) return 'mobile';
        if (width <= 768) return 'tablet';
        return 'desktop';
    }

    // Debounce function for performance optimization
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = function() {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Expose utilities to global scope if needed
    window.PortfolioUtils = {
        getBreakpoint: getBreakpoint,
        debounce: debounce
    };

})();

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = performance.timing;
            const loadTime = perfData.loadEventEnd - perfData.navigationStart;
            
            // Log performance data for optimization
            console.log('Page load time:', loadTime + 'ms');
            
            // Send analytics if needed
            if (loadTime > 3000) {
                console.warn('Page load time is high:', loadTime + 'ms');
            }
        }, 0);
    });
}

// Service Worker registration for offline capability (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(function(registration) {
        //         console.log('SW registered: ', registration);
        //     })
        //     .catch(function(registrationError) {
        //         console.log('SW registration failed: ', registrationError);
        //     });
    });
}
