import { applyTheme, setFooterSize, initFooterControls } from './utils.js';
import { buildHomeSlide, initSlideShow, initGallery, initGamepad } from './slideshow.js';
import { loadPreferences } from './preferences.js';
import { buildGalleries } from './gallery.js';
import { helpDialog } from './dialog.js';

const slideshow = document.getElementById("slideshow");

initGamepad();
initFooterControls();

fetch('../html/svg-symbols.html').then(res => res.text()).then(html => document.body.insertAdjacentHTML('afterbegin', html)).catch(console.error);

loadPreferences()
    .then((preferences) => {

        // Batch assign all LB properties at once to avoid multiple property assignments
        Object.assign(LB, {
            galleryNumOfCols: preferences.settings.numberOfColumns,
            steamGridAPIKey: preferences.settings.steamGridAPIKey,
            giantBombAPIKey: preferences.settings.giantBombAPIKey,
            footerSize: preferences.settings.footerSize,
            theme: preferences.settings.theme,
            disabledPlatformsPolicy: preferences.settings.disabledPlatformsPolicy,
            recentlyPlayedPolicy: preferences.settings.recentlyPlayedPolicy,
            recentlyPlayedViewMode: preferences.settings.recentlyPlayedViewMode,
            favoritesPolicy: preferences.settings.favoritesPolicy,
            favoritesViewMode: preferences.settings.favoritesViewMode,
            favoritePendingAction: null,
            startupDialogPolicy: preferences.settings.startupDialogPolicy,
            launchDialogPolicy: preferences.settings.launchDialogPolicy
        });

        LB.batchRunning = false;

        setFooterSize(LB.footerSize);
        applyTheme(LB.theme);

        return { preferences };

    })
    .then(async ({ preferences }) => {

        return buildGalleries(preferences, LB.userDataPath)
            .then((platforms) => {
                return { platforms, preferences };
            });
    })
    .then(async ({ platforms, preferences }) => {

        LB.totalNumberOfPlatforms = platforms.length - 1;

        // Build home slides in parallel for better performance
        const homeSlidePromises = platforms.map((platform) => {
            return new Promise((resolve) => {
                const homeSlide = buildHomeSlide(platform, preferences);
                if (homeSlide) {
                    slideshow.appendChild(homeSlide);
                }
                resolve();
            });
        });

        await Promise.all(homeSlidePromises);

        // Batch DOM operations for final UI setup
        const galleriesContainer = document.getElementById('galleries');
        const main = document.getElementById("main");
        const splash = document.getElementById("splash");
        const footer = document.getElementById("footer");

        // Single style update for all elements
        galleriesContainer.style.display = 'none';
        main.style.display = 'flex';
        splash.style.display = 'none';
        footer.style.display = 'flex';

        if (LB.autoSelect && LB.enabledPlatforms.some(platform => platform === LB.autoSelect)) {
            initGallery(LB.autoSelect);
        } else {
            initSlideShow(0);
        }

        if (LB.startupDialogPolicy === 'show') {
            helpDialog('quickstart');
        }

    })
    .catch(error => {
        console.error('Failed to load platforms:', error);
    });
