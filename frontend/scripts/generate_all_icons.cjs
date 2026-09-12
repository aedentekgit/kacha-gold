const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/Sabari/AppData/Local/npm-cache/_npx/4e5c24d7baa062b3/node_modules/sharp');

const SOURCE_IMAGE = path.resolve(__dirname, '../public/logo_original.png');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const RES_DIR = path.resolve(__dirname, '../android/app/src/main/res');

// Helper to build a multi-resolution ICO file
function createIco(buffers) {
  const count = buffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type = 1
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const dirEntries = [];
  const imageBuffers = [];

  for (const img of buffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.data.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    dirEntries.push(entry);
    imageBuffers.push(img.data);
    offset += img.data.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

async function run() {
  console.log('=== Step 1: Processing Master Emblem ===');
  const trimmed = await sharp(SOURCE_IMAGE)
    .trim({ threshold: 5 })
    .toBuffer({ resolveWithObject: true });

  console.log(`Trimmed source bounds: ${trimmed.info.width}x${trimmed.info.height}`);

  // 1. Create a perfectly centered 1024x1024 master logo.png
  const masterTargetH = 940;
  const masterTargetW = Math.round(masterTargetH * (trimmed.info.width / trimmed.info.height));
  const masterEmblem = await sharp(trimmed.data)
    .resize(masterTargetW, masterTargetH, { fit: 'contain' })
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{
      input: masterEmblem,
      top: Math.round((1024 - masterTargetH) / 2),
      left: Math.round((1024 - masterTargetW) / 2)
    }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, 'logo.png'));
  console.log('Generated: public/logo.png (1024x1024 centered master)');

  console.log('=== Step 2: Generating Web & PWA Assets ===');
  // Apple touch icon (180x180, solid white background)
  const appleH = 138;
  const appleW = Math.round(appleH * (trimmed.info.width / trimmed.info.height));
  const appleEmblem = await sharp(trimmed.data).resize(appleW, appleH, { fit: 'contain' }).toBuffer();
  await sharp({
    create: { width: 180, height: 180, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
    .composite([{ input: appleEmblem, top: Math.round((180 - appleH) / 2), left: Math.round((180 - appleW) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('Generated: public/apple-touch-icon.png (180x180)');

  // PWA Square icons with subtle white squircle card
  async function generatePwaIcon(size, filename) {
    const pad = Math.round(size * 0.04);
    const cardSize = size - pad * 2;
    const rx = Math.round(cardSize * 0.22);
    const cardSvg = Buffer.from(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="pwaShadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="${Math.max(1, Math.round(size * 0.015))}" stdDeviation="${Math.max(1.5, Math.round(size * 0.02))}" flood-color="#000000" flood-opacity="0.10" />
          </filter>
        </defs>
        <rect x="${pad}" y="${pad}" width="${cardSize}" height="${cardSize}" rx="${rx}" fill="#FFFFFF" filter="url(#pwaShadow)" />
      </svg>
    `);

    const targetH = Math.round(cardSize * 0.72);
    const targetW = Math.round(targetH * (trimmed.info.width / trimmed.info.height));
    const emblem = await sharp(trimmed.data).resize(targetW, targetH, { fit: 'contain' }).toBuffer();

    const card = await sharp(cardSvg).png().toBuffer();
    await sharp(card)
      .composite([{
        input: emblem,
        top: Math.round((size - targetH) / 2),
        left: Math.round((size - targetW) / 2)
      }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(PUBLIC_DIR, filename));
    console.log(`Generated: public/${filename} (${size}x${size})`);
  }

  await generatePwaIcon(192, 'icon-192.png');
  await generatePwaIcon(512, 'icon-512.png');

  // Maskable PWA icons (full bleed solid white background, safe zone ~62%)
  async function generateMaskableIcon(size, filename) {
    const targetH = Math.round(size * 0.62);
    const targetW = Math.round(targetH * (trimmed.info.width / trimmed.info.height));
    const emblem = await sharp(trimmed.data).resize(targetW, targetH, { fit: 'contain' }).toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
    })
      .composite([{
        input: emblem,
        top: Math.round((size - targetH) / 2),
        left: Math.round((size - targetW) / 2)
      }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(PUBLIC_DIR, filename));
    console.log(`Generated: public/${filename} (${size}x${size})`);
  }

  await generateMaskableIcon(192, 'icon-maskable-192.png');
  await generateMaskableIcon(512, 'icon-maskable-512.png');

  // Favicons (transparent background for crisp browser tab display)
  async function getFaviconBuffer(size) {
    const targetH = Math.round(size * 0.94);
    const targetW = Math.round(targetH * (trimmed.info.width / trimmed.info.height));
    const emblem = await sharp(trimmed.data)
      .resize(targetW, targetH, { fit: 'contain' })
      .toBuffer();

    return await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{
        input: emblem,
        top: Math.round((size - targetH) / 2),
        left: Math.round((size - targetW) / 2)
      }])
      .png()
      .toBuffer();
  }

  const fav16 = await getFaviconBuffer(16);
  const fav32 = await getFaviconBuffer(32);
  const fav48 = await getFaviconBuffer(48);

  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-16x16.png'), fav16);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-32x32.png'), fav32);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.png'), fav32);

  // Multi-resolution favicon.ico
  const icoBuffer = createIco([
    { width: 16, height: 16, data: fav16 },
    { width: 32, height: 32, data: fav32 },
    { width: 48, height: 48, data: fav48 }
  ]);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
  console.log('Generated: public/favicon.ico, favicon-32x32.png, favicon-16x16.png, favicon.png');

  console.log('=== Step 3: Generating Android Adaptive Icons (Foreground) ===');
  // Canvas is 108dp. Safe zone circle diameter is 72dp (~66.7%).
  // Emblem occupies ~63% of canvas, guaranteeing ZERO clipping across all launchers.
  const adaptiveDensities = [
    { dir: 'mipmap-mdpi', canvas: 108 },
    { dir: 'mipmap-hdpi', canvas: 162 },
    { dir: 'mipmap-xhdpi', canvas: 216 },
    { dir: 'mipmap-xxhdpi', canvas: 324 },
    { dir: 'mipmap-xxxhdpi', canvas: 432 },
  ];

  for (const item of adaptiveDensities) {
    const targetH = Math.round(item.canvas * 0.63);
    const targetW = Math.round(targetH * (trimmed.info.width / trimmed.info.height));
    const emblem = await sharp(trimmed.data)
      .resize(targetW, targetH, { fit: 'contain' })
      .toBuffer();

    const targetDir = path.join(RES_DIR, item.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    await sharp({
      create: {
        width: item.canvas,
        height: item.canvas,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{
        input: emblem,
        top: Math.round((item.canvas - targetH) / 2),
        left: Math.round((item.canvas - targetW) / 2)
      }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    // Solid white full-bleed background
    await sharp({
      create: {
        width: item.canvas,
        height: item.canvas,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_background.png'));

    console.log(`Generated: ${item.dir}/ic_launcher_foreground.png (${item.canvas}x${item.canvas})`);
  }

  console.log('=== Step 4: Generating Android Legacy Icons (ic_launcher & ic_launcher_round) ===');
  const legacySizes = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ];

  for (const item of legacySizes) {
    const targetDir = path.join(RES_DIR, item.dir);
    const size = item.size;

    // 1. Squircle card ic_launcher.png
    const pad = Math.max(1, Math.round(size * 0.03));
    const cardSize = size - pad * 2;
    const rx = Math.round(cardSize * 0.22);
    const squircleSvg = Buffer.from(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="squircleShadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="${Math.max(1, Math.round(size * 0.015))}" stdDeviation="${Math.max(1, Math.round(size * 0.018))}" flood-color="#000000" flood-opacity="0.12" />
          </filter>
        </defs>
        <rect x="${pad}" y="${pad}" width="${cardSize}" height="${cardSize}" rx="${rx}" fill="#FFFFFF" filter="url(#squircleShadow)" />
      </svg>
    `);

    const squircleCard = await sharp(squircleSvg).png().toBuffer();
    const squircleH = Math.round(cardSize * 0.72);
    const squircleW = Math.round(squircleH * (trimmed.info.width / trimmed.info.height));
    const squircleEmblem = await sharp(trimmed.data).resize(squircleW, squircleH, { fit: 'contain' }).toBuffer();

    await sharp(squircleCard)
      .composite([{
        input: squircleEmblem,
        top: Math.round((size - squircleH) / 2),
        left: Math.round((size - squircleW) / 2)
      }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // 2. Circular card ic_launcher_round.png
    const r = (size / 2) - pad;
    const circleSvg = Buffer.from(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="circleShadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="${Math.max(1, Math.round(size * 0.015))}" stdDeviation="${Math.max(1, Math.round(size * 0.018))}" flood-color="#000000" flood-opacity="0.12" />
          </filter>
        </defs>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="#FFFFFF" filter="url(#circleShadow)" />
      </svg>
    `);

    const circleCard = await sharp(circleSvg).png().toBuffer();
    const roundH = Math.round(cardSize * 0.68);
    const roundW = Math.round(roundH * (trimmed.info.width / trimmed.info.height));
    const roundEmblem = await sharp(trimmed.data).resize(roundW, roundH, { fit: 'contain' }).toBuffer();

    await sharp(circleCard)
      .composite([{
        input: roundEmblem,
        top: Math.round((size - roundH) / 2),
        left: Math.round((size - roundW) / 2)
      }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    console.log(`Generated: ${item.dir}/ic_launcher.png & ic_launcher_round.png (${size}x${size})`);
  }

  console.log('=== Step 5: Generating Android Splash Screens ===');
  const splashSizes = [
    { dir: 'drawable', w: 480, h: 320 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320 },
    { dir: 'drawable-land-hdpi', w: 800, h: 480 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
  ];

  for (const s of splashSizes) {
    const targetDir = path.join(RES_DIR, s.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const minDim = Math.min(s.w, s.h);
    const targetH = Math.round(minDim * 0.38);
    const targetW = Math.round(targetH * (trimmed.info.width / trimmed.info.height));

    const emblem = await sharp(trimmed.data)
      .resize(targetW, targetH, { fit: 'contain' })
      .toBuffer();

    await sharp({
      create: {
        width: s.w,
        height: s.h,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{
        input: emblem,
        top: Math.round((s.h - targetH) / 2),
        left: Math.round((s.w - targetW) / 2)
      }])
      .png({ compressionLevel: 8 })
      .toFile(path.join(targetDir, 'splash.png'));

    console.log(`Generated: ${s.dir}/splash.png (${s.w}x${s.h})`);
  }

  console.log('=== Step 6: Updating Adaptive Icon XMLs ===');
  const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
  const anydpiDir = path.join(RES_DIR, 'mipmap-anydpi-v26');
  if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), xmlContent, 'utf8');
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), xmlContent, 'utf8');

  const valuesDir = path.join(RES_DIR, 'values');
  if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });
  fs.writeFileSync(
    path.join(valuesDir, 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFFFFF</color>\n</resources>\n`,
    'utf8'
  );

  console.log('Updated adaptive-icon XML definitions');
  console.log('ALL ICONS GENERATED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
