import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const appDir = path.join(rootDir, 'src', 'app');

// 1. Create the precision modern Vector SVG Favicon
// Optimized for outstanding legibility at both 16x16 tab sizes and high-res display
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <!-- Background Gradient: Brand Smart Transit Emerald to Cyan -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="50%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <!-- Glass Specular Reflection -->
    <linearGradient id="glossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>

    <!-- Windshield Gradient -->
    <linearGradient id="windshield" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#064E3B" />
      <stop offset="60%" stop-color="#022C22" />
      <stop offset="100%" stop-color="#011812" />
    </linearGradient>

    <!-- Windshield Reflection Glare -->
    <linearGradient id="windshieldGlare" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#67E8F9" stop-opacity="0.6" />
      <stop offset="35%" stop-color="#A7F3D0" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#67E8F9" stop-opacity="0" />
    </linearGradient>

    <!-- Headlight Beam Glow -->
    <linearGradient id="headlightGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#67E8F9" />
      <stop offset="100%" stop-color="#06B6D4" />
    </linearGradient>

    <!-- Destination Sign / LED Matrix -->
    <linearGradient id="ledMatrix" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="50%" stop-color="#6EE7B7" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>

    <!-- Drop Shadow Filter for Depth -->
    <filter id="busShadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#022C22" flood-opacity="0.45" />
    </filter>

    <filter id="lightGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.5" result="glow" />
      <feComposite in="SourceGraphic" in2="glow" operator="over" />
    </filter>
  </defs>

  <!-- Squircle Base Tile -->
  <rect x="4" y="4" width="120" height="120" rx="30" ry="30" fill="url(#bgGrad)" />
  
  <!-- Outer Subtle Border -->
  <rect x="4" y="4" width="120" height="120" rx="30" ry="30" fill="none" stroke="#6EE7B7" stroke-width="2" stroke-opacity="0.4" />

  <!-- Upper Half Glass Sheen -->
  <path d="M 4 34 C 4 17.43 17.43 4 34 4 L 94 4 C 110.57 4 124 17.43 124 34 L 124 58 C 124 58 84 76 64 76 C 44 76 4 58 4 58 Z" fill="url(#glossGrad)" />

  <!-- Dynamic Transit Speed Waves / Rails at Base -->
  <g opacity="0.35" stroke="#A7F3D0" stroke-width="2.5" stroke-linecap="round">
    <line x1="28" y1="108" x2="100" y2="108" />
    <line x1="38" y1="114" x2="90" y2="114" stroke-width="2" />
  </g>

  <!-- Modern Transit Vehicle Container (with Drop Shadow) -->
  <g filter="url(#busShadow)">
    
    <!-- Outer Vehicle Body Shell (Crisp White/Silver Contrast) -->
    <path d="
      M 38 32
      C 38 24, 46 22, 64 22
      C 82 22, 90 24, 90 32
      L 93 78
      C 93 84, 88 88, 80 89
      L 48 89
      C 40 88, 35 84, 35 78
      Z
    " fill="#FFFFFF" />

    <!-- Aerodynamic Roof Cap Accent -->
    <path d="
      M 43 27
      C 48 24.5, 56 24, 64 24
      C 72 24, 80 24.5, 85 27
      L 83 31
      C 78 29.5, 71 29, 64 29
      C 57 29, 50 29.5, 45 31
      Z
    " fill="#059669" opacity="0.9" />

    <!-- LED Destination Matrix Sign -->
    <rect x="47" y="32" width="34" height="6.5" rx="2" fill="#064E3B" />
    <rect x="49" y="33.5" width="30" height="3.5" rx="1.5" fill="url(#ledMatrix)" filter="url(#lightGlow)" />

    <!-- Large Panoramic Aerodynamic Windshield -->
    <path d="
      M 41 41
      L 87 41
      L 86 64
      C 86 67, 83 69, 78 70
      L 50 70
      C 45 69, 42 67, 42 64
      Z
    " fill="url(#windshield)" />

    <!-- Windshield Specular Reflection Glare Wedge -->
    <path d="
      M 43 43
      L 60 43
      L 47 67
      L 43 65
      Z
    " fill="url(#windshieldGlare)" />

    <!-- Center Electric Wing / Transit Grille Blade -->
    <rect x="52" y="73" width="24" height="3" rx="1.5" fill="#059669" />

    <!-- Sleek High-Intensity LED Headlights (Left & Right Angled) -->
    <!-- Left Headlight -->
    <polygon points="41,72 49,72 47,77 40,75" fill="url(#headlightGlow)" filter="url(#lightGlow)" />
    <!-- Right Headlight -->
    <polygon points="87,72 79,72 81,77 88,75" fill="url(#headlightGlow)" filter="url(#lightGlow)" />

    <!-- Lower Bumper / Under-Guard -->
    <path d="
      M 44 82
      C 48 84, 56 85, 64 85
      C 72 85, 80 84, 84 82
      L 85 86
      C 80 88, 72 89, 64 89
      C 56 89, 48 88, 43 86
      Z
    " fill="#0F172A" />

    <!-- Wheels / Side Road Skirts -->
    <rect x="33" y="76" width="3.5" height="12" rx="1.5" fill="#047857" />
    <rect x="91.5" y="76" width="3.5" height="12" rx="1.5" fill="#047857" />
  </g>
</svg>`;

// Helper function to create an ICO file buffer from multiple PNG buffers (16x16, 32x32, 48x48)
function createIcoFromPngs(pngBuffers) {
  // ICO Header: 6 bytes
  // - Reserved: 2 bytes (0)
  // - Type: 2 bytes (1 = ICO)
  // - Count: 2 bytes (number of images)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Image type: 1 = ICO
  header.writeUInt16LE(pngBuffers.length, 4);

  // Each directory entry: 16 bytes
  const dirSize = 16 * pngBuffers.length;
  let offset = 6 + dirSize;

  const dirEntries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(16);
    // Width (1 byte, 0 means 256)
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    // Height (1 byte, 0 means 256)
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    // Color palette (1 byte, 0 if no palette)
    entry.writeUInt8(0, 2);
    // Reserved (1 byte, 0)
    entry.writeUInt8(0, 3);
    // Color planes (2 bytes, 1)
    entry.writeUInt16LE(1, 4);
    // Bits per pixel (2 bytes, 32 for RGBA)
    entry.writeUInt16LE(32, 6);
    // Image size in bytes (4 bytes)
    entry.writeUInt32LE(img.buffer.length, 8);
    // Offset from start of file (4 bytes)
    entry.writeUInt32LE(offset, 12);

    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(p => p.buffer)]);
}

async function main() {
  console.log('🚀 Starting Smart Transit Favicon & Icon Generation...');

  // 1. Write the vector SVG icon to both public/ and src/app/
  const publicSvgPath = path.join(publicDir, 'favicon.svg');
  const appSvgPath = path.join(appDir, 'icon.svg');
  fs.writeFileSync(publicSvgPath, svgIcon, 'utf8');
  fs.writeFileSync(appSvgPath, svgIcon, 'utf8');
  console.log('✅ Generated public/favicon.svg & src/app/icon.svg');

  // 2. Generate multi-resolution PNGs from the vector SVG
  const svgBuffer = Buffer.from(svgIcon);

  const pngSizes = [
    { name: 'favicon-16x16.png', size: 16, target: publicDir },
    { name: 'favicon-32x32.png', size: 32, target: publicDir },
    { name: 'favicon-48x48.png', size: 48, target: publicDir },
    { name: 'apple-touch-icon.png', size: 180, target: publicDir },
    { name: 'apple-icon.png', size: 180, target: appDir },
    { name: 'icon-192.png', size: 192, target: publicDir },
    { name: 'icon-512.png', size: 512, target: publicDir },
  ];

  const icoBuffers = [];

  for (const item of pngSizes) {
    const buffer = await sharp(svgBuffer, { density: 300 })
      .resize(item.size, item.size)
      .png()
      .toBuffer();

    const outPath = path.join(item.target, item.name);
    fs.writeFileSync(outPath, buffer);
    console.log(`✅ Generated ${path.relative(rootDir, outPath)} (${item.size}x${item.size})`);

    if ([16, 32, 48].includes(item.size)) {
      icoBuffers.push({ width: item.size, height: item.size, buffer });
    }
  }

  // 3. Generate multi-size .ico file (16x16, 32x32, 48x48)
  const icoBuffer = createIcoFromPngs(icoBuffers);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log('✅ Generated multi-size public/favicon.ico & src/app/favicon.ico');

  // 4. Generate Web Manifest (site.webmanifest)
  const webManifest = {
    name: "Smart Transit System",
    short_name: "SmartTransit",
    description: "Modern public transit ticketing and real-time fleet management platform",
    start_url: "/",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#10B981",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };

  fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(webManifest, null, 2), 'utf8');
  console.log('✅ Generated public/site.webmanifest');

  console.log('\n🎉 Favicon & App Icon generation completed successfully!');
}

main().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
