// Converts the raw content (content/catalog.json, content/books, content/brand) into
// compressed web assets under public/media. Runs automatically before `dev` and `build`.
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(projectRoot, 'content');
const mediaDir = join(projectRoot, 'public', 'media');

const COVER_TEXTURE_HEIGHT = 1536;
const MOCKUP_WIDTH = 1500;
const WEBP_QUALITY = 82;

const BRAND_ASSETS = [
  { source: 'brand/logo-blank-body.png', output: 'brand/logo-blank-body.webp', width: 256 },
  { source: 'brand/logo-blank-body.png', output: 'brand/logo-blank-body-512.png', width: 512 },
  { source: 'brand/logo-blank-body.png', output: 'brand/favicon-64.png', width: 64 },
  { source: 'brand/style-illustration-blank.png', output: 'brand/style-illustration-blank.webp', width: 900 },
];

async function isUpToDate(sourcePath, outputPath) {
  try {
    const [sourceStat, outputStat] = await Promise.all([stat(sourcePath), stat(outputPath)]);
    return outputStat.mtimeMs >= sourceStat.mtimeMs;
  } catch {
    return false;
  }
}

async function writeImage({ sourcePath, outputPath, resize }) {
  if (await isUpToDate(sourcePath, outputPath)) return false;
  await mkdir(dirname(outputPath), { recursive: true });
  const pipeline = sharp(sourcePath).resize(resize);
  const extension = parse(outputPath).ext;
  await (extension === '.png'
    ? pipeline.png({ compressionLevel: 9 })
    : pipeline.webp({ quality: WEBP_QUALITY })
  ).toFile(outputPath);
  return true;
}

export function toMediaPath(contentPath) {
  const { dir, name } = parse(contentPath);
  return join(dir, `${name}.webp`);
}

function getResizeForImageKind(imageKind) {
  if (imageKind === 'mockup') return { width: MOCKUP_WIDTH, withoutEnlargement: true };
  return { height: COVER_TEXTURE_HEIGHT, withoutEnlargement: true };
}

async function buildBookMedia(catalog) {
  const jobs = catalog.flatMap((book) =>
    Object.entries(book.images ?? {}).map(([imageKind, contentPath]) => ({
      sourcePath: join(contentDir, contentPath),
      outputPath: join(mediaDir, toMediaPath(contentPath)),
      resize: getResizeForImageKind(imageKind),
    })),
  );
  const fileJobs = catalog
    .filter((book) => book.file)
    .map((book) => ({ sourcePath: join(contentDir, book.file), outputPath: join(mediaDir, book.file) }));

  const writtenImages = await Promise.all(jobs.map(writeImage));
  await Promise.all(
    fileJobs.map(async ({ sourcePath, outputPath }) => {
      if (await isUpToDate(sourcePath, outputPath)) return;
      await mkdir(dirname(outputPath), { recursive: true });
      await copyFile(sourcePath, outputPath);
    }),
  );
  return writtenImages.filter(Boolean).length;
}

async function buildBrandMedia() {
  const written = await Promise.all(
    BRAND_ASSETS.map(({ source, output, width }) =>
      writeImage({
        sourcePath: join(contentDir, source),
        outputPath: join(mediaDir, output),
        resize: { width, withoutEnlargement: true },
      }),
    ),
  );
  return written.filter(Boolean).length;
}

const catalog = JSON.parse(await readFile(join(contentDir, 'catalog.json'), 'utf8'));
const [bookCount, brandCount] = await Promise.all([buildBookMedia(catalog), buildBrandMedia()]);
console.log(`[media] ${catalog.length} books, ${bookCount + brandCount} images regenerated`);
