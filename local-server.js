const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Load .env variables
if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.join('=').trim();
    }
  });
}

const PORT = 5000;

// MIME types for static file serving
const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
};

// Directories in frontend/public_html that hold static assets
const STATIC_DIRS = [
  'SerumBottles', 'PerfumeCaps', 'PumpsandCollars', 'DiffuserBottles',
  'CreamJars', 'TestersBottle', 'bottle', 'bottles', 'Banner',
  'perfumepackging', 'glasspackaging', 'productIcon', 'decoration', 'svgs',
  'uploads'
];

const FRONTEND_PUBLIC = path.join(__dirname, 'frontend', 'public_html');
const UPLOADS_DIR = path.join(FRONTEND_PUBLIC, 'uploads');

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function serveStaticFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.statusCode = 200;
    fs.createReadStream(filePath).pipe(res);
    return true;
  }
  return false;
}

/**
 * Parse multipart/form-data from a Buffer.
 * Handles both text fields and binary file uploads.
 * Returns: { fields: {name: value}, files: {name: {filename, data, contentType}} }
 */
function parseMultipart(buffer, boundary) {
  const fields = {};
  const files = {};
  const boundaryBuf = Buffer.from('--' + boundary);
  const CRLF = Buffer.from('\r\n');
  const CRLFCRLF = Buffer.from('\r\n\r\n');

  let pos = 0;

  while (pos < buffer.length) {
    // Find next boundary
    const boundaryPos = bufferIndexOf(buffer, boundaryBuf, pos);
    if (boundaryPos === -1) break;

    pos = boundaryPos + boundaryBuf.length;

    // Check for final boundary (--)
    if (buffer[pos] === 45 && buffer[pos + 1] === 45) break; // '--'

    // Skip CRLF after boundary
    if (buffer[pos] === 13 && buffer[pos + 1] === 10) pos += 2;

    // Find end of headers (double CRLF)
    const headerEnd = bufferIndexOf(buffer, CRLFCRLF, pos);
    if (headerEnd === -1) break;

    const headerStr = buffer.slice(pos, headerEnd).toString('utf8');
    pos = headerEnd + 4; // skip \r\n\r\n

    // Find start of next boundary to get end of this part's data
    const nextBoundary = bufferIndexOf(buffer, Buffer.from('\r\n--' + boundary), pos);
    const dataEnd = nextBoundary === -1 ? buffer.length : nextBoundary;

    const partData = buffer.slice(pos, dataEnd);
    pos = dataEnd;

    // Parse Content-Disposition header
    const dispMatch = headerStr.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i);
    if (!dispMatch) continue;

    const fieldName = dispMatch[1];
    const filename = dispMatch[2];

    if (filename !== undefined) {
      // It's a file upload
      const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
      const contentType = ctMatch ? ctMatch[1].trim() : 'application/octet-stream';
      if (partData.length > 0) {
        files[fieldName] = { filename, data: partData, contentType };
      }
    } else {
      // It's a text field
      fields[fieldName] = partData.toString('utf8');
    }
  }

  return { fields, files };
}

function bufferIndexOf(haystack, needle, start = 0) {
  for (let i = start; i <= haystack.length - needle.length; i++) {
    let found = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) { found = false; break; }
    }
    if (found) return i;
  }
  return -1;
}

/**
 * Save an uploaded file to the uploads directory.
 * Returns the public URL path: /uploads/filename.ext
 */
function saveUploadedFile(file) {
  const ext = path.extname(file.filename).toLowerCase() || '.bin';
  const uniqueName = crypto.randomBytes(8).toString('hex') + ext;
  const filePath = path.join(UPLOADS_DIR, uniqueName);
  fs.writeFileSync(filePath, file.data);
  return '/uploads/' + uniqueName;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  req.query = parsedUrl.query;

  // --- Serve static image/media files from frontend/public_html ---
  const firstSegment = pathname.split('/')[1];
  const ext = path.extname(pathname).toLowerCase();
  if (STATIC_DIRS.includes(firstSegment) || (ext && MIME_TYPES[ext])) {
    const filePath = path.join(FRONTEND_PUBLIC, pathname);
    if (serveStaticFile(filePath, res)) return;
  }

  // Simple routing logic
  let apiPath = '';
  if (pathname === '/' || pathname === '') {
    apiPath = './api/index.js';
  } else if (pathname === '/items') {
    apiPath = './api/items.js';
  } else if (pathname === '/add-item' || pathname === '/api/products/add-product') {
    apiPath = './api/add-item.js';
  } else if (/^\/items\/[^/]+$/.test(pathname)) {
    // /items/:id — product detail (GET) or delete (DELETE)
    req.query = { ...req.query, id: pathname.split('/')[2] };
    if (req.method === 'DELETE') {
      apiPath = './api/items/delete.js';
    } else {
      apiPath = './api/items/[id].js';
    }
  } else if (/^\/api\/products\/update-product\/[^/]+$/.test(pathname)) {
    // /api/products/update-product/:id
    req.query = { ...req.query, id: pathname.split('/').pop() };
    apiPath = './api/products/update-product.js';
  } else if (/^\/api\/products\/product\/[^/]+$/.test(pathname)) {
    // /api/products/product/:id — dashboard DELETE
    req.query = { ...req.query, id: pathname.split('/').pop() };
    apiPath = './api/items/delete.js';
  } else if (pathname.startsWith('/api/auth/')) {
    apiPath = './api/auth/' + pathname.split('/').pop() + '.js';
  } else if (pathname.startsWith('/api/')) {
    apiPath = '.' + pathname + '.js';
  } else if (pathname === '/sendemail' || pathname === '/api/products/send-mail' || pathname === '/api/products/send-mail-connect') {
    apiPath = './api/sendemail.js';
  }

  if (apiPath && fs.existsSync(apiPath)) {
    try {
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${pathname} -> ${apiPath}`);

      delete require.cache[require.resolve(apiPath)];
      const handler = require(apiPath);

      if (typeof handler === 'function') {
        const mockRes = {
          status: (code) => { res.statusCode = code; return mockRes; },
          json: (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.end(JSON.stringify(data));
            return mockRes;
          },
          setHeader: (name, value) => { res.setHeader(name, value); return mockRes; },
          end: (data) => { res.end(data); return mockRes; }
        };

        // Handle CORS Preflight
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'POST' || req.method === 'PUT') {
          const chunks = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', async () => {
            try {
              const bodyBuffer = Buffer.concat(chunks);
              const contentType = req.headers['content-type'] || '';

              if (contentType.includes('multipart/form-data')) {
                // Proper binary multipart parsing
                const boundaryMatch = contentType.match(/boundary=(.+)$/);
                const boundary = boundaryMatch ? boundaryMatch[1].trim() : '';

                if (boundary) {
                  const { fields, files } = parseMultipart(bodyBuffer, boundary);

                  // Convert uploaded files to base64 data URLs so API handlers
                  // can upload them to Cloudinary (same flow as Vercel production).
                  const base64Fields = {};
                  for (const [fieldName, file] of Object.entries(files)) {
                    if (file.data && file.data.length > 0) {
                      base64Fields[fieldName] = `data:${file.contentType};base64,${file.data.toString('base64')}`;
                      console.log(`Converted upload to base64: ${fieldName} (${file.data.length} bytes)`);
                    }
                  }

                  req.body = { ...fields, ...base64Fields };
                  console.log('Parsed multipart fields:', Object.keys(req.body));
                } else {
                  req.body = {};
                }
              } else if (contentType.includes('application/json')) {
                req.body = JSON.parse(bodyBuffer.toString('utf8'));
              } else {
                req.body = bodyBuffer.toString('utf8');
              }

              await handler(req, mockRes);
            } catch (e) {
              console.error('Body parse error:', e.message);
              req.body = {};
              await handler(req, mockRes);
            }
          });
        } else {
          await handler(req, mockRes);
        }
      }
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error', details: err.message }));
    }
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not Found', path: pathname }));
  }
});

server.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Routes: /, /items, /add-item, /api/auth/login, etc.`);
  console.log(`Uploads saved to: frontend/public_html/uploads/`);
  console.log(`Static images served from: frontend/public_html`);
});
