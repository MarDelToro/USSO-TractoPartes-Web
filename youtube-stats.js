(function () {
  var CACHE_KEY = 'usso_youtube_views_v1';
  var CACHE_TIME = 30 * 60 * 1000;

  function readCache() {
    try {
      var cached = JSON.parse(window.localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.savedAt && Date.now() - cached.savedAt < CACHE_TIME) return cached.views || {};
    } catch (error) {}
    return null;
  }

  function saveCache(views) {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), views: views }));
    } catch (error) {}
  }

  async function getViews(videoIds) {
    var cached = readCache();
    if (cached) return cached;

    var ids = Array.from(new Set((videoIds || []).filter(Boolean)));
    if (!ids.length) return {};

    var params = new URLSearchParams({ ids: ids.join(',') });
    var response = await fetch('/.netlify/functions/youtube-stats?' + params.toString());
    if (!response.ok) throw new Error('No se pudieron consultar las visualizaciones de YouTube.');

    var payload = await response.json();
    var views = {};
    Object.keys(payload.views || {}).forEach(function (id) { views[id] = Number(payload.views[id] || 0); });
    saveCache(views);
    return views;
  }

  function formatViews(value) {
    if (!Number.isFinite(Number(value))) return 'Consultando visualizaciones…';
    return Number(value).toLocaleString('es-MX') + ' visualizaciones';
  }

  window.USSOYouTubeStats = { getViews: getViews, formatViews: formatViews };
})();
