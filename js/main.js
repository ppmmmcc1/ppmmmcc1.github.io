// main.js — progressive-enhancement utilities for the portfolio.
// Motion/animation lives in motion.js; this file handles the mobile
// menu, image fallbacks, and small keyboard niceties.
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        setupMobileMenu();
        setupImageErrorHandling();
        setupKeyboardShortcuts();
        setYear();
    });

    // Mobile nav toggle
    function setupMobileMenu() {
        var toggle = document.querySelector('.menu-toggle');
        var nav = document.querySelector('.site-nav');
        if (!toggle || !nav) { return; }

        toggle.addEventListener('click', function () {
            var open = document.body.classList.toggle('menu-open');
            toggle.setAttribute('aria-expanded', String(open));
        });

        // close the menu when a link is chosen
        nav.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () {
                document.body.classList.remove('menu-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });

        // close on Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
                document.body.classList.remove('menu-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Replace broken images with a labelled placeholder
    function setupImageErrorHandling() {
        document.querySelectorAll('img').forEach(function (img) {
            img.addEventListener('error', function handleError() {
                img.removeEventListener('error', handleError);
                var ph = document.createElement('div');
                ph.className = 'image-placeholder';
                ph.style.cssText = 'width:100%;aspect-ratio:4/3;display:flex;align-items:center;' +
                    'justify-content:center;background:var(--lab,#0a0b0d);color:var(--on-lab-mute,#8b9098);' +
                    'font-family:var(--font-mono,monospace);font-size:0.7rem;letter-spacing:0.14em;' +
                    'text-transform:uppercase;';
                ph.textContent = 'Image unavailable';
                if (img.parentNode) { img.parentNode.replaceChild(ph, img); }
            });
        });
    }

    // Escape on a detail page returns to the previous list
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !document.body.classList.contains('menu-open')) {
                var back = document.querySelector('.back-link');
                if (back) { back.click(); }
            }
        });
    }

    // Auto-fill any [data-year] elements in the footer
    function setYear() {
        var y = String(new Date().getFullYear());
        document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = y; });
    }

    // Utilities kept for any inline callers
    function getBreakpoint() {
        var w = window.innerWidth;
        if (w <= 480) { return 'mobile'; }
        if (w <= 768) { return 'tablet'; }
        return 'desktop';
    }
    function debounce(fn, wait) {
        var t;
        return function () {
            var args = arguments, ctx = this;
            clearTimeout(t);
            t = setTimeout(function () { fn.apply(ctx, args); }, wait);
        };
    }
    window.PortfolioUtils = { getBreakpoint: getBreakpoint, debounce: debounce };
})();
