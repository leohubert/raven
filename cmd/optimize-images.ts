#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ASSETS_THEME_DIR = path.join(__dirname, '..', 'assets', 'themes');
const TARGET_SIZE = '128x128';
const TARGET_FORMAT = 'webp';

// Supported image formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg'];

function findImages(dir: string): string[] {
    const images: string[] = [];

    function searchRecursively(currentDir: string): void {
        try {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);

                if (entry.isDirectory()) {
                    searchRecursively(fullPath);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (SUPPORTED_FORMATS.includes(ext)) {
                        images.push(fullPath);
                    }
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not read directory ${currentDir}: ${(error as Error).message}`);
        }
    }

    searchRecursively(dir);
    return images;
}

function checkImageMagickInstalled(): boolean {
    try {
        // Try magick first (v7), then convert (v6)
        execSync('magick -version', { stdio: 'ignore' });
        return true;
    } catch (error) {
        try {
            execSync('convert -version', { stdio: 'ignore' });
            return true;
        } catch (error) {
            return false;
        }
    }
}

function getImageMagickCommand(): string {
    try {
        execSync('magick -version', { stdio: 'ignore' });
        return 'magick';
    } catch (error) {
        return 'convert';
    }
}

function optimizeImage(inputPath: string): boolean {
    const dir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(dir, `${baseName}.webp`);

    try {
        // Use ImageMagick to convert and resize without cropping (preserve aspect ratio)
        const magickCmd = getImageMagickCommand();
        const command = `${magickCmd} "${inputPath}" -resize "${TARGET_SIZE}>" -quality 80 "${outputPath}"`;
        execSync(command, { stdio: 'pipe' });

        console.log(`✓ Optimized: ${path.relative(process.cwd(), inputPath)} → ${path.relative(process.cwd(), outputPath)}`);
        return true;
    } catch (error) {
        console.error(`✗ Failed to optimize ${inputPath}: ${(error as Error).message}`);
        return false;
    }
}

function main(): void {
    console.log('🖼️  Image Optimization Script');
    console.log('================================');

    // Check if ImageMagick is installed
    if (!checkImageMagickInstalled()) {
        console.error('❌ ImageMagick is not installed or not in PATH.');
        console.error('Please install ImageMagick:');
        console.error('  macOS: brew install imagemagick');
        console.error('  Ubuntu: sudo apt-get install imagemagick');
        console.error('  Windows: Download from https://imagemagick.org/script/download.php');
        process.exit(1);
    }

    // Check if assets/themes directory exists
    if (!fs.existsSync(ASSETS_THEME_DIR)) {
        console.error(`❌ Directory not found: ${ASSETS_THEME_DIR}`);
        process.exit(1);
    }

    console.log(`📁 Searching for images in: ${ASSETS_THEME_DIR}`);
    const images = findImages(ASSETS_THEME_DIR);

    if (images.length === 0) {
        console.log('📭 No images found in the assets/themes directory.');
        return;
    }

    console.log(`🔍 Found ${images.length} image(s) to optimize:`);
    images.forEach(img => console.log(`   - ${path.relative(process.cwd(), img)}`));
    console.log('');

    let successCount = 0;
    let failCount = 0;

    for (const imagePath of images) {
        if (optimizeImage(imagePath)) {
            successCount++;
        } else {
            failCount++;
        }
    }

    console.log('');
    console.log('📊 Summary:');
    console.log(`   ✓ Successfully optimized: ${successCount}`);
    console.log(`   ✗ Failed to optimize: ${failCount}`);
    console.log(`   📏 Target size: ${TARGET_SIZE}`);
    console.log(`   🗂️  Target format: ${TARGET_FORMAT}`);

    if (failCount > 0) {
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { findImages, optimizeImage };