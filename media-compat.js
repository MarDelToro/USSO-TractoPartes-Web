(function () {
  "use strict";

  const convertedUrls = new Map();
  const pendingUrls = new Map();
  let decoderPromise = null;
  const isHeicUrl = (value) => /\.(heic|heif)(?:[?#]|$)/i.test(String(value || ""));

  function loadHeicDecoder() {
    if (typeof window.heic2any === "function") return Promise.resolve(window.heic2any);
    if (decoderPromise) return decoderPromise;

    decoderPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
      script.async = true;
      script.onload = () => typeof window.heic2any === "function"
        ? resolve(window.heic2any)
        : reject(new Error("El convertidor HEIC no está disponible."));
      script.onerror = () => reject(new Error("No se pudo cargar el convertidor HEIC."));
      document.head.appendChild(script);
    });

    return decoderPromise;
  }

  async function convertHeicUrl(source) {
    if (convertedUrls.has(source)) return convertedUrls.get(source);
    if (pendingUrls.has(source)) return pendingUrls.get(source);

    const pending = (async () => {
      const heic2any = await loadHeicDecoder();
      const response = await fetch(source, { mode: "cors", cache: "force-cache" });
      if (!response.ok) throw new Error(`No se pudo descargar la imagen (${response.status}).`);
      const sourceBlob = await response.blob();
      const result = await heic2any({ blob: sourceBlob, toType: "image/jpeg", quality: 0.9 });
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
