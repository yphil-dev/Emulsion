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
  <id>emulsion.desktop</id>
  <name>Emulsion</name>
  <summary>Game collection manager</summary>
  <description>
    <p>Display your games collection into responsive galleries, manage game metadata, cover art and emulator configuration. Launch your games in style.</p>
  </description>
  <categories>
    <category>Utility</category>
    <category>Game</category>
  </categories>
  <developer_name>yPhil</developer_name>
  <license>GPL-3.0+</license>
  <homepage>https://yphil.gitlab.io/emulsion</homepage>
  <screenshots>
    <screenshot type="default">
      <image>https://yphil.gitlab.io/images/emulsion-screenshot_01.png</image>
    </screenshot>
    <screenshot>
      <image>https://yphil.gitlab.io/images/emulsion-screenshot_02.png</image>
    </screenshot>
  </screenshots>
  <releases>
    <release version="${version}" date="${currentDate}"/>
  </releases>
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
