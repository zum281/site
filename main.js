window.onload = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/serviceworker.js").catch((e) => {
      console.error("Error registering service worker, ", e);
    });
  } else {
    console.error("Service worker not supported in this browser.");
  }
};
