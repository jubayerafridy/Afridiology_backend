# Security deployment notes

## Authentication rate limits

Registration is limited to 5 requests per IP per hour, login to 10 per IP per
15 minutes, and refresh to 30 per IP per 15 minutes. The current
`express-rate-limit` memory store keeps counters in one Node.js process. It is
appropriate only as a per-process safeguard; multiple instances need a shared
store or equivalent rate limiting at the trusted edge.

Express proxy trust remains at its default (`false`). Do not enable trust for
all proxies or accept client-supplied `X-Forwarded-For`. If the service runs
behind a reverse proxy, configure Express to trust only the actual proxy
addresses or exact hop count after confirming the deployment topology, and
configure that proxy to replace forwarded client-IP headers. Otherwise all
traffic may appear to come from the proxy IP and share one quota.

## HTTPS and cookies

The refresh cookie is marked `Secure` when `NODE_ENV=production`. Terminate TLS
at the trusted ingress and ensure the public API is served only over HTTPS.
Cookie security must not depend on trusting arbitrary forwarded protocol
headers.

## Security headers and CORS

Helmet applies its API-relevant defaults. Content Security Policy is disabled
because this process serves API responses and not frontend HTML or scripts.
CORS continues to allow only the origins configured in `src/app.ts`; update
that allowlist deliberately when frontend origins change. CORS does not replace
authentication, authorization, or CSRF controls.
