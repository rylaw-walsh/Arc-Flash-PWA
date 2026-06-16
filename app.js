const REPO_NAME = "Arc-Flash-PWA";

document.getElementById("testButton").addEventListener("click", () => {
  document.getElementById("message").innerText = "The app is working.";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const serviceWorkerPath = isLocalhost
      ? "./service-worker.js"
      : `/${REPO_NAME}/service-worker.js`;

    try {
      const registration = await navigator.serviceWorker.register(serviceWorkerPath);

      document.getElementById("status").innerText =
        "Service worker registered successfully.";

      console.log("Service worker registered:", registration);
    } catch (error) {
      document.getElementById("status").innerText =
        "Service worker registration failed. Check the Console.";

      console.error("Service worker registration failed:", error);
    }
  });
} else {
  document.getElementById("status").innerText =
    "Service workers are not supported in this browser.";
}