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

module.exports = { parseMultipart, bufferIndexOf };
