import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (context) => {
    // Only run for Linux AppImage builds
    if (context.electronPlatformName !== 'linux' || !context.targets.some(target => target.name === 'appImage')) {
        return;
    }

    console.log('  • Generating AppStream metadata for AppImage...');

    const appOutDir = context.appOutDir;
    const metainfoDir = path.join(appOutDir, 'usr', 'share', 'metainfo');
    const targetFile = path.join(metainfoDir, 'emulsion.appdata.xml');

    // Read package.json for version
    const packageJsonPath = path.join(context.outDir, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version;

    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];

    // Generate XML content
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>io.gitlab.yphil.emulsion</id>
  <metadata_license>CC0-1.0</metadata_license>
  <project_license>GPL-3.0+</project_license>
  <name>Emulsion</name>
  <developer_name>yPhil</developer_name>
  <summary>Better gaming throught chemistry</summary>
  <releases>
    <release version="${version}" date="${currentDate}"/>
  </releases>
  <description>
    <p>Display your games collection into responsive galleries, manage game metadata, cover art and emulator configuration. Launch your games in style.</p>
  <h2>Features</h2>
  <ul>
    <li><strong>Flexible Storage</strong> - Your games / ROMs can be anywhere, across multiple drives / NAS, etc.</li>
    <li><strong>Universal Input</strong> - Keyboard, mouse, or any game controller</li>
    <li><strong>Responsive UX</strong> - Adapts perfectly to any screen size / orientation</li>
    <li><strong>Smart emulator management</strong> - Emulsion uses your installed emulator, or installs it; standard and up to date.</li>
    <li><strong>Flexible Metadata Management</strong> - Manual curation, and / or batch automation. Downloads from multiple sources, Wikipedia API default; all manageable from the platform page.</li>
  </ul>
  </description>
  <launchable type="desktop-id">io.gitlab.yphil.emulsion.desktop</launchable>
  <url type="homepage">https://yphil.gitlab.io/emulsion/</url>
  <url type="help">https://gitlab.com/yphil/emulsion</url>
  <url type="bugtracker">https://gitlab.com/yphil/emulsion/-/issues</url>
  <categories>
    <category>Games</category>
    <category>Productivity</category>
  </categories>
  <screenshots>
    <screenshot type="default">
      <image>https://yphil.gitlab.io/images/emulsion-screenshot_01-839px.png</image>
    </screenshot>
  </screenshots>
</component>`;

    // Create metainfo directory if it doesn't exist
    if (!fs.existsSync(metainfoDir)) {
        fs.mkdirSync(metainfoDir, { recursive: true });
        console.log(`  • Created directory: ${metainfoDir}`);
    }

    // Write the XML file
    fs.writeFileSync(targetFile, xmlContent, 'utf8');
    console.log(`  • AppStream metadata OK: ${targetFile} (version: ${version}, date: ${currentDate})`);

    console.log('  • Generating desktop file for AppImage...');

    const applicationsDir = path.join(appOutDir, 'usr', 'share', 'applications');
    const desktopFile = path.join(applicationsDir, 'io.gitlab.yphil.emulsion.desktop');

    // Generate desktop file content
    const desktopContent = `[Desktop Entry]
Name=Emulsion (AppImage)
Comment=Display your games collection into responsive galleries, manage game metadata, cover art and emulator configuration. Launch your games in style.
Exec=emulsion
Icon=emulsion
StartupNotify=true
Terminal=false
Type=Application
Categories=Games;Productivity;
`;

    // Create applications directory if it doesn't exist
    if (!fs.existsSync(applicationsDir)) {
        fs.mkdirSync(applicationsDir, { recursive: true });
        console.log(`  • Created directory: ${applicationsDir}`);
    }

    // Write the desktop file
    fs.writeFileSync(desktopFile, desktopContent, 'utf8');
    console.log(`  • Desktop file OK: ${desktopFile}`);
};
