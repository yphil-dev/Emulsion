import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get package info
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const packageName = packageJson.name;
const version = packageJson.version;

async function processAppImage() {
    const appImageName = 'emulsion_x86_64.AppImage';

    console.log('Processing AppImage package...');

    const distDir = path.join(__dirname, '..', 'dist');
    const appImagePath = path.join(distDir, appImageName);

    if (!fs.existsSync(appImagePath)) {
        console.log(`AppImage not found: ${appImagePath}, skipping processing`);
        return;
    }

    console.log(`Found AppImage: ${appImageName}`);

    // Change to dist directory
    const originalCwd = process.cwd();
    process.chdir(distDir);

    try {
        // Extract AppImage
        console.log('Extracting AppImage...');
        execSync(`"./${appImageName}" --appimage-extract`, { stdio: 'inherit' });

        // List files to debug desktop file location
        console.log('Files in squashfs-root:');
        const listFiles = (dir, prefix = '') => {
            try {
                const items = fs.readdirSync(dir);
                items.forEach(item => {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    const relativePath = prefix + item;
                    if (stat.isDirectory()) {
                        console.log(`  📁 ${relativePath}/`);
                        // Only go one level deep for debugging
                    } else {
                        console.log(`  📄 ${relativePath}`);
                    }
                });
            } catch (e) {
                console.log(`  Error reading ${dir}: ${e.message}`);
            }
        };
        listFiles('./squashfs-root');

        // Modify atexit function in AppRun
        console.log('Modifying AppRun script...');
        // modifyAppRunAtexit('./squashfs-root/AppRun');

        // Remove locale files
        console.log('Removing locale files...');
        const localesDir = './squashfs-root/usr/share/locale';
        if (fs.existsSync(localesDir)) {
            const localeDirs = fs.readdirSync(localesDir);
            localeDirs.forEach(locale => {
                const localePath = path.join(localesDir, locale);
                if (fs.statSync(localePath).isDirectory()) {
                    fs.rmSync(localePath, { recursive: true, force: true });
                    console.log(`Removed locale: ${locale}`);
                }
            });
        }

        // Repackage AppImage with proper naming
        console.log('Repackaging AppImage...');
        let appimagetoolPath = path.join(__dirname, '..', 'bin', 'appimagetool-x86_64.AppImage');

        // Check bin directory first (for local builds), then root directory (for CI)
        if (!fs.existsSync(appimagetoolPath)) {
            appimagetoolPath = path.join(__dirname, '..', 'appimagetool-x86_64.AppImage');
        }

        if (fs.existsSync(appimagetoolPath)) {
            const toolLocation = appimagetoolPath.includes('bin') ? 'bin directory' : 'root directory';
            console.log(`Using appimagetool from ${toolLocation}`);
            // Create the new filename with proper casing and version
            const newAppImageName = `Emulsion-${version}-x86_64.AppImage`;
            execSync(`"${appimagetoolPath}" squashfs-root "${newAppImageName}"`, { stdio: 'inherit' });
            console.log(`AppImage repackaged as: ${newAppImageName}`);

            // Remove the appimagetool binary after successful repackaging
            try {
                fs.unlinkSync(appimagetoolPath);
                console.log('Removed appimagetool-x86_64.AppImage');
            } catch (error) {
                console.warn('Failed to remove appimagetool-x86_64.AppImage:', error.message);
            }
        } else {
            console.log('appimagetool not found in bin directory or root directory, skipping repackaging');
        }

        console.log('AppImage processing complete');

    } catch (error) {
        console.error('Error processing AppImage:', error.message);
        throw error;
    } finally {
        // Restore original working directory
        process.chdir(originalCwd);
    }
}

function modifyAppRunAtexit(appRunPath) {
    if (!fs.existsSync(appRunPath)) {
        console.log(`AppRun script not found: ${appRunPath}`);
        return;
    }

    let content = fs.readFileSync(appRunPath, 'utf8');

    // Replace the specific exec lines within the atexit function
    // Look for: exec "$BIN" followed by optional args
    content = content.replace(
        /exec "\$BIN"(?:\s+"\$\{args\[@\]\}")?/g,
        (match) => {
            if (match.includes('${args[@]}')) {
                return 'exec "$BIN" "${args[@]}" "--no-sandbox"';
            } else {
                return 'exec "$BIN" "--no-sandbox"';
            }
        }
    );

    fs.writeFileSync(appRunPath, content, 'utf8');
    console.log('Successfully modified exec commands to add --no-sandbox');

    // Verify the changes
    const lines = content.split('\n');
    const atexitIndex = lines.findIndex(line => line.includes('atexit()'));
    if (atexitIndex !== -1) {
        const start = Math.max(0, atexitIndex - 1);
        const end = Math.min(lines.length, atexitIndex + 10);
        console.log('Modified atexit function:');
        console.log(lines.slice(start, end).join('\n'));
    }
}

// Run the processing
processAppImage().catch(error => {
    console.error('AppImage processing failed:', error);
    process.exit(1);
});
