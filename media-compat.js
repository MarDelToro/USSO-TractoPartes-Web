(function () {
  "use strict";

  const convertedUrls = new Map();
  const pendingUrls = new Map();
  const isHeicUrl = (value) => /\.(heic|heif)(?:[?#]|$)/i.test(String(value || ""));

  async function convertHeicUrl(source) {
    if (convertedUrls.has(source)) return convertedUrls.get(source);
    if (pendingUrls.has(source)) return pendingUrls.get(source);

    const pending = (async () => {
      if (typeof window.heic2any !== "function") throw new Error("El convertidor HEIC no está disponible.");
      const response = await fetch(source, { mode: "cors", cache: "force-cache" });
      if (!response.ok) throw new Error(`No se pudo descargar la imagen (${response.status}).`);
      const sourceBlob = await response.blob();
      const result = await window.heic2any({ blob: sourceBlob, toType: "image/jpeg", quality: 0.9 });
      const jpegBlob = Array.isArray(result) ? result[0] : result;
      const objectUrl = URL.createObjectURL(jpegBlob);
      convertedUrls.set(source, objectUrl);
      return objectUrl;
    })();

    pendingUrls.set(source, pending);
    try {
      return await pending;
    } finally {
      pendingUrls.delete(source);
    }
  }

  async function makeCompatible(image) {
    if (!(image instanceof HTMLImageElement)) return;
    const source = image.currentSrc || image.getAttribute("src") || "";
    if (!isHeicUrl(source) || image.dataset.heicConverting === source) return;

    image.dataset.heicConverting = source;
    try {
      image.src = await convertHeicUrl(source);
      image.dataset.heicSource = source;
      image.classList.add("heic-compatible");
    } catch (error) {
      console.warn("USSO: no se pudo convertir la imagen HEIC", source, error);
      image.dataset.heicError = "true";
    } finally {
      delete image.dataset.heicConverting;
    }
  }

  function scan(root = document) {
    if (root instanceof HTMLImageElement) makeCompatible(root);
    root.querySelectorAll?.("img").forEach(makeCompatible);
  }

  function start() {
    scan();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") scan(mutation.target);
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) scan(node);
        });
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"]
    });
  }

  window.ussoRefreshMedia = () => scan();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
