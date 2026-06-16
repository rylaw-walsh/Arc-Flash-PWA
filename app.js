const fileInput = document.getElementById("pdfFileInput");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");
const pageIndicator = document.getElementById("pageIndicator");
const message = document.getElementById("message");
const status = document.getElementById("status");
const canvasWrapper = document.getElementById("canvasWrapper");
const readerControls = document.getElementById("readerControls");
const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;

function showMessage(text, isError = false) {
  message.innerText = text;
  message.className = isError ? "message error" : "message";
}

function updateControls() {
  if (!pdfDoc) return;
  pageIndicator.innerText = `Page ${currentPage} / ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
  readerControls.classList.remove("hidden");
  canvasWrapper.classList.remove("hidden");
}

async function renderPage(pageNumber) {
  if (!pdfDoc) return;

  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const desiredWidth = Math.min(viewport.width, window.innerWidth - 48);
  const scale = desiredWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale });

  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  const renderContext = {
    canvasContext: ctx,
    viewport: scaledViewport,
  };

  await page.render(renderContext).promise;
  currentPage = pageNumber;
  updateControls();
  showMessage("Swipe or use the buttons to move through the book.");
}

async function loadPDF(arrayBuffer) {
  if (!arrayBuffer) return;

  try {
    pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    totalPages = pdfDoc.numPages;
    currentPage = 1;
    status.innerText = "PDF loaded successfully.";
    await renderPage(currentPage);
  } catch (error) {
    showMessage("Unable to load the PDF. Please try another file.", true);
    console.error(error);
  }
}

fileInput.addEventListener("change", event => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.type !== "application/pdf") {
    showMessage("Please select a valid PDF file.", true);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => loadPDF(reader.result);
  reader.readAsArrayBuffer(file);
  status.innerText = "Loading PDF...";
  showMessage("");
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    renderPage(currentPage - 1);
  }
});

nextBtn.addEventListener("click", () => {
  if (currentPage < totalPages) {
    renderPage(currentPage + 1);
  }
});

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.15.349/build/pdf.worker.min.js";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js");

      status.innerText = "Service worker registered successfully.";
      console.log("Service worker registered:", registration);
    } catch (error) {
      status.innerText = "Service worker registration failed. Check the Console.";
      console.error("Service worker registration failed:", error);
    }
  });
} else {
  status.innerText = "Service workers are not supported in this browser.";
}
