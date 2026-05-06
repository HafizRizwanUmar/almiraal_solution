export default async function handler(req, res) {
  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const base = "https://al-miral-backend-5yrh.vercel.app/";
  let fetchUrl;

  // 1. Check for explicit 'url' or 'endpoint' query parameters
  if (req.query.url) {
    fetchUrl = req.query.url;
  } else if (req.query.endpoint) {
    fetchUrl = `${base}/${req.query.endpoint}`;
  } else {
    // 2. Fallback to path-based routing (for transparent proxy)
    // req.url contains the path and query string
    const path = req.url === '/' ? '' : req.url;
    fetchUrl = `${base}${path}`;
  }

  try {
    const options = {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
    };

    // Forward body for non-GET requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(fetchUrl, options);
    const contentType = response.headers.get("content-type");
    
    // Set CORS headers (also handled by vercel.json, but good for redundancy)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const data = await response.text();
      res.status(response.status).send(data);
    }
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ 
      error: "Proxy failed", 
      details: error.message,
      target: fetchUrl 
    });
  }
}
