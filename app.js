document.getElementById("testButton").addEventListener("click", () => {
  document.getElementById("message").innerText = "The app is working.";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js");

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