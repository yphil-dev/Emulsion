const slideshow = document.getElementById("slideshow");
window.topMenu = document.getElementById("top-menu");
window.topMenuSlider = document.getElementById("top-menu-slider");

LB.control.initGamepad();

LB.prefs.load()
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
        galleriesContainer.style.display = 'none';

        // const autoSelectIndex = LB.utils.getPlatformInfo(LB.autoSelect).index;

        const autoSelectIndex = LB.utils.getDataIndexByPlatform(LB.autoSelect);

        // const autoOpenIndex = LB.utils.getPlatformInfo(LB.autoOpen);

        console.log("autoSelectIndex: ", autoSelectIndex);

        document.getElementById("main").style.display = 'flex';

        LB.control.initSlideShow(autoSelectIndex || 0);

        document.getElementById("splash").style.display = 'none';
        document.getElementById("footer").style.display = 'flex';

        if (LB.autoSelect) {
            LB.utils.simulateKeyDown('Enter');
        }

    })
    .catch(error => {
        console.error('Failed to load platforms:', error);
    });

window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (event.target.nodeName === 'INPUT' || event.target.nodeName === 'TEXTAREA') {
        ipcRenderer.send('show-context-menu', { x: event.x, y: event.y });
    }
});

