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
document.querySelectorAll('.nav-link').forEach(link => {
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

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('href') === `#${current}`) {
            li.classList.add('active');
        }
    });
});

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
