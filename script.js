// --- Ring Particles (CSS Houdini PaintWorklet) ---
// Follows the mouse cursor inside the hero section (#main).
// Falls back gracefully in browsers without Houdini support.
if ('paintWorklet' in CSS) {
    CSS.paintWorklet.addModule(
        'https://unpkg.com/css-houdini-ringparticles/dist/ringparticles.js'
    );

    const heroSections = document.querySelectorAll('.hero');

    heroSections.forEach($hero => {
        let isInteractive = false;
        
        $hero.addEventListener('pointermove', (e) => {
            if (!isInteractive) {
                $hero.classList.add('interactive');
                isInteractive = true;
            }
            
            // Calculate cursor position as a value between -0.5 and +0.5 from center relative to viewport
            const moveFactor = 20; // Lower number = stays closer to center (less pull), Higher number = follows more closely
            const xPercent = 50 + ((e.clientX / window.innerWidth) - 0.5) * moveFactor;
            const yPercent = 50 + ((e.clientY / window.innerHeight) - 0.5) * moveFactor;

            $hero.style.setProperty('--ring-x', xPercent);
            $hero.style.setProperty('--ring-y', yPercent);
            $hero.style.setProperty('--ring-interactive', 1);
        });

        $hero.addEventListener('pointerleave', () => {
            $hero.classList.remove('interactive');
            isInteractive = false;
            $hero.style.setProperty('--ring-x', 50);
            $hero.style.setProperty('--ring-y', 50);
            $hero.style.setProperty('--ring-interactive', 0);
        });
    });
}

// --- Console easter egg ---
console.log('%c SZ. ', 'background: oklch(76% 0.14 68); color: #0a0a0a; font-size: 18px; font-weight: 700; padding: 4px 8px; border-radius: 2px;');
console.log('%cSenior Data Architect & Database Engineer', 'color: #f5f5f5; font-size: 13px;');
console.log('%c10+ years building data systems that don\'t slow down when the business scales.', 'color: #999; font-size: 12px;');
console.log('%c→ firmack3@gmail.com', 'color: oklch(76% 0.14 68); font-size: 12px;');

// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// --- Navbar compact on scroll ---
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// --- Mobile Navigation ---
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Smooth scrolling and close mobile nav on click
document.querySelectorAll('.nav-link, .btn[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Close mobile nav
        navLinks.classList.remove('active');
        
        const targetId = this.getAttribute('href');
        if (!targetId || targetId === '#') return;
        
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            const headerOffset = 80;
            const elementPosition = targetSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    });
});

// --- Smooth Scrolling & Active Nav Links ---
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';

    // If scrolled to the bottom of the page, always activate the last section
    const nearBottom = window.pageYOffset + window.innerHeight >= document.documentElement.scrollHeight - 50;
    if (nearBottom && sections.length) {
        current = sections[sections.length - 1].getAttribute('id');
    } else {
        sections.forEach(section => {
            if (window.pageYOffset >= section.offsetTop - 200) {
                current = section.getAttribute('id');
            }
        });
    }

    navItems.forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('href') === `#${current}`) {
            li.classList.add('active');
        }
    });
}, { passive: true });

// --- Skill to Project Highlighting Logic ---
const skillBadges = document.querySelectorAll('.skill-badge');
const projectNavItems = document.querySelectorAll('.project-nav-item');
const projectDetailCards = document.querySelectorAll('.project-detail-card');

// --- Project Tab Switching Logic ---
projectNavItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        // Remove active from all
        projectNavItems.forEach(nav => nav.classList.remove('active'));
        projectDetailCards.forEach(card => card.classList.remove('active'));

        // Add active to clicked nav and corresponding detail card
        item.classList.add('active');
        if (projectDetailCards[index]) {
            projectDetailCards[index].classList.add('active');
        }
    });
});

// --- Skill badge click pulse ---
skillBadges.forEach(badge => {
    badge.addEventListener('click', () => {
        badge.classList.remove('pulse');
        void badge.offsetWidth; // force reflow to restart animation
        badge.classList.add('pulse');
        badge.addEventListener('animationend', () => badge.classList.remove('pulse'), { once: true });
    });
});

let activeSkills = [];

skillBadges.forEach(badge => {
    badge.addEventListener('click', () => {
        const selectedSkill = badge.getAttribute('data-skill');

        // Toggle skill in array
        if (activeSkills.includes(selectedSkill)) {
            activeSkills = activeSkills.filter(s => s !== selectedSkill);
            badge.classList.remove('active');
        } else {
            activeSkills.push(selectedSkill);
            badge.classList.add('active');
        }

        // If no skills active, reset all
        if (activeSkills.length === 0) {
            projectNavItems.forEach(navItem => {
                navItem.classList.remove('highlight');
                navItem.classList.remove('dimmed');
            });
            projectDetailCards.forEach(card => {
                card.querySelectorAll('.project-skill-badge').forEach(b => {
                    b.classList.remove('active-skill');
                });
            });
            return;
        }

        // Process nav items and detail cards
        let firstMatchIndex = -1;

        projectNavItems.forEach((navItem, index) => {
            const cardSkillsStr = navItem.getAttribute('data-skills');
            const cardSkills = cardSkillsStr ? cardSkillsStr.split(',').map(s => s.trim()) : [];

            // Multi-select OR logic
            const matchesAny = activeSkills.some(skill => cardSkills.includes(skill));

            if (matchesAny) {
                navItem.classList.add('highlight');
                navItem.classList.remove('dimmed');
                if (firstMatchIndex === -1) {
                    firstMatchIndex = index;
                }
            } else {
                navItem.classList.remove('highlight');
                navItem.classList.add('dimmed');
            }

            // Highlight specific skill badges inside the matching detail card
            if (projectDetailCards[index]) {
                const innerBadges = projectDetailCards[index].querySelectorAll('.project-skill-badge');
                innerBadges.forEach(innerBadge => {
                    const innerSkill = innerBadge.getAttribute('data-skill');
                    if (activeSkills.includes(innerSkill)) {
                        innerBadge.classList.add('active-skill');
                    } else {
                        innerBadge.classList.remove('active-skill');
                    }
                });
            }
        });

        // If current active item is dimmed out, auto-switch to the first matching item
        const activeNav = document.querySelector('.project-nav-item.active');
        if (activeNav && activeNav.classList.contains('dimmed') && firstMatchIndex !== -1) {
            projectNavItems[firstMatchIndex].click();
        }
    });
});

// --- Scroll progress bar ---
const scrollProgress = document.getElementById('scroll-progress');
if (scrollProgress) {
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        scrollProgress.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
    }, { passive: true });
}

// --- Scroll Reveal Animations (Intersection Observer) ---
const revealElements = document.querySelectorAll('.scroll-reveal');

const revealOptions = {
    threshold: 0.10 // Trigger when 10% of the element is visible
};

const revealOnScroll = new IntersectionObserver(function (entries, observer) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        } else {
            entry.target.classList.add('scrolled');
            // Optional: Stop observing once revealed if you only want it to animate once
            observer.unobserve(entry.target);
        }
    });
}, revealOptions);

document.addEventListener('DOMContentLoaded', () => {
    // Reveal Observer
    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

    // Build a name lookup map from all skill badges in the Skills section
    const skillNameMap = {};
    document.querySelectorAll('.skill-badge').forEach(badge => {
        const key = badge.getAttribute('data-skill');
        if (key) skillNameMap[key] = badge.textContent.trim();
    });

    // Collect every skill key referenced by at least one project
    const usedSkills = new Set();
    projectNavItems.forEach(item => {
        const str = item.getAttribute('data-skills');
        if (str) str.split(',').forEach(k => usedSkills.add(k.trim()));
    });

    // Hide badges not linked to any project (kept in DOM for future use)
    document.querySelectorAll('.skill-badge').forEach(badge => {
        const key = badge.getAttribute('data-skill');
        if (key && !usedSkills.has(key)) {
            badge.style.display = 'none';
        }
    });

    // --- Mobile: collapsible skill groups ---
    function initMobileSkills() {
        document.querySelectorAll('.skills-group').forEach(group => {
            const title = group.querySelector('.skills-group-title');
            const toggle = document.createElement('span');
            toggle.className = 'skills-group-toggle';
            toggle.setAttribute('aria-hidden', 'true');
            toggle.textContent = '+';
            title.appendChild(toggle);
            title.addEventListener('click', () => {
                const expanded = group.classList.toggle('expanded');
                toggle.textContent = expanded ? '\u2212' : '+';
            });
        });
    }

    // --- Mobile: accordion for projects ---
    function initMobileAccordion() {
        const sidebar = document.querySelector('.projects-sidebar');
        const contentPane = document.querySelector('.projects-content');
        const navItems = Array.from(document.querySelectorAll('.project-nav-item'));
        const cards = Array.from(document.querySelectorAll('.project-detail-card'));
        const accordion = document.createElement('div');
        accordion.className = 'projects-accordion';

        navItems.forEach((navItem, i) => {
            const card = cards[i];
            const entry = document.createElement('div');
            entry.className = 'accordion-entry';

            const toggle = document.createElement('span');
            toggle.className = 'accordion-toggle';
            toggle.setAttribute('aria-hidden', 'true');
            toggle.textContent = '+';
            navItem.appendChild(toggle);

            const body = document.createElement('div');
            body.className = 'accordion-body';
            if (card) body.appendChild(card);

            entry.appendChild(navItem);
            entry.appendChild(body);
            accordion.appendChild(entry);

            navItem.addEventListener('click', () => {
                const isOpen = entry.classList.contains('open');
                accordion.querySelectorAll('.accordion-entry').forEach(e => e.classList.remove('open'));
                accordion.querySelectorAll('.accordion-toggle').forEach(t => t.textContent = '+');
                if (!isOpen) {
                    entry.classList.add('open');
                    toggle.textContent = '\u2212';
                }
            });
        });

        sidebar.style.display = 'none';
        contentPane.style.display = 'none';
        sidebar.parentElement.appendChild(accordion);

        // Open first entry by default
        const firstEntry = accordion.querySelector('.accordion-entry');
        if (firstEntry) {
            firstEntry.classList.add('open');
            const firstToggle = firstEntry.querySelector('.accordion-toggle');
            if (firstToggle) firstToggle.textContent = '\u2212';
        }
    }

    if (window.innerWidth <= 768) {
        initMobileSkills();
        initMobileAccordion();
    }

    // --- Skills filter hint (first visit only) ---
    if (!sessionStorage.getItem('skillsHinted')) {
        sessionStorage.setItem('skillsHinted', '1');
        setTimeout(() => {
            const firstBadge = document.querySelector('#skills-container .skill-badge');
            if (firstBadge) {
                firstBadge.classList.add('hint-pulse');
                firstBadge.addEventListener('animationend', () => firstBadge.classList.remove('hint-pulse'), { once: true });
            }
        }, 2000);
    }

    // Populate skill tags in each detail card using data-skills from the
    // MATCHING NAV ITEM (same index). You only need to set data-skills
    // on the sidebar nav item — detail cards don't need the attribute.
    const navItemsList = Array.from(projectNavItems);
    const detailCardsList = Array.from(projectDetailCards);

    detailCardsList.forEach((card, index) => {
        // Prefer nav-item as the source of truth; fall back to the card itself
        const sourceEl = navItemsList[index] || card;
        const skillsStr = sourceEl.getAttribute('data-skills');
        if (!skillsStr) return;

        const skillsContainer = card.querySelector('.project-skills');
        if (!skillsContainer) return;

        skillsStr.split(',').forEach(skillKey => {
            const skillName = skillNameMap[skillKey.trim()];
            if (skillName) {
                const span = document.createElement('span');
                span.className = 'project-skill-badge';
                span.setAttribute('data-skill', skillKey.trim());
                span.textContent = skillName;
                skillsContainer.appendChild(span);
            }
        });
    });
});
