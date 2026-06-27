class Carousel3D {
    constructor() {
        this.manager = new CloudinaryManager();
        this.imagesData = [];
        this.currentIndex = 0;
        this.isAnimating = false;
        this.autoplayTimer = null;
        this.autoplayDelay = 800;
        this.idleTimer = null;
        this.userInteracted = false;

        this.track = document.getElementById('carouselTrack');
        this.dotsContainer = document.getElementById('carouselDots');
        this.ccCurrent = document.getElementById('ccCurrent');
        this.ccTotal = document.getElementById('ccTotal');
        this.prevBtn = document.getElementById('carouselPrev');
        this.nextBtn = document.getElementById('carouselNext');
        this.container = document.getElementById('carousel3d');

        this.init();
    }

    async init() {
        try {
            const tag = typeof FOLDER_TAG !== 'undefined' ? FOLDER_TAG : "portfolio";
            this.imagesData = await this.manager.fetchGalleryImages(tag);
            this.build();
            this.layout(0, true);
            this.bindEvents();
            this.startAutoplay();
            window.dispatchEvent(new Event('allTexturesLoaded'));
        } catch (error) {
            console.error("Gallery failed:", error);
            window.dispatchEvent(new Event('allTexturesLoaded'));
        }
    }

    build() {
        this.ccTotal.textContent = String(this.imagesData.length).padStart(2, '0');

        this.imagesData.forEach((data, i) => {
            const card = document.createElement('div');
            card.className = 'carousel-card';
            card.dataset.index = i;
            card.innerHTML = `
                <img src="${data.url}" alt="${data.title || 'Photo'}" loading="lazy">
                <div class="card-label">${(data.title || 'Untitled').toUpperCase()}</div>
            `;
            card.addEventListener('click', () => {
                if (typeof window.openLightbox === 'function') {
                    window.openLightbox(i, this);
                }
            });
            this.track.appendChild(card);

            const dot = document.createElement('button');
            dot.className = 'carousel-dot';
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                this.goTo(i);
            });
            this.dotsContainer.appendChild(dot);
        });
    }

    layout(index, instant) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.currentIndex = index;

        const cards = this.track.querySelectorAll('.carousel-card');
        const dots = this.dotsContainer.querySelectorAll('.carousel-dot');
        const total = cards.length;
        const duration = instant ? 0 : 0.5;

        cards.forEach((card, i) => {
            const diff = i - index;
            const absDiff = Math.abs(diff);
            const maxDiff = 3;

            const rotY = diff * -14;
            const translateX = diff * 220;
            const translateZ = -absDiff * 160;
            const scale = 1 - absDiff * 0.15;
            const opacity = absDiff > maxDiff ? 0 : 1 - absDiff * 0.25;
            const brightness = 1 - absDiff * 0.2;
            const zIndex = total - absDiff;

            gsap.to(card, {
                rotationY: rotY,
                x: translateX,
                z: translateZ,
                scale: scale,
                opacity: opacity,
                duration: duration,
                ease: 'power3.out',
                overwrite: 'auto',
                onComplete: () => { this.isAnimating = false; }
            });

            gsap.set(card, { zIndex: zIndex });
            card.style.filter = `brightness(${brightness})`;
        });

        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));

        this.ccCurrent.textContent = String(index + 1).padStart(2, '0');
    }

    goTo(index) {
        if (index === this.currentIndex) return;
        this.layout(index);
        this.resetAutoplay();
    }

    next() { this.goTo((this.currentIndex + 1) % this.imagesData.length); }

    prev() { this.goTo((this.currentIndex - 1 + this.imagesData.length) % this.imagesData.length); }

    startAutoplay() {
        this.stopAutoplay();
        this.autoplayTimer = setInterval(() => {
            if (!this.userInteracted) {
                this.next();
            }
        }, this.autoplayDelay);
    }

    stopAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    resetAutoplay() {
        this.userInteracted = true;
        this.stopAutoplay();
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
            this.userInteracted = false;
            this.startAutoplay();
        }, 5000);
    }

    bindEvents() {
        this.prevBtn.addEventListener('click', () => { this.prev(); });
        this.nextBtn.addEventListener('click', () => { this.next(); });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { this.prev(); }
            if (e.key === 'ArrowRight') { this.next(); }
        });

        let touchStartX = 0;
        let touchEndX = 0;
        this.container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        this.container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) this.next();
                else this.prev();
            }
        }, { passive: true });

        this.container.addEventListener('mouseenter', () => { this.stopAutoplay(); });
        this.container.addEventListener('mouseleave', () => {
            if (!this.userInteracted) this.startAutoplay();
        });
    }
}

// ─── LIGHTBOX ─────────────────────────────────────────────────────────

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const lbImg = lightbox.querySelector('.lightbox-img');
    const lbClose = lightbox.querySelector('.lightbox-close');
    const lbOverlay = lightbox.querySelector('.lightbox-overlay');
    const metaTitle = lightbox.querySelector('.meta-title');
    const metaLoc = lightbox.querySelector('.meta-loc');
    const metaCam = lightbox.querySelector('.meta-cam');
    const metaYear = lightbox.querySelector('.meta-year');
    const prevBtn = lightbox.querySelector('.nav-prev');
    const nextBtn = lightbox.querySelector('.nav-next');

    let currentIndex = 0;
    let galleryInstance = null;

    function openLightbox(index, gallery) {
        galleryInstance = gallery;
        currentIndex = index;
        showImage(index);
        lightbox.classList.add('active');
        if (window.lenis) window.lenis.stop();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lbImg.classList.remove('loaded');
        if (window.lenis) window.lenis.start();
    }

    function showImage(index) {
        if (!galleryInstance) return;
        const data = galleryInstance.imagesData[index];
        if (!data) return;
        lbImg.classList.remove('loaded');
        lbImg.onload = () => lbImg.classList.add('loaded');
        lbImg.src = data.url;
        if (metaTitle) metaTitle.textContent = data.title || '';
        if (metaLoc) metaLoc.textContent = data.location || '';
        if (metaCam) metaCam.textContent = (data.camera || '').split(':').pop() || '';
        if (metaYear) metaYear.textContent = data.year || '';
    }

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbOverlay) lbOverlay.addEventListener('click', closeLightbox);

    if (prevBtn) prevBtn.addEventListener('click', () => {
        if (!galleryInstance) return;
        currentIndex = (currentIndex - 1 + galleryInstance.imagesData.length) % galleryInstance.imagesData.length;
        showImage(currentIndex);
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
        if (!galleryInstance) return;
        currentIndex = (currentIndex + 1) % galleryInstance.imagesData.length;
        showImage(currentIndex);
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft' && prevBtn) prevBtn.click();
        if (e.key === 'ArrowRight' && nextBtn) nextBtn.click();
    });

    window.openLightbox = openLightbox;
}

// ─── INITIALIZATION ───────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    initLightbox();

    setTimeout(() => {
        const bgScene = new ThreeScene();
        const gallery = new Carousel3D();
    }, 100);
});
