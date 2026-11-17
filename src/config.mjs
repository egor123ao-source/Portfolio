// Vercel provides hostnames without a protocol. Prefer the stable production
// domain so preview URLs never become canonical URLs for indexed pages.
export function resolveSiteOrigin(env = process.env) {
  const customOrigin = env.SITE_URL?.trim();
  const vercelHost = env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || env.VERCEL_URL?.trim();
  const raw = customOrigin || (vercelHost ? `https://${vercelHost}` : 'http://localhost:4173');
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('SITE_URL must be a complete http:// or https:// site address.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must contain only the site origin, without a path, query, hash, or credentials.');
  }
  return url.origin;
}

export function allowIndexing(env, origin) {
  const hostname = new URL(origin).hostname;
  return env.VERCEL_ENV !== 'preview' && env.VERCEL_ENV !== 'development' &&
    !['localhost', '127.0.0.1', '[::1]'].includes(hostname);
}
