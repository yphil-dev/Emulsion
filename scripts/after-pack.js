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

  console.log('Adding AppStream metadata for AppImage...');

  const appOutDir = context.appOutDir;
  const metainfoDir = path.join(appOutDir, 'usr', 'share', 'metainfo');
  const sourceFile = path.join(context.outDir, '..', 'debian', 'emulsion.appdata.xml');
  const targetFile = path.join(metainfoDir, 'emulsion.appdata.xml');

  // Create metainfo directory if it doesn't exist
  if (!fs.existsSync(metainfoDir)) {
    fs.mkdirSync(metainfoDir, { recursive: true });
    console.log(`Created directory: ${metainfoDir}`);
  }

  // Copy the appdata.xml file
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`Copied AppStream metadata to: ${targetFile}`);
  } else {
    console.warn(`Source file not found: ${sourceFile}`);
  }
};
