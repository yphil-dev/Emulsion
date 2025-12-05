import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (context) => {
    // Only run for Linux AppImage builds
    if (context.electronPlatformName !== 'linux' || !context.targets.some(target => target.name === 'appImage')) {
        return;
    }

    console.log('  • Generating AppStream metadata for AppImage...');

    const appOutDir = context.appOutDir;

    // console.log('  • Contents of appOutDir:');
    const listFilesRecursively = (dir, prefix = '') => {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            const relativePath = prefix + item;
            if (stat.isDirectory()) {
                console.log(`  • 📁 ${relativePath}/`);
                listFilesRecursively(fullPath, relativePath + '/');
            } else {
                console.log(`  • 📄 ${relativePath} (${stat.size} bytes)`);
            }
        });
    };

    // listFilesRecursively(appOutDir);

    const metainfoDir = path.join(appOutDir, 'usr', 'share', 'metainfo');
    const targetFile = path.join(metainfoDir, 'io.gitlab.yphil.emulsion.appdata.xml');

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
  <developer id="com.github.yphil">
    <name>yPhil</name>
  </developer>
  <summary>Better gaming through chemistry</summary>
  <description>
    <p>Display your games collection into responsive galleries, manage game metadata, cover art and emulator configuration. Launch your games in style.</p>
    <p>Features:</p>
    <ul>
      <li>Flexible Storage - Your games / ROMs can be anywhere, across multiple drives / NAS, etc.</li>
      <li>Universal Input - Keyboard, mouse, or any game controller</li>
      <li>Responsive UX - Adapts perfectly to any screen size / orientation</li>
      <li>Smart emulator management - Emulsion uses your installed emulator, or installs it; standard and up to date.</li>
      <li>Flexible Metadata Management - Manual curation, and / or batch automation. Downloads from multiple sources, Wikipedia API default; all manageable from the platform page.</li>
    </ul>
  </description>
  <launchable type="desktop-id">emulsion.desktop</launchable>
  <url type="homepage">https://yphil.gitlab.io/emulsion/</url>
  <url type="help">https://gitlab.com/yphil/emulsion</url>
  <url type="bugtracker">https://gitlab.com/yphil/emulsion/-/issues</url>
  <categories>
    <category>Utility</category>
  </categories>
  <content_rating type="oars-1.1"/>
  <releases>
    <release version="${version}" date="${currentDate}"/>
  </releases>
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
};
