exports.handler = async function (event) {
  var apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'La conexión con YouTube todavía no está configurada.' })
    };
  }

  var ids = String((event.queryStringParameters || {}).ids || '')
    .split(',')
    .map(function (id) { return id.trim(); })
    .filter(function (id) { return /^[A-Za-z0-9_-]{11}$/.test(id); })
    .slice(0, 50);

  if (!ids.length) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'No se recibieron videos válidos.' })
    };
  }

  try {
    var params = new URLSearchParams({ part: 'statistics', id: ids.join(','), key: apiKey });
    var response = await fetch('https://www.googleapis.com/youtube/v3/videos?' + params.toString());
    var payload = await response.json();
    if (!response.ok) throw new Error((payload.error && payload.error.message) || 'YouTube no respondió correctamente.');

    var views = {};
    (payload.items || []).forEach(function (item) {
      views[item.id] = Number(item.statistics && item.statistics.viewCount || 0);
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=900, s-maxage=1800'
      },
      body: JSON.stringify({ views: views })
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
