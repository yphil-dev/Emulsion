const slideshow = document.getElementById("slideshow");
window.topMenu = document.getElementById("top-menu");
window.topMenuSlider = document.getElementById("top-menu-slider");
import { PLATFORMS } from './platforms.js';
import { applyTheme, setFooterSize } from './utils.js';
import { buildHomeSlide, initSlideShow } from './slideshow.js';
import { loadPreferences } from './preferences.js';

LB.control.initGamepad();

loadPreferences()
    .then((preferences) => {

        LB.galleryNumOfCols = preferences.settings.numberOfColumns;
        LB.steamGridAPIKey = preferences.settings.steamGridAPIKey;
        LB.giantBombAPIKey = preferences.settings.giantBombAPIKey;
        LB.footerSize = preferences.settings.footerSize;
        LB.homeMenuTheme = preferences.settings.homeMenuTheme;
        LB.theme = preferences.settings.theme;
        LB.disabledPlatformsPolicy = preferences.settings.disabledPlatformsPolicy;
        LB.recentlyPlayedPolicy = preferences.settings.recentlyPlayedPolicy;

        setFooterSize(LB.footerSize);
        applyTheme(LB.theme);

        return { preferences };

    })
    .then(async ({ preferences }) => {

        return LB.gallery.buildGalleries(preferences, LB.userDataPath)
            .then((platforms) => {
                return { platforms, preferences };
            });
    })
    .then(({ platforms, preferences }) => {

        LB.totalNumberOfPlatforms = platforms.length - 1;

        platforms.forEach((platform) => {
            const homeSlide = buildHomeSlide(platform, preferences);
            if (homeSlide) {
                slideshow.appendChild(homeSlide);
            }
        });

        const galleriesContainer = document.getElementById('galleries');

        const autoSelectIndex = PLATFORMS.findIndex(p => p.name === LB.autoSelect);

        initSlideShow(autoSelectIndex || 0);

        galleriesContainer.style.display = 'none';
        document.getElementById("main").style.display = 'flex';
        document.getElementById("splash").style.display = 'none';
        document.getElementById("footer").style.display = 'flex';

        if (LB.autoSelect && !LB.enabledPlatforms.some(platform => platform === LB.autoSelect)) {
            if (!LB.kioskMode) {
                LB.control.initGallery('settings', LB.autoSelect);
            }
            return;
        } else if (LB.autoSelect) {
            simulateKeyDown('Enter');
        }

    })
    .catch(error => {
        console.error('Failed to load platforms:', error);
    });
