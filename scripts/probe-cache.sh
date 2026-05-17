#!/usr/bin/env bash
# Usage: ./scripts/probe-cache.sh https://your-deploy.netlify.app
# Probes the homepage multiple times and reports cache-related headers + timing.

BASE_URL="${1:-https://your-deploy.netlify.app}"
ROUTE="${2:-/}"

CACHE_HEADERS=(
  "x-astro-cache"
  "cache-control"
  "cdn-cache-control"
  "netlify-cdn-cache-control"
  "age"
  "etag"
  "x-cache"
  "x-nf-request-id"
)

FILTER=$(IFS="|"; echo "${CACHE_HEADERS[*]}")

probe() {
  local label="$1"
  local url="$BASE_URL$ROUTE"
  local headers_file body_file time_total

  headers_file=$(mktemp)
  body_file=$(mktemp)

  echo ""
  echo "──────────────────────────────"
  echo "  $label  →  $url"
  echo "──────────────────────────────"

  time_total=$(curl -sS -D "$headers_file" -o "$body_file" -w "%{time_total}" "$url")

  grep -iE "^HTTP/|^($FILTER):" "$headers_file" | sed 's/^/  /'
  echo "  ⏱  time_total=${time_total}s"
  echo ""
  echo "  body (first 500 chars):"
  head -c 500 "$body_file" | sed 's/^/    /'
  echo ""

  rm -f "$headers_file" "$body_file"
}

echo ""
echo "=== Cache Probe: $BASE_URL$ROUTE ==="

probe "Request 1 (MISS expected)"
sleep 0.5
probe "Request 2 (HIT expected within staleTime)"
sleep 0.5
probe "Request 3 (HIT or STALE)"
sleep 2
probe "Request 4 (STALE/revalidate - after staleTime window)"

echo ""
echo "=== Legend ==="
echo "  x-astro-cache: MISS  → rendered fresh, stored in cache"
echo "  x-astro-cache: HIT   → served from cache (fastest)"
echo "  x-astro-cache: STALE → served stale while revalidating in background"
echo "  age: N               → seconds since entry was cached"
echo "  cdn-cache-control    → what Netlify CDN sees (maxAge + stale-while-revalidate)"
echo ""
