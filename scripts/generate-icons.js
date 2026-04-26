// scripts/generate-icons.js - Generate placeholder icons
import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sizes = [16, 48, 128];
// ✅ Fix: Use CSS color string format instead of object
const color = '#2196f3'; // Blue primary color

async function generateIcons() {
    try {
        await mkdir(`${__dirname}/../icons`, { recursive: true });

        for (const size of sizes) {
            const buffer = await sharp({
                create: {
                    width: size,
                    height: size,
                    channels: 4,
                    background: color  // ✅ Now accepts string: '#2196f3' or 'rgba(33,150,243,1)'
                }
            })
                .png({ compressionLevel: 9 })
                .toBuffer();

            await writeFile(`${__dirname}/../icons/icon${size}.png`, buffer);
            console.log(`✓ Created icons/icon${size}.png (${size}x${size})`);
        }

        console.log('\n🎨 Icons generated successfully!');
        console.log('📁 Location:', `${__dirname}/../icons/`);
    } catch (error) {
        console.error('❌ Error generating icons:', error.message);
        process.exit(1);
    }
}

generateIcons();