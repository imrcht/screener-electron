// Full-resolution screenshot via desktopCapturer (main process).
// First call triggers the macOS Screen-Recording permission prompt for the app.
const { desktopCapturer, screen } = require('electron');

const MAX_DIMENSION = 1280; // longest-edge cap for LLM vision — keeps payload ≤ ~400 KB
const JPEG_QUALITY = 80;    // 0–100; 80 is sharp enough for code/text, ~10× smaller than PNG

async function captureScreenshot() {
  const primary = screen.getPrimaryDisplay();
  const { width, height } = primary.size;
  const scale = primary.scaleFactor || 1;
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: Math.floor(width * scale), height: Math.floor(height * scale) }
  });
  if (!sources.length) return null;
  // Prefer the primary display source.
  const src = sources.find((s) => String(s.display_id) === String(primary.id)) || sources[0];
  let img = src.thumbnail;
  if (!img || img.isEmpty()) return null;

  // Downscale to MAX_DIMENSION on the longest edge (preserves aspect ratio).
  const { width: pw, height: ph } = img.getSize();
  const longest = Math.max(pw, ph);
  if (longest > MAX_DIMENSION) {
    const ratio = MAX_DIMENSION / longest;
    img = img.resize({
      width: Math.round(pw * ratio),
      height: Math.round(ph * ratio),
      quality: 'good' // Lanczos-ish downscale
    });
  }

  // JPEG at 80% quality — ~10× smaller than the PNG default.
  const jpegBuffer = img.toJPEG(JPEG_QUALITY);
  return 'data:image/jpeg;base64,' + jpegBuffer.toString('base64');
}

module.exports = { captureScreenshot };
