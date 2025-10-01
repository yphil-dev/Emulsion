// Theme management

const path = require('path');

export function applyTheme(theme, baseDir) {
    const body = document.querySelector('body');
    const menu = document.getElementById('menu');

    const baseDirClean = baseDir.endsWith('/')
          ? baseDir.slice(0, -1)
          : baseDir;

    const bgPath = path.join(baseDir, 'img', 'themes', theme, 'background.png');
    const bgImageUrl = `url("file://${bgPath.replace(/\\/g, '/')}")`;

    body.style.backgroundImage = bgImageUrl;
    menu.style.backgroundImage = bgImageUrl;

    menu.style.transition = 'filter 1s';
    menu.style.filter = 'opacity(0.5)';

    body.classList.remove('theme-day', 'theme-night', 'theme-default');
    body.classList.add(`theme-${theme}`);

    menu.style.transition = 'filter 1s, color 1s';
    menu.style.filter = 'opacity(0.5)';

    setTimeout(() => {
        menu.style.backgroundImage = bgImageUrl;
        menu.style.filter = 'opacity(1)';
    }, 100);
}

export function setFooterSize(size) {
    const footer = document.getElementById('footer');
    footer.className = `footer-${size}`;
}
