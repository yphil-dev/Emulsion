const ACTIVATION_ZOOM_DURATION_MS = 220;

export function playActivationZoom(source) {
    if (!source?.isConnected) return Promise.resolve();

    const rect = source.getBoundingClientRect();
    const clone = source.cloneNode(true);
    clone.classList.remove('selected', 'launching', 'confirming', 'zooming');
    clone.classList.add('activation-zoom-clone');

    Object.assign(clone.style, {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
    });

    document.body.appendChild(clone);

    return new Promise(resolve => {
        let completed = false;
        const cleanup = () => {
            if (completed) return;
            completed = true;
            clone.remove();
            resolve();
        };

        clone.addEventListener('animationend', cleanup, { once: true });
        setTimeout(cleanup, ACTIVATION_ZOOM_DURATION_MS + 100);
    });
}
