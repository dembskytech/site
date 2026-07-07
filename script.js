document.addEventListener('DOMContentLoaded', () => {
    // ===== PARTICLE SYSTEM =====
    (function initParticles() {
        const canvas = document.getElementById('particle-canvas');
        if (!canvas) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            canvas.style.display = 'none';
            return;
        }

        const ctx = canvas.getContext('2d');
        let particles = [];
        let mouseX = -1000;
        let mouseY = -1000;
        let canvasOpacity = 1;
        let animationId;
        const PARTICLE_COUNT = 200;
        const CONNECTION_DIST = 130;
        const MOUSE_INFLUENCE = 160;

        function resize() {
            const hero = canvas.parentElement;
            canvas.width = hero.offsetWidth;
            canvas.height = hero.offsetHeight;
        }

        function generateDTargets(count) {
            const targets = [];
            const w = canvas.width;
            const h = canvas.height;
            const stemX = w * 0.25;
            const stemW = w * 0.03;
            const topY = h * 0.18;
            const bottomY = h * 0.82;
            const curveCenterX = stemX + w * 0.02;
            const curveCenterY = h * 0.5;
            const curveR = w * 0.16;

            const stemCount = Math.floor(count * 0.22);
            for (let i = 0; i < stemCount; i++) {
                const t = i / (stemCount - 1);
                targets.push({
                    x: stemX + (Math.random() - 0.5) * stemW,
                    y: topY + t * (bottomY - topY)
                });
            }

            const topCount = Math.floor(count * 0.12);
            for (let i = 0; i < topCount; i++) {
                const t = i / (topCount - 1);
                targets.push({
                    x: stemX + t * (curveR + stemW * 2) + (Math.random() - 0.5) * stemW,
                    y: topY + (Math.random() - 0.5) * stemW * 0.5
                });
            }

            const bottomCount = Math.floor(count * 0.12);
            for (let i = 0; i < bottomCount; i++) {
                const t = i / (bottomCount - 1);
                targets.push({
                    x: stemX + t * (curveR + stemW * 2) + (Math.random() - 0.5) * stemW,
                    y: bottomY + (Math.random() - 0.5) * stemW * 0.5
                });
            }

            const curveCount = Math.floor(count * 0.34);
            for (let i = 0; i < curveCount; i++) {
                const t = i / (curveCount - 1);
                const angle = -Math.PI * 0.5 + t * Math.PI;
                const r = curveR + (Math.random() - 0.5) * stemW;
                targets.push({
                    x: curveCenterX + Math.cos(angle) * r,
                    y: curveCenterY + Math.sin(angle) * r
                });
            }

            const fillCount = count - stemCount - topCount - bottomCount - curveCount;
            for (let i = 0; i < fillCount; i++) {
                let attempts = 0;
                let px, py, valid;
                do {
                    px = stemX + Math.random() * (curveR + stemW * 2);
                    py = topY + Math.random() * (bottomY - topY);
                    const dx = px - curveCenterX;
                    const dy = py - curveCenterY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const inStem = px >= stemX - stemW && px <= stemX + stemW * 2;
                    const inCurve = dist <= curveR;
                    valid = inStem || inCurve;
                    attempts++;
                } while (!valid && attempts < 50);
                targets.push({ x: px, y: py });
            }

            return targets;
        }

        function createParticles() {
            resize();
            const targets = generateDTargets(PARTICLE_COUNT);
            particles = targets.map(t => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                targetX: t.x,
                targetY: t.y,
                vx: 0,
                vy: 0,
                size: Math.random() * 2.5 + 1,
                opacity: Math.random() * 0.5 + 0.3
            }));
        }

        function updateParticles() {
            for (const p of particles) {
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                p.vx += dx * 0.04;
                p.vy += dy * 0.04;
                p.vx *= 0.88;
                p.vy *= 0.88;

                if (mouseX >= 0) {
                    const rdx = p.x - mouseX;
                    const rdy = p.y - mouseY;
                    const rDistSq = rdx * rdx + rdy * rdy;
                    const repelR = 90;
                    if (rDistSq < repelR * repelR && rDistSq > 1) {
                        const rDist = Math.sqrt(rDistSq);
                        const force = (repelR - rDist) / repelR * 1.5;
                        p.vx += (rdx / rDist) * force;
                        p.vy += (rdy / rDist) * force;
                    }
                }

                p.x += p.vx;
                p.y += p.vy;
            }
        }

        function drawParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const connDistSq = CONNECTION_DIST * CONNECTION_DIST;
            const mouseInfSq = MOUSE_INFLUENCE * MOUSE_INFLUENCE;
            const count = particles.length;

            for (let i = 0; i < count; i++) {
                for (let j = i + 1; j < count; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < connDistSq) {
                        const dist = Math.sqrt(distSq);
                        const baseOpacity = (1 - dist / CONNECTION_DIST) * 0.12;

                        let mouseBoost = 0;
                        if (mouseX >= 0) {
                            const mx = (particles[i].x + particles[j].x) * 0.5 - mouseX;
                            const my = (particles[i].y + particles[j].y) * 0.5 - mouseY;
                            const mDistSq = mx * mx + my * my;
                            if (mDistSq < mouseInfSq) {
                                const mDist = Math.sqrt(mDistSq);
                                mouseBoost = (1 - mDist / MOUSE_INFLUENCE) * 0.25;
                            }
                        }

                        const alpha = Math.min(baseOpacity + mouseBoost, 0.4) * canvasOpacity;
                        if (alpha > 0.005) {
                            ctx.beginPath();
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.strokeStyle = `rgba(100, 140, 255, ${alpha})`;
                            ctx.lineWidth = 0.8;
                            ctx.stroke();
                        }
                    }
                }
            }

            for (const p of particles) {
                const alpha = p.opacity * canvasOpacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(100, 160, 255, ${alpha})`;
                ctx.fill();
            }
        }

        function animate() {
            updateParticles();
            drawParticles();
            animationId = requestAnimationFrame(animate);
        }

        function handleScroll() {
            const hero = canvas.closest('.hero');
            const rect = hero.getBoundingClientRect();
            const progress = 1 - (rect.bottom / window.innerHeight);
            canvasOpacity = Math.max(0, 1 - progress * 1.5);
            canvas.style.opacity = canvasOpacity;
        }

        function handleMouse(e) {
            const hero = canvas.closest('.hero');
            const heroRect = hero.getBoundingClientRect();
            if (e.clientY >= heroRect.top && e.clientY <= heroRect.bottom) {
                mouseX = e.clientX;
                mouseY = e.clientY;
            } else {
                mouseX = -1000;
                mouseY = -1000;
            }
        }

        function handleResize() {
            createParticles();
        }

        document.addEventListener('mousemove', handleMouse);
        document.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            mouseX = touch.clientX;
            mouseY = touch.clientY;
        }, { passive: true });
        document.addEventListener('touchend', () => {
            mouseX = -1000;
            mouseY = -1000;
        });

        let scrollTick;
        window.addEventListener('scroll', () => {
            cancelAnimationFrame(scrollTick);
            scrollTick = requestAnimationFrame(handleScroll);
        }, { passive: true });

        let resizeTick;
        window.addEventListener('resize', () => {
            cancelAnimationFrame(resizeTick);
            resizeTick = setTimeout(handleResize, 200);
        });

        createParticles();
        animate();
    })();

    // ===== CUSTOM CURSOR =====
    (function initCursor() {
        const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
        if (isTouch) return;

        const cursor = document.querySelector('.cursor');
        const glow = document.querySelector('.cursor-glow');
        if (!cursor) return;

        let posX = -100;
        let posY = -100;
        let currentX = -100;
        let currentY = -100;

        document.addEventListener('mousemove', (e) => {
            posX = e.clientX;
            posY = e.clientY;
        });

        function animateCursor() {
            currentX += (posX - currentX) * 0.15;
            currentY += (posY - currentY) * 0.15;
            cursor.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
            glow.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
            requestAnimationFrame(animateCursor);
        }

        document.addEventListener('mouseenter', () => glow.classList.add('visible'));
        document.addEventListener('mouseleave', () => glow.classList.remove('visible'));

        const hoverTargets = document.querySelectorAll('a, button, .btn, .service-card, .portfolio-item, .testimonial-card');
        hoverTargets.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.width = '20px';
                cursor.style.height = '20px';
                cursor.style.background = 'var(--color-accent)';
                glow.style.width = '70px';
                glow.style.height = '70px';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.width = '8px';
                cursor.style.height = '8px';
                cursor.style.background = 'var(--color-primary)';
                glow.style.width = '40px';
                glow.style.height = '40px';
            });
        });

        animateCursor();
    })();

    // ===== NAV SCROLL BEHAVIOR =====
    (function initNavScroll() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        let lastScroll = 0;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScroll = window.scrollY;

                    if (currentScroll > 100) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }

                    if (currentScroll > lastScroll && currentScroll > 150) {
                        header.classList.add('hidden');
                    } else {
                        header.classList.remove('hidden');
                    }

                    lastScroll = currentScroll;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    })();

    // ===== SCROLL REVEAL ANIMATIONS =====
    (function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = parseInt(el.dataset.delay) || 0;
                    setTimeout(() => {
                        el.classList.add('visible');
                    }, delay);
                    observer.unobserve(el);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    })();

    // ===== TILT CARDS =====
    (function initTiltCards() {
        const cards = document.querySelectorAll('.tilt-card');

        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / centerY * -6;
                const rotateY = (x - centerX) / centerX * 6;
                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                card.style.transition = 'transform 0.5s ease';
                setTimeout(() => { card.style.transition = ''; }, 500);
            });
        });
    })();

    // ===== MOBILE NAV =====
    (function initMobileNav() {
        const toggle = document.querySelector('.nav-toggle');
        const navLinks = document.querySelector('.nav-links');
        if (!toggle || !navLinks) return;

        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            navLinks.classList.toggle('open');
            document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('active');
                navLinks.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    })();

    // ===== SMOOTH SCROLL =====
    (function initSmoothScroll() {
        const header = document.querySelector('.site-header');
        const headerHeight = header ? header.offsetHeight : 64;

        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;

                const target = document.querySelector(href);
                if (!target) return;

                e.preventDefault();
                const targetPos = target.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({
                    top: targetPos,
                    behavior: 'smooth'
                });
            });
        });
    })();

    // ===== ACTIVE NAV HIGHLIGHT =====
    (function initActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a');
        if (!sections.length || !navLinks.length) return;

        const header = document.querySelector('.site-header');
        const headerHeight = header ? header.offsetHeight : 64;

        function updateActive() {
            const scrollY = window.scrollY;
            let current = '';

            sections.forEach(section => {
                const top = section.offsetTop - headerHeight - 100;
                const bottom = top + section.offsetHeight;
                if (scrollY >= top && scrollY < bottom) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });

            if (scrollY < 100) {
                navLinks.forEach(link => link.classList.remove('active'));
                const heroLink = document.querySelector('.nav-links a[href="#hero"]');
                if (heroLink) heroLink.classList.add('active');
            }
        }

        window.addEventListener('scroll', updateActive, { passive: true });
        updateActive();
    })();

    // ===== COPY EMAIL =====
    (function initCopyEmail() {
        const copyBtn = document.querySelector('.copy-email');
        if (!copyBtn) return;

        copyBtn.addEventListener('click', async () => {
            const email = copyBtn.dataset.email;
            if (!email) return;

            try {
                await navigator.clipboard.writeText(email);
            } catch {
                const textarea = document.createElement('textarea');
                textarea.value = email;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            const feedback = copyBtn.querySelector('.copy-feedback');
            copyBtn.classList.add('copied');
            if (feedback) {
                feedback.classList.add('show');
                setTimeout(() => {
                    feedback.classList.remove('show');
                    copyBtn.classList.remove('copied');
                }, 2000);
            }
        });
    })();

    // ===== FOOTER YEAR =====
    (function initFooterYear() {
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
        }
    })();
});
