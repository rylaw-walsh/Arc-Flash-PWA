const PDF_PATH = './pdfs/arc-flash-guide.pdf';
const ZOOM_STEP = 0.2;
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 2.4;
const SWIPE_THRESHOLD = 56;
const MAX_VERTICAL_DELTA = 60;

const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const pageIndicator = document.getElementById('pageIndicator');
const zoomIndicator = document.getElementById('zoomIndicator');
const statusLabel = document.getElementById('status');
const canvasWrapper = document.getElementById('canvasWrapper');
const canvas = document.getElementById('pdfCanvas');
const ctx = canvas.getContext('2d');

let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let zoomLevel = 1.0;
let touchStartX = 0;
let touchStartY = 0;
let isSwipeActive = false;

if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3/build/pdf.worker.min.js';
}

function updateStatus(text) {
  statusLabel.textContent = text;
}

function updateControls() {
  pageIndicator.textContent = `Page ${currentPage} / ${totalPages}`;
  zoomIndicator.textContent = `${Math.round(zoomLevel * 100)}%`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
  zoomOutBtn.disabled = zoomLevel <= MIN_ZOOM;
  zoomInBtn.disabled = zoomLevel >= MAX_ZOOM;
}

function setCanvasSize(viewport) {
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
}

async function renderPage(pageNumber) {
  if (!pdfDoc) return;

  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const wrapperWidth = canvasWrapper.clientWidth;
  const baseScale = Math.max((wrapperWidth - 16) / viewport.width, 0.6);
  const finalScale = baseScale * zoomLevel;
  const scaledViewport = page.getViewport({ scale: finalScale });

  setCanvasSize(scaledViewport);

  const renderContext = {
    canvasContext: ctx,
    viewport: scaledViewport,
  };

  await page.render(renderContext).promise;
  currentPage = pageNumber;
  updateControls();
  updateStatus('Swipe left or right, or use the buttons to change pages.');
}

async function loadPdfDocument() {
  updateStatus('Loading the book...');

  if (typeof pdfjsLib === 'undefined') {
    updateStatus('PDF.js library failed to load. Check your network connection.');
    return;
  }

  try {
    pdfDoc = await pdfjsLib.getDocument(PDF_PATH).promise;
    totalPages = pdfDoc.numPages;
    currentPage = 1;
    await renderPage(currentPage);
  } catch (error) {
    updateStatus('Unable to load the book. Check the PDF path.');
    console.error(error);
  }
}

function changePage(delta) {
  const next = currentPage + delta;
  if (next >= 1 && next <= totalPages) {
    renderPage(next);
  }
}

function changeZoom(delta) {
  zoomLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomLevel + delta));
  renderPage(currentPage);
}

prevBtn.addEventListener('click', () => changePage(-1));
nextBtn.addEventListener('click', () => changePage(1));
zoomOutBtn.addEventListener('click', () => changeZoom(-ZOOM_STEP));
zoomInBtn.addEventListener('click', () => changeZoom(ZOOM_STEP));

canvasWrapper.addEventListener('touchstart', event => {
  if (event.touches.length !== 1) return;
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
  isSwipeActive = true;
});

canvasWrapper.addEventListener('touchmove', event => {
  if (!isSwipeActive || event.touches.length !== 1) return;

  const touch = event.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
    event.preventDefault();
  }
});

canvasWrapper.addEventListener('touchend', event => {
  if (!isSwipeActive) return;
  isSwipeActive = false;

  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaY) > MAX_VERTICAL_DELTA) {
    return;
  }

  if (deltaX < 0) {
    changePage(1);
  } else if (deltaX > 0) {
    changePage(-1);
  }
});

window.addEventListener('resize', () => {
  if (pdfDoc) {
    renderPage(currentPage);
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./service-worker.js');
      console.log('Service worker registered.');
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  });
}

loadPdfDocument();
