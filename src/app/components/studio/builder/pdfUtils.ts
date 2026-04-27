
import { jsPDF } from 'jspdf';

const SCALE = 3; // 3× for high-DPI sharpness

// ─── helpers ──────────────────────────────────────────────────────────────────

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Serialise an SVG element → data-URL for drawing onto a canvas.
 *
 * We set the SVG's pixel dimensions to the full canvas size (W*SCALE × H*SCALE)
 * rather than the CSS layout size (W × H).  This makes the browser rasterise the
 * SVG at the target resolution in one pass, so ctx.drawImage can copy it 1-for-1
 * with no upscaling – giving sharper output and removing any resize distortion.
 */
async function svgToDataUrl(svgEl: SVGSVGElement, targetW: number, targetH: number): Promise<string> {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width',  String(targetW));
  clone.setAttribute('height', String(targetH));
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: 'image/svg+xml;charset=utf-8',
  });
  return blobToDataUrl(blob);
}

/**
 * Return the position of `el` relative to `container` in logical px.
 *
 * We clamp the result to [0, canvasW] / [0, canvasH] so that footer panels
 * whose getBoundingClientRect slightly exceeds the container (due to sub-pixel
 * rounding) never draw outside the canvas bounds and cause apparent stretching.
 */
function relRect(el: Element, container: Element, canvasW = Infinity, canvasH = Infinity) {
  const c = container.getBoundingClientRect();
  const e = el.getBoundingClientRect();
  const x = Math.max(0, e.left - c.left);
  const y = Math.max(0, e.top  - c.top);
  const w = Math.min(e.width,  canvasW - x);
  const h = Math.min(e.height, canvasH - y);
  return { x, y, w, h };
}

/**
 * Truncate `text` to fit within `maxW` canvas-pixels, appending "…" if needed.
 * Requires ctx.font to already be set to the intended font.
 */
function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

/** Wrap pre-split words; all coordinates already in canvas px (scaled). */
function fillWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
): void {
  const words = text.split(/\s+/).filter(Boolean);
  let line = '';
  let curY = y;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxW && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineH;
    } else {
      line = candidate;
    }
  }
  if (line) ctx.fillText(line, x, curY);
}

/**
 * Draw the footer overlay (notes, BOM, title block) directly on the canvas
 * using 2D drawing primitives.  No external resources → no tainted-canvas risk.
 *
 * canvasW / canvasH (logical px) are passed to relRect so that panel coordinates
 * are clamped to the canvas bounds, preventing sub-pixel overflow that shows up
 * as layout stretching in the PDF.
 *
 * IMPORTANT: ctx.textBaseline is set to 'top' inside this function so that all
 * y-coordinates represent the TOP edge of the text glyph, not the baseline.
 * ctx state is fully restored afterwards.
 */
function drawFooter(ctx: CanvasRenderingContext2D, canvasEl: HTMLElement, s: number, canvasW: number, canvasH: number) {
  ctx.save();
  ctx.textBaseline = 'top';  // y = top of glyph throughout this function

  const footer = canvasEl.firstElementChild as HTMLElement | null;
  if (!footer) { ctx.restore(); return; }

  const topRow      = footer.children[0] as HTMLElement | undefined;
  const titleBlockEl = footer.children[1] as HTMLElement | undefined;
  if (!topRow || !titleBlockEl) { ctx.restore(); return; }

  const notesPanel = topRow.children[0] as HTMLElement | undefined;
  const bomPanel   = topRow.children[1] as HTMLElement | undefined;

  // ── colour palette ────────────────────────────────────────────────────────
  const BORDER   = '#cbd5e1';
  const BG       = '#ffffff';
  const SLATE900 = '#0f172a';
  const SLATE600 = '#475569';
  const SLATE500 = '#64748b';
  const SLATE400 = '#94a3b8';
  const BLUE900  = '#172554';

  // ── Panel layout – computed from Tailwind classes in Canvas.tsx ─────────
  // Footer outer: `absolute bottom-0 left-0 right-0 px-6(24) pb-6(24) flex-col gap-2(8)`
  // topRow:       `flex gap-4(16)` containing notes (flex-1) and BOM (w-[55%]) at h-36(144)
  // titleBlock:   `h-8(32)`
  const FPX  = 24;   // px-6 left/right padding of the footer
  const FPB  = 24;   // pb-6 bottom padding
  const FGAP = 8;    // gap-2 between topRow and titleBlock
  const PNLH = 144;  // h-36 panel height
  const TTLH = 32;   // h-8 title block height
  const PGAP = 16;   // gap-4 between notes and BOM

  const contentW  = canvasW - 2 * FPX;              // 1008 px
  const titleY    = canvasH - FPB - TTLH;           // 760 px
  const panelY    = titleY  - FGAP - PNLH;          // 608 px
  const bomW      = contentW * 0.55;                 // 554.4 px  (w-[55%])
  const notesW    = contentW - PGAP - bomW;          // 437.6 px  (flex-1)

  // Authoritative panel rects in logical px (used instead of relRect for outer panels)
  const notesR  = { x: FPX,                   y: panelY, w: notesW, h: PNLH };
  const bomR    = { x: FPX + notesW + PGAP,   y: panelY, w: bomW,   h: PNLH };
  const titleR  = { x: FPX,                   y: titleY, w: contentW, h: TTLH };

  // ── drawing helpers (all logical px → multiply by s for canvas px) ────────
  const P = 8; // inner padding for every panel

  function panel(x: number, y: number, w: number, h: number) {
    ctx.fillStyle = BG;
    ctx.fillRect(x * s, y * s, w * s, h * s);
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = s;
    ctx.strokeRect((x + 0.5) * s, (y + 0.5) * s, (w - 1) * s, (h - 1) * s);
  }

  function hline(x1: number, y: number, x2: number) {
    ctx.beginPath();
    ctx.moveTo(x1 * s, y * s);
    ctx.lineTo(x2 * s, y * s);
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 0.5 * s;
    ctx.stroke();
  }

  function vline(x: number, y1: number, y2: number) {
    ctx.beginPath();
    ctx.moveTo(x * s, y1 * s);
    ctx.lineTo(x * s, y2 * s);
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 0.5 * s;
    ctx.stroke();
  }

  /** Draw text at logical (x,y) where y is the TOP of the glyph. */
  function txt(
    text: string,
    x: number,
    y: number,
    size: number,
    color: string,
    bold = false,
    align: CanvasTextAlign = 'left',
  ) {
    ctx.font = `${bold ? 'bold ' : ''}${size * s}px Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x * s, y * s);
    ctx.textAlign = 'left'; // always reset
  }

  /** Width of a string in LOGICAL pixels using the specified font. */
  function tw(text: string, size: number, bold = false): number {
    ctx.font = `${bold ? 'bold ' : ''}${size * s}px Arial, sans-serif`;
    return ctx.measureText(text).width / s;
  }

  // ── Notes panel ───────────────────────────────────────────────────────────
  if (notesPanel) {
    const r = notesR;          // use hardcoded position – not getBoundingClientRect
    panel(r.x, r.y, r.w, r.h);

    // For inner elements use relRect relative to the PANEL (not canvasEl).
    // This gives stable relative offsets regardless of viewport scroll / overflow.
    const headerRowEl = notesPanel.children[0] as HTMLElement | undefined;
    const proseEl     = notesPanel.children[1] as HTMLElement | undefined;

    // ── header row ("INSTALLATION NOTES" label) ───────────────────────────
    if (headerRowEl) {
      const hrRel = relRect(headerRowEl, notesPanel);
      const hr    = { x: r.x + hrRel.x, y: r.y + hrRel.y, w: hrRel.w, h: hrRel.h };
      const FS    = 10;
      const labelY = hr.y + (hr.h - FS) / 2;
      txt('INSTALLATION NOTES', r.x + P, labelY, FS, SLATE500, true);
      hline(r.x + 1, hr.y + hr.h + 2, r.x + r.w - 1);
    }

    // ── note content (prose area) ─────────────────────────────────────────
    if (proseEl) {
      const prRel = relRect(proseEl, notesPanel);
      const pr    = { x: r.x + prRel.x, y: r.y + prRel.y, w: prRel.w, h: prRel.h };

      const raw = proseEl.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      const noteText = raw && !raw.includes('No note selected') ? raw : 'No note selected.';
      const noteColor = noteText === 'No note selected.' ? SLATE400 : SLATE900;

      ctx.font = `${10 * s}px Arial, sans-serif`;
      ctx.fillStyle = noteColor;
      fillWrapped(ctx, noteText, pr.x * s, pr.y * s, pr.w * s, 15 * s);
    }
  }

  // ── BOM panel ─────────────────────────────────────────────────────────────
  if (bomPanel) {
    const r = bomR;            // use hardcoded position – not getBoundingClientRect
    panel(r.x, r.y, r.w, r.h);

    const FONT = 8.5;
    const hdrY  = r.y + P;
    const lineY = hdrY + FONT + 4;

    // Title row: "BILL OF MATERIALS" (left) | "DIMENSIONS (IN)" (right)
    txt('BILL OF MATERIALS', r.x + P, hdrY, FONT, SLATE500, true);
    txt('DIMENSIONS (IN)', r.x + r.w - P, hdrY, FONT, SLATE500, true, 'right');
    hline(r.x + 1, lineY, r.x + r.w - 1);

    const tableEl = bomPanel.querySelector('table') as HTMLTableElement | null;
    if (tableEl) {
      // ── Mounting / Orientation sub-header ─────────────────────────────────
      // Read the two span children of the flex div separately so we can
      // draw them left-aligned and right-aligned (matching the original layout)
      const theadDiv = tableEl.querySelector('thead th div, thead td div');
      const theadSpans = theadDiv ? Array.from(theadDiv.children) : [];
      const mountText  = theadSpans[0]?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      const orientText = theadSpans[1]?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

      const subY  = lineY + 4;
      const sub2  = subY + FONT + 4;   // y of second separator line

      txt(mountText,  r.x + P,          subY, FONT, SLATE500);
      txt(orientText, r.x + r.w - P,    subY, FONT, SLATE500, false, 'right');
      hline(r.x + 1, sub2, r.x + r.w - 1);

      // ── Column x-positions ────────────────────────────────────────────────
      const iw    = r.w - P * 2;
      const xLbl  = r.x + P;
      const xMdl  = r.x + P + 48;
      const xQty  = r.x + r.w - P - 110;
      const xDims = r.x + r.w - P;

      // ── Dynamic row heights ───────────────────────────────────────────────
      // Count rows first so we can divide available space evenly.
      const isInlineRow = (row: Element) => {
        const cells = row.querySelectorAll('td');
        return cells.length === 1 &&
               (cells[0] as HTMLElement).getAttribute('colspan') === '4';
      };
      const allRows   = Array.from(tableEl.querySelectorAll('tbody tr'));
      const nNormal   = allRows.filter(r => !isInlineRow(r)).length;
      const nInline   = allRows.filter(r =>  isInlineRow(r)).length;

      // Header section uses this much vertical space (hdrY … rowY)
      const HEADER_USED = sub2 + 8 - r.y;  // dynamic: measured from panel top
      const BOT_PAD     = P;
      const availForRows = r.h - HEADER_USED - BOT_PAD;

      // Inline (Mount/Player) row is proportionally smaller than a normal row
      const INLINE_RATIO  = 0.5;
      const totalUnits    = nNormal + nInline * INLINE_RATIO;
      const ROW_H         = totalUnits > 0
        ? Math.min(44, Math.max(20, Math.round(availForRows / totalUnits)))
        : 26;
      const ROW_H_INLINE  = Math.max(14, Math.round(ROW_H * INLINE_RATIO));

      const FS_ROW  = 10;
      const FS_DIMS = 9;

      let rowY = sub2 + 8;

      allRows.forEach((row, idx) => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (!cells.length) return;

        // ── Mount + Player inline row (single td colSpan=4) ────────────────
        if (isInlineRow(row)) {
          const halves = Array.from(cells[0].querySelectorAll(':scope > div > div'));
          const halfW  = iw / 2;
          // Vertically center text inside ROW_H_INLINE
          const tY = rowY + (ROW_H_INLINE - 9) / 2;

          halves.forEach((half, hi) => {
            const spans  = Array.from(half.querySelectorAll('span'));
            const cat    = spans[0]?.textContent?.trim() ?? '';
            const detail = spans[1]?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
            const qty    = spans[2]?.textContent?.trim() ?? '';
            const hx     = r.x + P + hi * halfW;
            const catW   = 28;

            ctx.font = `bold ${9 * s}px Arial, sans-serif`;
            ctx.fillStyle = SLATE900;
            ctx.fillText(cat, hx * s, tY * s);

            const detailMax = (halfW - catW - 26) * s;
            ctx.font = `${9 * s}px Arial, sans-serif`;
            ctx.fillStyle = SLATE600;
            ctx.fillText(truncate(ctx, detail, detailMax), (hx + catW) * s, tY * s);

            ctx.font = `${8.5 * s}px Arial, sans-serif`;
            ctx.fillStyle = SLATE500;
            ctx.textAlign = 'right';
            ctx.fillText(qty, (hx + halfW - 4) * s, tY * s);
            ctx.textAlign = 'left';
          });

          if (halves.length === 2) {
            vline(r.x + P + halfW, rowY, rowY + ROW_H_INLINE);
          }

          rowY += ROW_H_INLINE;
          if (idx < allRows.length - 1) hline(r.x + 1, rowY, r.x + r.w - 1);

        } else {
          // ── Normal row: [label] [model] [qty] [dims] ──────────────────────
          const vals = cells.map(c => c.textContent?.replace(/\s+/g, ' ').trim() ?? '');
          const isNiche = row.innerHTML.includes('blue-') ||
                          (vals[0] ?? '').toLowerCase() === 'niche';

          // Row background (slate-50 for screen, blue-50 for niche)
          const rowBg = isNiche ? '#eff6ff' : '#f8fafc';
          ctx.fillStyle = rowBg;
          ctx.fillRect((r.x + 1) * s, rowY * s, (r.w - 2) * s, ROW_H * s);

          const lblColor = isNiche ? BLUE900   : SLATE900;
          const mdlColor = isNiche ? '#1d4ed8' : SLATE900;
          const dimColor = isNiche ? '#3b82f6' : SLATE600;

          // Vertically centre text within the row
          const tY = rowY + (ROW_H - FS_ROW) / 2;

          // label (bold)
          ctx.font = `bold ${FS_ROW * s}px Arial, sans-serif`;
          ctx.fillStyle = lblColor;
          ctx.fillText(truncate(ctx, vals[0] ?? '', 42 * s), xLbl * s, tY * s);

          // model
          const mdlMax = (xQty - xMdl - 6) * s;
          ctx.font = `${FS_ROW * s}px Arial, sans-serif`;
          ctx.fillStyle = mdlColor;
          ctx.fillText(truncate(ctx, vals[1] ?? '', mdlMax), xMdl * s, tY * s);

          // qty – centred
          ctx.font = `bold ${FS_ROW * s}px Arial, sans-serif`;
          ctx.fillStyle = lblColor;
          ctx.textAlign = 'center';
          ctx.fillText(vals[2] ?? '', (xQty + 14) * s, tY * s);
          ctx.textAlign = 'left';

          // dims – right-aligned, slightly smaller font
          const dY = rowY + (ROW_H - FS_DIMS) / 2;
          ctx.font = `${FS_DIMS * s}px Arial, sans-serif`;
          ctx.fillStyle = dimColor;
          ctx.textAlign = 'right';
          ctx.fillText(vals[3] ?? '', xDims * s, dY * s);
          ctx.textAlign = 'left';

          rowY += ROW_H;
          if (idx < allRows.length - 1) hline(r.x + 1, rowY, r.x + r.w - 1);
        }
      });
    }
  }

  // ── Title block ───────────────────────────────────────────────────────────
  if (titleBlockEl) {
    const r    = titleR;       // use hardcoded position – not getBoundingClientRect
    panel(r.x, r.y, r.w, r.h);

    const FS   = 7.5;                          // font size (logical px)
    const textY = r.y + (r.h - FS) / 2;       // vertically centred (top-baseline)

    // ── left: company info ────────────────────────────────────────────────
    let lx = r.x + P;

    ctx.font = `bold ${FS * s}px Arial, sans-serif`;
    ctx.fillStyle = SLATE900;
    ctx.fillText('Signcast Media Inc.', lx * s, textY * s);
    lx += tw('Signcast Media Inc.', FS, true) + 4;

    ctx.font = `${FS * s}px Arial, sans-serif`;
    ctx.fillStyle = SLATE400;
    ctx.fillText(' | ', lx * s, textY * s);
    lx += tw(' | ', FS);

    ctx.fillStyle = SLATE600;
    ctx.fillText('+1 416-900-2233', lx * s, textY * s);
    lx += tw('+1 416-900-2233', FS) + 4;

    ctx.fillStyle = SLATE400;
    ctx.fillText(' | ', lx * s, textY * s);
    lx += tw(' | ', FS);

    ctx.fillStyle = SLATE600;
    ctx.fillText('361 Steelcase Rd W Unit 1, Markham, ON', lx * s, textY * s);

    // ── right: Date | DWG NO | REV ───────────────────────────────────────
    const monoEls = titleBlockEl.querySelectorAll('[class*="font-mono"]');
    const dateVal = monoEls[0]?.textContent?.trim() ?? '—';
    const dwgVal  = monoEls[1]?.textContent?.trim() ?? 'N/A';
    const revVal  = monoEls[2]?.textContent?.trim() ?? 'N/A';

    // Build segments and draw right-to-left so right edge is flush
    const segs = [
      { lbl: 'DATE:',   val: dateVal },
      { lbl: 'DWG NO:', val: dwgVal  },
      { lbl: 'REV:',    val: revVal  },
    ];

    let rx = r.x + r.w - P;
    [...segs].reverse().forEach((seg, ri) => {
      // separator (drawn right-to-left, so separator comes before each non-last item)
      if (ri > 0) {
        const sepW = tw('  |  ', FS);
        ctx.font = `${FS * s}px Arial, sans-serif`;
        ctx.fillStyle = SLATE400;
        ctx.textAlign = 'right';
        ctx.fillText('  |  ', rx * s, textY * s);
        ctx.textAlign = 'left';
        rx -= sepW;
      }

      // value
      const valW = tw(seg.val, FS);
      ctx.font = `${FS * s}px Arial, sans-serif`;
      ctx.fillStyle = SLATE600;
      ctx.textAlign = 'right';
      ctx.fillText(seg.val, rx * s, textY * s);
      ctx.textAlign = 'left';
      rx -= valW + 2;

      // label
      const lblW = tw(seg.lbl + ' ', FS, true);
      ctx.font = `bold ${FS * s}px Arial, sans-serif`;
      ctx.fillStyle = SLATE900;
      ctx.textAlign = 'right';
      ctx.fillText(seg.lbl + ' ', rx * s, textY * s);
      ctx.textAlign = 'left';
      rx -= lblW;
    });
  }

  ctx.restore();
}

// ─── public export ────────────────────────────────────────────────────────────

export const exportToPDF = async (title: string, canvasElement: HTMLElement) => {
  // Use the canvas element's layout size as the authoritative pixel dimensions.
  // Hardcode to 11" × 8.5" at 96 dpi (letter landscape) so these never drift
  // if offsetWidth returns a fractional or unexpected value on some setups.
  const W = 1056; // 11   in × 96 dpi
  const H = 816;  // 8.5  in × 96 dpi

  const svgEl = canvasElement.querySelector('svg') as SVGSVGElement | null;

  const canvasW = W * SCALE; // total canvas pixel width
  const canvasH = H * SCALE; // total canvas pixel height

  // ── Step 1 ── Rasterise the drawing SVG ──────────────────────────────────
  // Serialise at full canvas resolution (canvasW × canvasH) so the browser
  // rasterises it at the target size – ctx.drawImage then copies 1:1, with
  // no upscaling that could introduce horizontal distortion.
  let svgDataUrl: string | null = null;
  if (svgEl) {
    svgDataUrl = await svgToDataUrl(svgEl, canvasW, canvasH);
    svgEl.remove();
  }

  try {
    // ── Step 2 ── Build the final canvas ─────────────────────────────────
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width  = canvasW;
    finalCanvas.height = canvasH;
    const ctx = finalCanvas.getContext('2d')!;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Drawing SVG layer – copy at 1:1 (no scaling) since the SVG was already
    // serialised at canvasW × canvasH.
    if (svgDataUrl) {
      const svgImg = new Image();
      await new Promise<void>((res, rej) => {
        svgImg.onload = () => res();
        svgImg.onerror = rej;
        svgImg.src = svgDataUrl!;
      });
      ctx.drawImage(svgImg, 0, 0, canvasW, canvasH);
    }

    // Footer layer – logical px dimensions (W × H) are passed so relRect can
    // clamp panel coordinates to the canvas bounds.
    drawFooter(ctx, canvasElement, SCALE, W, H);

    // ── Step 3 ── Build PDF and save ─────────────────────────────────────
    const imgData = finalCanvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'letter' });
    pdf.addImage(imgData, 'PNG', 0, 0, 11, 8.5);

    const filename = `${title.replace(/\s+/g, '_')}_Drawing.pdf`;

    if ('showSaveFilePicker' in window) {
      try {
        const fh = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'PDF File', accept: { 'application/pdf': ['.pdf'] } }],
        });
        const writable = await fh.createWritable();
        await writable.write(pdf.output('blob'));
        await writable.close();
      } catch (err: any) {
        if (err.name === 'AbortError') return false; // user cancelled – no toast
        pdf.save(filename);
      }
    } else {
      pdf.save(filename);
    }

    return true;
  } finally {
    // Restore SVG back into the live DOM
    if (svgEl) canvasElement.insertAdjacentElement('afterbegin', svgEl);
  }
};
