/* =====================================================================
   motion.js — Lenis smooth scroll + GSAP reveals + custom cursor.
   Loaded after GSAP / ScrollTrigger / SplitText / Lenis CDN scripts.
   Everything degrades gracefully: no JS or no libs => content visible,
   no motion. Honors prefers-reduced-motion (keeps fades, drops movement).
   ===================================================================== */
(function () {
    'use strict';

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    var SplitText = window.SplitText;

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        setupHeaderState();
        if (!gsap) { return; } // no animation library — leave content as-is

        if (ScrollTrigger) { gsap.registerPlugin(ScrollTrigger); }
        if (SplitText) { try { gsap.registerPlugin(SplitText); } catch (e) {} }

        if (!reduce) {
            setupSmoothScroll();
            setupCursor();
            setupMagnetic();
        }
        setupReveals();
        setupHeroIntro();
    }

    /* --------------------------------------------------------------- *
     * Header: add .is-scrolled once the user leaves the very top
     * --------------------------------------------------------------- */
    function setupHeaderState() {
        var header = document.querySelector('.site-header');
        if (!header) { return; }
        var onScroll = function () {
            header.classList.toggle('is-scrolled', window.scrollY > 12);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* --------------------------------------------------------------- *
     * Lenis smooth scroll, driven by the GSAP ticker
     * --------------------------------------------------------------- */
    function setupSmoothScroll() {
        if (typeof window.Lenis === 'undefined') { return; }
        var lenis = new window.Lenis({
            duration: 1.05,
            easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
            smoothWheel: true
        });
        window.__lenis = lenis;

        if (ScrollTrigger) {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
            gsap.ticker.lagSmoothing(0);
        } else {
            requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
        }

        // in-page anchor links go through Lenis
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                var id = a.getAttribute('href');
                if (id.length < 2) { return; }
                var target = document.querySelector(id);
                if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -80 }); }
            });
        });
    }

    /* --------------------------------------------------------------- *
     * Scroll reveals — staggered as groups enter the viewport
     * --------------------------------------------------------------- */
    function setupReveals() {
        var items = gsap.utils.toArray('[data-reveal]');
        if (!items.length) { return; }

        if (reduce || !ScrollTrigger) {
            // fade only, no movement
            gsap.set(items, { opacity: 0 });
            gsap.to(items, { opacity: 1, duration: 0.4, stagger: 0.02 });
            return;
        }

        gsap.set(items, { opacity: 0, y: 26 });
        ScrollTrigger.batch(items, {
            start: 'top 88%',
            once: true,
            onEnter: function (batch) {
                gsap.to(batch, {
                    opacity: 1, y: 0,
                    duration: 0.7, ease: 'power3.out',
                    stagger: 0.08, overwrite: true
                });
            }
        });
    }

    /* --------------------------------------------------------------- *
     * Hero intro — split the headline into lines and mask them up
     * --------------------------------------------------------------- */
    function setupHeroIntro() {
        var title = document.querySelector('[data-split]');
        if (!title) { return; }

        if (reduce || !SplitText) {
            gsap.fromTo(title, { opacity: 0 }, { opacity: 1, duration: 0.5 });
            return;
        }
        try {
            var split = new SplitText(title, { type: 'lines,words', linesClass: 'split-line' });
            gsap.set(split.lines, { overflow: 'hidden' });
            gsap.set(title, { opacity: 1 });
            gsap.from(split.words, {
                yPercent: 115, opacity: 0,
                duration: 1, ease: 'power4.out',
                stagger: 0.045, delay: 0.12
            });
        } catch (e) {
            gsap.set(title, { opacity: 1 });
        }
    }

    /* --------------------------------------------------------------- *
     * Custom cursor — dot + lerped ring, grows over interactives
     * --------------------------------------------------------------- */
    function setupCursor() {
        if (!finePointer) { return; }
        var dot = document.createElement('div');
        var ring = document.createElement('div');
        dot.className = 'cursor-dot';
        ring.className = 'cursor-ring';
        document.body.appendChild(dot);
        document.body.appendChild(ring);
        document.body.classList.add('cursor-ready');

        var ringX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3' });
        var ringY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3' });
        var dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2' });
        var dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2' });

        window.addEventListener('mousemove', function (e) {
            dotX(e.clientX); dotY(e.clientY);
            ringX(e.clientX); ringY(e.clientY);
        });

        var hoverSel = 'a, button, [data-cursor], .work-card, .index-row';
        document.addEventListener('mouseover', function (e) {
            if (e.target.closest(hoverSel)) { ring.classList.add('is-hover'); }
        });
        document.addEventListener('mouseout', function (e) {
            if (e.target.closest(hoverSel)) { ring.classList.remove('is-hover'); }
        });
        document.addEventListener('mouseleave', function () {
            gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
        });
        document.addEventListener('mouseenter', function () {
            gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
        });
    }

    /* --------------------------------------------------------------- *
     * Magnetic buttons
     * --------------------------------------------------------------- */
    function setupMagnetic() {
        if (!finePointer) { return; }
        document.querySelectorAll('[data-magnetic]').forEach(function (el) {
            var xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
            var yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect();
                xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
                yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
            });
            el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
        });
    }
})();
