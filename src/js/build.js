function buildHomeSlide(platformName, preferences) {

    const slide = document.createElement("div");
    slide.className = "slide";
    slide.id = platformName;
    const platformImgPath = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);
    const bgImageUrl = `url("file://${platformImgPath.replace(/\\/g, '/')}")`;

    slide.style.backgroundImage = bgImageUrl;

    const slideContent = document.createElement("div");
    slideContent.className = "slide-content";
    const platformInfo = LB.utils.getPlatformInfo(platformName);
    slideContent.innerHTML = `<p class="vendor">${platformInfo.vendor}</p> <p class="name">${platformInfo.name}</p>`;

    slide.setAttribute('data-platform', platformName);

    slide.appendChild(slideContent);

    if (platformName === 'recents') {
        slide.setAttribute('data-index', LB.totalNumberOfPlatforms);
        return slide;
    }

    if (platformName !== 'settings' &&
        ((LB.kioskMode || LB.disabledPlatformsPolicy === 'hide') && !preferences[platformName]?.isEnabled)) {
        return null;
    }

    slide.setAttribute('data-index', preferences[platformName].index);
    slide.setAttribute('data-is-enabled', preferences[platformName].isEnabled);

    return slide;
}

function createManualSelectButton(gameName, platformName, imgElem) {
    const btn = document.createElement('button');
    btn.classList.add('button');
    btn.title = 'Select image';
    btn.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i>';

    btn.addEventListener('click', async e => {
        e.stopPropagation();

        // Ask the main process to show a file picker
        const srcPath = await ipcRenderer.invoke('pick-image');
        if (!srcPath) return;  // user cancelled

        // Destination in user data covers folder
        const destPath = path.join(
            LB.userDataPath,
            'covers',
            platformName,
            `${gameName}.jpg`
        );

        // Update the img element to the new file (with cache‐bust)
        imgElem.src = `file://${destPath}?${Date.now()}`;

        // Tell main to copy the file
        const ok = await ipcRenderer.invoke('save-cover', srcPath, destPath);
        console.log(ok
                    ? `Cover saved to ${destPath}`
                    : 'Failed to save cover');
    });

    return btn;
}

LB.build = {
    homeSlide: buildHomeSlide,
};
