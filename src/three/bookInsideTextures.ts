import type * as THREE from 'three';
import type { Book } from '../data/catalog';
import { translate, translateDynamic } from '../i18n';
import { THEME_COLORS } from '../theme';
import { createCanvas, toTexture } from './bookTextures';

const PAGE_SIZE = { width: 1024, height: 1536 } as const;
const MARGIN = 92;
const CONTENT_WIDTH = PAGE_SIZE.width - MARGIN * 2;
const FONT_FAMILY = 'Montserrat, system-ui, sans-serif';
const FONT_WEIGHT = { body: 400, strong: 600, title: 900 } as const;
const FONTS_TO_LOAD = [`${FONT_WEIGHT.body} 2rem Montserrat`, `${FONT_WEIGHT.strong} 2rem Montserrat`, `${FONT_WEIGHT.title} 2rem Montserrat`];
const OUTLINE_WIDTH = 7;
const MIN_CONTENT_SCALE = 0.6;
const CONTENT_SCALE_STEP = 0.92;

type DrawPage = (context: CanvasRenderingContext2D) => void;

function setFont(context: CanvasRenderingContext2D, weight: number, sizePx: number, letterSpacingPx = 0): void {
  context.font = `${weight} ${sizePx}px ${FONT_FAMILY}`;
  context.letterSpacing = `${letterSpacingPx}px`;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let currentLine = '';
  for (const word of text.split(/\s+/)) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && context.measureText(candidate).width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawHalftone(context: CanvasRenderingContext2D, color: string, spacing: number, radius: number): void {
  context.fillStyle = color;
  for (let row = 0; row * spacing < PAGE_SIZE.height + spacing; row += 1) {
    const rowOffset = (row % 2) * (spacing / 2);
    for (let column = 0; column * spacing < PAGE_SIZE.width + spacing; column += 1) {
      context.beginPath();
      context.arc(column * spacing + rowOffset, row * spacing, radius, 0, Math.PI * 2);
      context.fill();
    }
  }
}

/** Draws now with whatever font is available, then redraws once Montserrat is loaded. */
function createPageTexture(drawPage: DrawPage): THREE.CanvasTexture {
  const [canvas, context] = createCanvas(PAGE_SIZE.width, PAGE_SIZE.height);
  const texture = toTexture(canvas);
  if (!context) return texture;
  drawPage(context);
  Promise.all(FONTS_TO_LOAD.map((font) => document.fonts.load(font)))
    .then(() => {
      drawPage(context);
      texture.needsUpdate = true;
    })
    .catch(() => undefined);
  return texture;
}

function formatSeriesFooter(book: Book): string {
  const seriesLabel = translateDynamic(`books.filter.${book.series}`, 'books.filter.all');
  return translate('bookInside.footer', { series: seriesLabel.toUpperCase() });
}

/** Inside of the front cover: series colour, faint halftone and an ownership card. */
export function createInsideCoverTexture(book: Book): THREE.CanvasTexture {
  return createPageTexture((context) => {
    const { width, height } = PAGE_SIZE;
    context.fillStyle = book.accent;
    context.fillRect(0, 0, width, height);
    drawHalftone(context, 'rgba(255,255,255,0.12)', 40, 6);

    const card = { x: MARGIN, y: height * 0.34, width: CONTENT_WIDTH, height: 470 };
    context.fillStyle = THEME_COLORS.ink;
    context.beginPath();
    context.roundRect(card.x + 14, card.y + 14, card.width, card.height, 34);
    context.fill();
    context.fillStyle = THEME_COLORS.cream;
    context.strokeStyle = THEME_COLORS.ink;
    context.lineWidth = OUTLINE_WIDTH;
    context.beginPath();
    context.roundRect(card.x, card.y, card.width, card.height, 34);
    context.fill();
    context.stroke();

    const innerX = card.x + 64;
    const innerWidth = card.width - 128;
    context.fillStyle = THEME_COLORS.navy;
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    setFont(context, FONT_WEIGHT.title, 50);
    context.fillText(translate('bookInside.belongsTo'), innerX, card.y + 120, innerWidth);

    const lineY = card.y + 270;
    context.strokeStyle = THEME_COLORS.navy;
    context.lineWidth = 4;
    context.setLineDash([18, 14]);
    context.beginPath();
    context.moveTo(innerX, lineY);
    context.lineTo(innerX + innerWidth, lineY);
    context.stroke();
    context.setLineDash([]);
    setFont(context, FONT_WEIGHT.title, 26, 8);
    context.fillText(translate('bookInside.name'), innerX, lineY + 50);

    setFont(context, FONT_WEIGHT.strong, 38);
    context.fillText(translate('bookInside.startedOn'), innerX, card.y + card.height - 64, innerWidth);
  });
}

interface FirstPageLayout {
  titleLines: string[];
  blurbLines: string[];
  bulletLines: string[][];
  titleSize: number;
  bodySize: number;
  contentBottom: number;
}

const FIRST_PAGE = {
  bandHeight: 34,
  eyebrowTop: 190,
  footerBaseline: PAGE_SIZE.height - 92,
  footerGap: 70,
  titleSize: 92,
  bodySize: 36,
  bulletNumberWidth: 96,
} as const;

function measureFirstPage(context: CanvasRenderingContext2D, book: Book, scale: number): FirstPageLayout {
  const titleSize = FIRST_PAGE.titleSize * scale;
  const bodySize = FIRST_PAGE.bodySize * scale;
  setFont(context, FONT_WEIGHT.title, titleSize, -1);
  const titleLines = wrapText(context, book.title, CONTENT_WIDTH);
  setFont(context, FONT_WEIGHT.body, bodySize);
  const blurbLines = wrapText(context, book.blurb, CONTENT_WIDTH);
  setFont(context, FONT_WEIGHT.strong, bodySize);
  const bulletLines = book.bullets.map((bullet) => wrapText(context, bullet, CONTENT_WIDTH - FIRST_PAGE.bulletNumberWidth));

  const titleBlock = titleLines.length * titleSize * 1.02;
  const blurbBlock = blurbLines.length * bodySize * 1.5;
  const bulletBlock = bulletLines.reduce((total, lines) => total + lines.length * bodySize * 1.4 + bodySize * 1.3, 0);
  const contentBottom = FIRST_PAGE.eyebrowTop + 70 + titleBlock + 50 + blurbBlock + 60 + bulletBlock;
  return { titleLines, blurbLines, bulletLines, titleSize, bodySize, contentBottom };
}

function fitFirstPage(context: CanvasRenderingContext2D, book: Book): FirstPageLayout {
  const maxBottom = FIRST_PAGE.footerBaseline - FIRST_PAGE.footerGap;
  let scale = 1;
  let layout = measureFirstPage(context, book, scale);
  while (layout.contentBottom > maxBottom && scale > MIN_CONTENT_SCALE) {
    scale *= CONTENT_SCALE_STEP;
    layout = measureFirstPage(context, book, scale);
  }
  return layout;
}

/** First page under the front cover: title, blurb and numbered bullets in the PDF style. */
export function createFirstPageTexture(book: Book): THREE.CanvasTexture {
  return createPageTexture((context) => {
    const { width, height } = PAGE_SIZE;
    context.fillStyle = THEME_COLORS.cream;
    context.fillRect(0, 0, width, height);
    context.fillStyle = book.accent;
    context.fillRect(0, 0, width, FIRST_PAGE.bandHeight);

    const layout = fitFirstPage(context, book);
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';

    context.fillStyle = THEME_COLORS.navy;
    setFont(context, FONT_WEIGHT.title, 26, 9);
    context.fillText(translate('bookInside.whatsInside'), MARGIN, FIRST_PAGE.eyebrowTop);

    let cursorY = FIRST_PAGE.eyebrowTop + 70;
    setFont(context, FONT_WEIGHT.title, layout.titleSize, -1);
    for (const line of layout.titleLines) {
      cursorY += layout.titleSize * 1.02;
      context.fillText(line, MARGIN, cursorY - layout.titleSize * 0.2);
    }

    cursorY += 50;
    context.fillStyle = THEME_COLORS.ink;
    setFont(context, FONT_WEIGHT.body, layout.bodySize);
    for (const line of layout.blurbLines) {
      cursorY += layout.bodySize * 1.5;
      context.fillText(line, MARGIN, cursorY);
    }

    cursorY += 60;
    layout.bulletLines.forEach((lines, index) => {
      const rowTop = cursorY;
      context.fillStyle = THEME_COLORS.pageLine;
      context.fillRect(MARGIN, rowTop, CONTENT_WIDTH, 3);

      const firstBaseline = rowTop + layout.bodySize * 1.65;
      context.fillStyle = book.accent;
      setFont(context, FONT_WEIGHT.title, layout.bodySize * 1.1);
      context.fillText(String(index + 1).padStart(2, '0'), MARGIN, firstBaseline);

      context.fillStyle = THEME_COLORS.navy;
      setFont(context, FONT_WEIGHT.strong, layout.bodySize);
      lines.forEach((line, lineIndex) => {
        context.fillText(line, MARGIN + FIRST_PAGE.bulletNumberWidth, firstBaseline + lineIndex * layout.bodySize * 1.4);
      });
      cursorY = rowTop + lines.length * layout.bodySize * 1.4 + layout.bodySize * 1.3;
    });
    context.fillStyle = THEME_COLORS.pageLine;
    context.fillRect(MARGIN, cursorY, CONTENT_WIDTH, 3);

    context.fillStyle = THEME_COLORS.navy;
    setFont(context, FONT_WEIGHT.title, 24, 7);
    context.textAlign = 'center';
    context.fillText(formatSeriesFooter(book), width / 2, height - 92);
  });
}
