const slideshow = document.getElementById("slideshow");
window.topMenu = document.getElementById("top-menu");
window.topMenuSlider = document.getElementById("top-menu-slider");

LB.control.initGamepad();

// Wait for LB initialization before proceeding
LB.initialized
    .then(() => LB.prefs.load())
    .then((preferences) => {

        LB.galleryNumOfCols = preferences.settings.numberOfColumns;
        LB.steamGridAPIKey = preferences.settings.steamGridAPIKey;
        LB.giantBombAPIKey = preferences.settings.giantBombAPIKey;
        LB.footerSize = preferences.settings.footerSize;
        LB.homeMenuTheme = preferences.settings.homeMenuTheme;
        LB.theme = preferences.settings.theme;
        LB.disabledPlatformsPolicy = preferences.settings.disabledPlatformsPolicy;
        LB.recentlyPlayedPolicy = preferences.settings.recentlyPlayedPolicy;

        LB.utils.setFooterSize(LB.footerSize);
        LB.utils.applyTheme(LB.theme);

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
            const homeSlide = LB.build.homeSlide(platform, preferences);
            if (homeSlide) {
                slideshow.appendChild(homeSlide);
            }
        });

        const galleriesContainer = document.getElementById('galleries');

        const autoSelectIndex = LB.utils.getDataIndexByPlatform(LB.autoSelect);

        LB.control.initSlideShow(autoSelectIndex || 0);

        galleriesContainer.style.display = 'none';
        document.getElementById("main").style.display = 'flex';
        document.getElementById("splash").style.display = 'none';
        document.getElementById("footer").style.display = 'flex';

        if (LB.autoSelect && !LB.enabledPlatforms.some(platform => platform === LB.autoSelect)) {
            if (!LB.kioskMode) {
                LB.control.initGallery(0, LB.autoSelect);
            }
            return;
        } else if (LB.autoSelect) {
            LB.utils.simulateKeyDown('Enter');
        }

    })
    .catch(error => {
        console.error('Failed to load platforms:', error);
    });
