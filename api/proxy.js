export default async function handler(req, res) {
  const endpoint = req.query.endpoint;

  // If no endpoint is provided, you could fall back to the generic url query or return an error
  if (!endpoint && !req.query.url) {
    return res.status(400).json({ error: "Endpoint or URL is required" });
  }

  try {
    let fetchUrl = req.query.url;
    
    // Use the bonus feature if endpoint is provided
    if (endpoint) {
      const base = "https://al-mirals-backend.vercel.app";
      fetchUrl = `${base}/${endpoint}`;
    }

    const response = await fetch(fetchUrl);
    
    // Use .json() if we know it's json, otherwise .text()
    // To be safe and support both approaches, we can check the content type
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(200).json(data);
    } else {
      data = await response.text();
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(200).send(data);
    }
  } catch (error) {
    res.status(500).json({ error: "Proxy failed", details: error.message });
  }
}
