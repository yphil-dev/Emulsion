import { sessionBus, Variant } from "dbus-next";

function uriToPath(uri) {
    return uri.replace("file://", "");
}

export async function pickFolderPersist() {
    console.log("📂 PORTAL PICKER: Starting folder picker");

    // Only use portals in Flatpak
    const isFlatpak = process.env.FLATPAK_ID !== undefined;
    console.log("📂 PORTAL PICKER: Running in Flatpak?", isFlatpak);

    if (!isFlatpak) {
        console.log("📂 PORTAL PICKER: Not in Flatpak, skipping portals");
        throw new Error("NOT_FLATPAK");
    }

    try {
        const bus = sessionBus();
        console.log("📂 PORTAL PICKER: Got session bus");

        const fcObj = await bus.getProxyObject("org.freedesktop.portal.Desktop", "/org/freedesktop/portal/desktop");
        const fileChooser = fcObj.getInterface("org.freedesktop.portal.FileChooser");

        const options = {
            directory: new Variant("b", true),
            multiple: new Variant("b", false),
            modal: new Variant("b", true),
            title: new Variant("s", "Choose a folder"),
        };

        const appId = process.env.FLATPAK_ID || "io.gitlab.yphil.emulsion";
        console.log("📂 PORTAL PICKER: Using app ID:", appId);

        console.log("📂 PORTAL PICKER: Calling OpenFile...");
        const requestPath = await fileChooser.OpenFile(appId, "", options);
        console.log("📂 PORTAL PICKER: Request path:", requestPath);

        const reqObj = await bus.getProxyObject("org.freedesktop.portal.Desktop", requestPath);
        const reqIface = reqObj.getInterface("org.freedesktop.portal.Request");

        console.log("📂 PORTAL PICKER: Waiting for response...");

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.log("📂 PORTAL PICKER: Timeout");
                reqIface.removeListener("Response", handler);
                reject(new Error("PORTAL_TIMEOUT"));
            }, 30000);

            const handler = (code, results) => {
                console.log("📂 PORTAL PICKER: Response received - Code:", code);
                clearTimeout(timeout);
                reqIface.removeListener("Response", handler);

                if (code === 0 && results && results.uris && results.uris.length > 0) {
                    const path = uriToPath(results.uris[0].value);
                    console.log("📂 PORTAL PICKER: Returning path:", path);
                    resolve({ path });
                } else {
                    console.log("📂 PORTAL PICKER: User cancelled");
                    reject(new Error("User cancelled"));
                }
            };

            reqIface.on("Response", handler);
        });

    } catch (e) {
        console.error("📂 PORTAL PICKER: Error:", e.message);
        if (e.message === "NOT_FLATPAK") {
            throw e;
        }
        throw new Error("PORTAL_NOT_AVAILABLE");
    }
}
