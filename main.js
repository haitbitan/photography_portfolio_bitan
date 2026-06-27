// main.js - Core logic, initialization, GSAP animations, Lenis scroll

document.addEventListener("DOMContentLoaded", () => {

    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // --- Lenis Smooth Scrolling ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    lenis.on('scroll', (e) => {
        ScrollTrigger.update();
        // Update Scroll Progress bar
        const progress = (lenis.scroll / (lenis.limit)) * 100;
        document.querySelector('.scroll-progress').style.width = `${progress}%`;
    });

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Make lenis globally available for other scripts
    window.lenis = lenis;

    // --- Navigation Logic ---
    const headerNavLinks = document.querySelectorAll('.header-nav-link');

    function setActiveLink(href) {
        headerNavLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === href);
        });
    }

    headerNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            setActiveLink(targetId);
            if (targetId && targetId.startsWith('#')) {
                lenis.scrollTo(targetId);
            }
        });
    });

    function updateActiveNav() {
        let current = '';
        document.querySelectorAll('section[id]').forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.4) {
                current = section.getAttribute('id');
            }
        });
        setActiveLink('#' + current);
    }

    lenis.on('scroll', updateActiveNav);
    setTimeout(updateActiveNav, 100);

    // --- Ambient Audio Toggle ---





    // --- Loader Sequence & Initialization ---
    // --- Loader Sequence & Initialization ---
    function initAnimations() {
        // Timeline for intro
        const tl = gsap.timeline();

        tl.to('.hero-greeting', {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out"
        }, "+=0.3")
            .to('.hero-title', {
                y: 0,
                opacity: 1,
                duration: 1.5,
                ease: "power3.out"
            }, "-=0.6")
            .to('.hero-divider', {
                scaleX: 1,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out"
            }, "-=0.8")
            .to('.hero-subtitle-label', {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out"
            }, "-=0.4")
            .to('.hero-quote', {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out"
            }, "-=0.4")
            .to('.hero-cta', {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out"
            }, "-=0.3")
            .to('.hero-stats', {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out"
            }, "-=0.3")
            .to('.hero-portrait-wrap', {
                x: 0,
                opacity: 1,
                duration: 1.5,
                ease: "power3.out"
            }, "-=1.2")
            .to('.hero-floating-quote', {
                y: 0,
                opacity: 1,
                duration: 1,
                ease: "power2.out"
            }, "-=1")
            .to('.scroll-prompt', {
                opacity: 1,
                duration: 1.5,
                ease: "power2.inOut"
            }, "-=0.2");

        // Road timeline animation
        const milestones = gsap.utils.toArray('.road-milestone');
        const roadProgress = document.getElementById('roadProgress');

        if (milestones.length) {
            gsap.set(milestones, { opacity: 0, y: 30 });

            milestones.forEach((milestone, i) => {
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: milestone,
                        start: "top 80%",
                        toggleActions: "play none none none"
                    }
                });
                tl.to(milestone, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out"
                });
            });

            ScrollTrigger.create({
                trigger: '.road-container',
                start: "top 80%",
                end: "bottom 20%",
                onUpdate: self => {
                    if (roadProgress) {
                        roadProgress.style.height = self.progress * 100 + '%';
                    }
                }
            });
        }

        // Scroll animations
        gsap.utils.toArray('.fade-up').forEach(elem => {
            gsap.from(elem, {
                y: 50,
                opacity: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: elem,
                    start: "top 85%"
                }
            });
        });
    }

    // --- Loader Logic ---
    const progressBar = document.querySelector('.loader-progress');
    const percentText = document.querySelector('.load-percent');

    gsap.set('.loader-logo', { opacity: 0, y: 10 });
    gsap.set('.loader-subtitle', { opacity: 0, y: 10 });

    const loaderTL = gsap.timeline();
    loaderTL.to('.loader-logo', { opacity: 1, y: 0, duration: 1, ease: "power2.out" })
        .to('.loader-subtitle', { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.4");

    let loadProgress = 0;
    let forcedComplete = false;

    function updateProgress(val) {
        loadProgress = val;
        if (progressBar) progressBar.style.width = loadProgress + "%";
        if (percentText) percentText.innerText = Math.floor(loadProgress) + "%";
    }

    function finishLoading() {
        if (forcedComplete) return;
        forcedComplete = true;

        gsap.to({ val: loadProgress }, {
            val: 100,
            duration: 0.4,
            onUpdate: function () {
                updateProgress(this.targets()[0].val);
            },
            onComplete: () => {
                gsap.timeline({
                    onComplete: () => {
                        document.querySelector('.loader').style.display = 'none';
                        document.body.classList.remove('loading');
                        initAnimations();
                        window.dispatchEvent(new Event('loaderComplete'));
                    }
                })
                    .to('.loader-content', {
                        opacity: 0,
                        y: -15,
                        duration: 0.8,
                        ease: "power3.inOut"
                    })
                    .to(".loader", {
                        opacity: 0,
                        duration: 1,
                        ease: "power2.inOut"
                    }, "-=0.5");
            }
        });
    }

    const loadInterval = setInterval(() => {
        if (loadProgress < 95) {
            loadProgress += Math.random() * 2;
            if (loadProgress > 95) loadProgress = 95;
            updateProgress(loadProgress);
        }
    }, 120);

    window.addEventListener('allTexturesLoaded', () => {
        setTimeout(finishLoading, 1000);
    });

    setTimeout(() => {
        clearInterval(loadInterval);
        finishLoading();
    }, 6000);

    // --- Unique 3D Tilt Effect for Glass Cards ---
    const glassCards = document.querySelectorAll('.glass-card');

    glassCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            gsap.to(card, {
                rotateX: rotateX,
                rotateY: rotateY,
                duration: 0.5,
                ease: "power2.out",
                transformPerspective: 1000
            });

            // Add a floating glare effect
            const glare = card.querySelector('.card-glare') || createGlare(card);
            const glareX = (x / rect.width) * 100;
            const glareY = (y / rect.height) * 100;
            glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.08) 0%, transparent 60%)`;
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                duration: 1,
                ease: "elastic.out(1, 0.3)"
            });
            const glare = card.querySelector('.card-glare');
            if (glare) gsap.to(glare, { opacity: 0, duration: 0.5 });
        });
    });

    function createGlare(card) {
        const glare = document.createElement('div');
        glare.classList.add('card-glare');
        glare.style.position = 'absolute';
        glare.style.top = '0';
        glare.style.left = '0';
        glare.style.width = '100%';
        glare.style.height = '100%';
        glare.style.pointerEvents = 'none';
        glare.style.borderRadius = 'inherit';
        glare.style.zIndex = '5';
        card.appendChild(glare);
        return glare;
    }

    // Form Handling
    document.getElementById('contactForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const btn = this.querySelector('.submit-btn span');
        const origText = btn.innerText;
        btn.innerText = "Sending...";
        setTimeout(() => {
            btn.innerText = "Message Sent";
            this.reset();
            setTimeout(() => {
                btn.innerText = origText;
            }, 3000);
        }, 1500);
    });
});
