document.addEventListener('DOMContentLoaded', function() {

    // --- Smooth Scrolling for Nav Links ---
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"], .logo[href^="#"], .hero-section a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            let targetId = this.getAttribute('href');
            if (targetId === '#') targetId = '#hero';

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = document.querySelector('header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                const mobileNav = document.querySelector('.nav-links');
                if (mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
                    document.getElementById('hamburger-menu').innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
    });

    // --- Mobile Navigation Toggle ---
    const hamburger = document.getElementById('hamburger-menu');
    const mobileNav = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        if (mobileNav.classList.contains('active')) {
            hamburger.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });

    // --- Active Nav Link Highlighting on Scroll ---
    const sections = document.querySelectorAll('main section[id]');
    const headerHeight = document.querySelector('header').offsetHeight;

    function changeNavOnScroll() {
        let scrollY = window.pageYOffset;
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - headerHeight - 100; // Increased offset
            let sectionId = current.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
                const activeLink = document.querySelector('.nav-links a[href="#' + sectionId + '"]');
                if (activeLink) activeLink.classList.add('active');
            }
        });
        if (scrollY < sections[0].offsetTop - headerHeight - 100) {
            document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
            const homeLink = document.querySelector('.nav-links a[href="#hero"]');
            if (homeLink) homeLink.classList.add('active');
        }
    }
    window.addEventListener('scroll', changeNavOnScroll);
    changeNavOnScroll();

    // --- Contact Form Submission (Basic Example) ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you for your message! (This is a demo - no email sent)');
            this.reset();
        });
    }

    // --- Update Footer Year ---
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Advanced Scroll Animations with Intersection Observer ---
    const animationOptions = {
        threshold: 0.1, // Trigger when 10% of the element is visible
        // rootMargin: "0px 0px -50px 0px" // Optional: adjust trigger point
    };

    const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const animationType = el.dataset.animation;
                let delay = parseInt(el.dataset.animationDelay) || 0;
                const staggerChildren = el.classList.contains('stagger-children');

                if (staggerChildren) {
                    const baseDelay = parseInt(el.dataset.animationBaseDelay) || 0;
                    let childDelay = 0;
                    const children = el.querySelectorAll('[data-animation]');
                    children.forEach((child, index) => {
                        const childAnimationType = child.dataset.animation;
                        const individualChildDelay = parseInt(child.dataset.animationDelay) || 0;
                        child.style.transitionDelay = `${baseDelay + childDelay + individualChildDelay}ms`;
                        child.classList.add('animated', childAnimationType || 'fade-in-up', 'is-visible');
                        childDelay += 100; // Default stagger increment
                    });
                } else {
                    el.style.transitionDelay = `${delay}ms`;
                    el.classList.add('animated', animationType || 'fade-in-up', 'is-visible');
                }
                observerInstance.unobserve(el); // Stop observing once animated
            }
        });
    }, animationOptions);

    // Observe all elements with data-animation or stagger-children class
    document.querySelectorAll('[data-animation], .stagger-children').forEach(el => {
        // If it's a stagger parent, we observe the parent.
        // If it's an individual element to be animated, observe it directly.
        // The logic inside the observer callback handles children of stagger parents.
        if (el.classList.contains('stagger-children')) {
            // For stagger parents, ensure their direct children with data-animation are prepped
            const childrenToPrep = el.querySelectorAll(':scope > [data-animation]');
             childrenToPrep.forEach(child => {
                const animationType = child.dataset.animation;
                child.classList.add('animate-prepare', animationType || 'fade-in-up');
            });
        } else {
             // For non-staggered elements or children that will be handled by parent
            if(!el.closest('.stagger-children')) { // Only prep if not a direct child of a stagger parent
                const animationType = el.dataset.animation;
                el.classList.add('animate-prepare', animationType || 'fade-in-up');
            }
        }
        observer.observe(el);
    });

});
