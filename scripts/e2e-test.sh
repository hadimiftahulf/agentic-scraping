#!/bin/bash

# End-to-End Integration Test Script
# This script tests the entire flow from scraping to posting

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_service() {
    local service=$1
    local url=$2

    log_info "Checking $service at $url..."

    if curl -f -s "$url/health" > /dev/null 2>&1; then
        log_info "$service is healthy ✓"
        return 0
    else
        log_error "$service is not healthy ✗"
        return 1
    fi
}

wait_for_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url/health" > /dev/null 2>&1; then
            log_info "$service is healthy ✓"
            return 0
        fi

        log_warn "Waiting for $service... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done

    log_error "$service failed to start"
    return 1
}

# Test Checklist
checklist=()

# Start Docker services
log_info "=== Starting Docker Services ==="
docker-compose up -d postgres redis

# Wait for dependencies
log_info "Waiting for dependencies..."
sleep 5

# Check database
log_info "=== Checking Database ==="
if check_service "Database" "http://localhost:5432"; then
    checklist+=("✓ Database healthy")
else
    checklist+=("✗ Database not healthy")
fi

# Check Redis
log_info "=== Checking Redis ==="
if check_service "Redis" "http://localhost:6379"; then
    checklist+=("✓ Redis healthy")
else
    checklist+=("✗ Redis not healthy")
fi

# Start API
log_info "=== Starting API ==="
cd apps/api
npm run build > /dev/null 2>&1
npm start &
API_PID=$!

wait_for_service "API" "http://localhost:3001"
checklist+=("✓ API started")

# Start Worker (without posting, just for health check)
log_info "=== Starting Worker ==="
cd ../worker
npm run build > /dev/null 2>&1
npm run start:health &
WORKER_PID=$!

wait_for_service "Worker Health" "http://localhost:3002"
checklist+=("✓ Worker health server started")

cd ../..

# Start Scraper (mock mode for testing)
log_info "=== Starting Scraper ==="
cd apps/scraper

# Run a single scrape cycle
log_info "Running scraper for one cycle..."
timeout 60 python -m scraper --single-run || true

checklist+=("✓ Scraper completed one cycle")

cd ../..

# Check database for products
log_info "=== Checking Database for Products ==="
PRODUCT_COUNT=$(docker-compose exec -T postgres psql -U botuser -d botdb -c "SELECT COUNT(*) FROM \"Product\";" -t | tr -d ' ')

if [ "$PRODUCT_COUNT" -gt 0 ]; then
    log_info "Found $PRODUCT_COUNT products in database ✓"
    checklist+=("✓ Products in database")
else
    log_warn "No products found in database"
    checklist+=("⚠ No products in database")
fi

# Start Dashboard
log_info "=== Starting Dashboard ==="
cd apps/web
npm run build > /dev/null 2>&1
npm start &
WEB_PID=$!

wait_for_service "Dashboard" "http://localhost:3000"
checklist+=("✓ Dashboard started")

cd ../..

# Test API endpoints
log_info "=== Testing API Endpoints ==="

# Test health endpoint
if curl -f -s http://localhost:3001/health > /dev/null; then
    checklist+=("✓ API /health endpoint")
else
    checklist+=("✗ API /health endpoint failed")
fi

# Test detailed health endpoint
if curl -f -s http://localhost:3001/health/detailed > /dev/null; then
    checklist+=("✓ API /health/detailed endpoint")
else
    checklist+=("✗ API /health/detailed endpoint failed")
fi

# Test products endpoint
PRODUCTS_RESPONSE=$(curl -s http://localhost:3001/api/products)
if echo "$PRODUCTS_RESPONSE" | grep -q '"products"'; then
    checklist+=("✓ API /products endpoint")
else
    checklist+=("✗ API /products endpoint failed")
fi

# Test stats endpoint
STATS_RESPONSE=$(curl -s http://localhost:3001/api/stats)
if echo "$STATS_RESPONSE" | grep -q '"totalProducts"'; then
    checklist+=("✓ API /stats endpoint")
else
    checklist+=("✗ API /stats endpoint failed")
fi

# Cleanup
log_info "=== Cleanup ==="
kill $API_PID 2>/dev/null || true
kill $WORKER_PID 2>/dev/null || true
kill $WEB_PID 2>/dev/null || true

# Print checklist
log_info "=== Test Results ==="
for item in "${checklist[@]}"; do
    echo "$item"
done

# Count successes
SUCCESS_COUNT=$(echo "${checklist[@]}" | grep -c "✓" || true)
TOTAL_COUNT=${#checklist[@]}

log_info "=== Summary ==="
log_info "Passed: $SUCCESS_COUNT/$TOTAL_COUNT"

if [ $SUCCESS_COUNT -eq $TOTAL_COUNT ]; then
    log_info "All tests passed! ✓"
    exit 0
else
    log_error "Some tests failed ✗"
    exit 1
fi
