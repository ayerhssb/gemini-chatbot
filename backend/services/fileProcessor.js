// services/fileProcessor.js
// Extract text content from uploaded PDFs and TXT files.
//
// pdfjs-dist v4 is ESM-only, so we use a dynamic import() inside the function.
// We use the "legacy" build because we're running on plain Node without DOM.

let pdfjsLibPromise = null;

function getPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLibPromise;
}

async function extractPdfText(buffer) {
  const pdfjs = await getPdfjs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it) => ('str' in it ? it.str : ''))
      .join(' ');
    pages.push(pageText);
  }
  return pages.join('\n\n').trim();
}

/**
 * Extract text from a buffer based on mimetype.
 * Returns { text, name } or throws on unsupported type.
 */
async function extractText(buffer, mimetype, originalName) {
  const lowerName = (originalName || '').toLowerCase();

  if (mimetype === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const text = await extractPdfText(buffer);
    return { text, name: originalName };
  }

  if (mimetype === 'text/plain' || lowerName.endsWith('.txt')) {
    return { text: buffer.toString('utf-8').trim(), name: originalName };
  }

  throw new Error(`Unsupported document type: ${mimetype}. Only PDF and TXT are allowed.`);
}

/**
 * Validate that the uploaded image is PNG/JPG and prepare it as base64
 * for the Gemini API (which expects inlineData parts).
 */
function processImage(buffer, mimetype, originalName) {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowed.includes(mimetype)) {
    throw new Error(`Unsupported image type: ${mimetype}. Only PNG and JPG are allowed.`);
  }
  return {
    mimeType: mimetype === 'image/jpg' ? 'image/jpeg' : mimetype,
    data: buffer.toString('base64'),
    name: originalName,
  };
}

module.exports = { extractText, processImage };
