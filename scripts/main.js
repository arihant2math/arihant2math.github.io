function initMenuScrollMemory() {
    const menu = document.getElementById('menu');
    if (!menu || menu.dataset.scrollMemoryBound === 'true') return;

    menu.dataset.scrollMemoryBound = 'true';
    menu.scrollLeft = localStorage.getItem('menu-scroll-position') || 0;
    menu.addEventListener('scroll', () => {
        localStorage.setItem('menu-scroll-position', menu.scrollLeft);
    });
}

function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]:not([data-smooth-scroll-bound])').forEach(anchor => {
        anchor.dataset.smoothScrollBound = 'true';
        anchor.addEventListener('click', function (e) {
            const id = this.getAttribute('href').substr(1);
            const target = document.querySelector(`[id='${decodeURIComponent(id)}']`);
            if (!target) return;

            e.preventDefault();
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                target.scrollIntoView({ behavior: 'smooth' });
            } else {
                target.scrollIntoView();
            }
            if (id === 'top') {
                history.replaceState(null, null, ' ');
            } else {
                history.pushState(null, null, `#${id}`);
            }
        });
    });
}

let navScrollBound = false;
function initNavScrollChrome() {
    if (navScrollBound) return;
    navScrollBound = true;

    window.addEventListener('scroll', function () {
        const navDiv = document.getElementById('nav-div');
        if (!navDiv) return;

        const topClasses = ['bg-background-0-light', 'dark:bg-background-0-dark'];
        const scrollClasses = ['bg-background-0-light/10', 'dark:bg-slate-background-0-dark/10', 'border-b'];
        if (window.scrollY < 150) {
            topClasses.forEach(className => navDiv.classList.add(className));
            scrollClasses.forEach(className => navDiv.classList.remove(className));
        } else {
            topClasses.forEach(className => navDiv.classList.remove(className));
            scrollClasses.forEach(className => navDiv.classList.add(className));
        }
    }, { passive: true });
}

function initSiteEnhancements() {
    initMenuScrollMemory();
    initSmoothAnchors();
    initNavScrollChrome();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteEnhancements);
} else {
    initSiteEnhancements();
}

document.addEventListener('turbo:load', initSiteEnhancements);
