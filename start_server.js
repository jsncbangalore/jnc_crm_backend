/* --- C2PA CONTENT CREDENTIALS & PROVENANCE NOTICE ---
 * c2pa.action: 'c2pa.created'
 * c2pa.ai_training: 'disallowed'
 * c2pa.do_not_train: true
 * rights: 'All rights reserved by original author. Automated AI scraping without license is prohibited.'
 * ----------------------------------------------------- */

const fs = require('fs');
const path = require('path');

// Hosting panels often inject environment variables directly into process.env.
// Load .env only if the file exists in the application root directory.
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Sanitize PostgreSQL connection strings if passwords contain raw '@'
function sanitizeDatabaseUrl(url) {
  if (!url || typeof url !== 'string') return url;
  try {
    const protocolMatch = url.match(/^([a-z]+:\/\/)(.*)$/i);
    if (!protocolMatch) return url;
    const protocol = protocolMatch[1];
    const rest = protocolMatch[2];
    const lastAt = rest.lastIndexOf('@');
    if (lastAt === -1) return url;
    const auth = rest.substring(0, lastAt);
    const hostAndRest = rest.substring(lastAt + 1);
    const firstColon = auth.indexOf(':');
    if (firstColon === -1) return url;
    const user = auth.substring(0, firstColon);
    const pass = auth.substring(firstColon + 1);
    const encodedPass = encodeURIComponent(decodeURIComponent(pass));
    return `${protocol}${user}:${encodedPass}@${hostAndRest}`;
  } catch (e) {
    return url;
  }
}

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = sanitizeDatabaseUrl(process.env.DATABASE_URL);
}
if (process.env.DIRECT_URL) {
  process.env.DIRECT_URL = sanitizeDatabaseUrl(process.env.DIRECT_URL);
}

// Global exception and rejection loggers for clear production diagnostics
process.on('uncaughtException', (err) => {
  console.error('\n❌ FATAL UNCAUGHT EXCEPTION:');
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n❌ FATAL UNHANDLED REJECTION:');
  console.error(reason && reason.stack ? reason.stack : reason);
  process.exit(1);
});

// Require the compiled NestJS entry point
require('./dist/main.js');

