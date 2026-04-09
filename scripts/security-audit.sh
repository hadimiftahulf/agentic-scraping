#!/bin/bash

# Security Audit Script
# This script checks for common security issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "═══════════════════════════════════════════════════════"
echo "          SECURITY AUDIT REPORT"
echo "═══════════════════════════════════════════════════════"
echo ""

ISSUES=0

# 1. Check for hardcoded credentials
log_info "1. Checking for hardcoded credentials..."
CREDENTIALS=$(git grep -r "password\|secret\|cookie\|api_key" --include="*.ts" --include="*.js" --include="*.py" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=__pycache__ || true)

if [ -z "$CREDENTIALS" ]; then
    log_info "   ✓ No hardcoded credentials found"
else
    log_error "   ✗ Found potential credentials:"
    echo "$CREDENTIALS"
    ISSUES=$((ISSUES + 1))
fi

# 2. Check .gitignore
log_info "2. Checking .gitignore..."
GITIGNORE_MISSING=".env session/ images/ logs/screenshots/ node_modules/ dist/ .next/ __pycache__/"
MISSING_ENTRIES=""

for entry in $GITIGNORE_MISSING; do
    if ! grep -q "$entry" .gitignore; then
        MISSING_ENTRIES="$MISSING_ENTRIES $entry"
    fi
done

if [ -z "$MISSING_ENTRIES" ]; then
    log_info "   ✓ .gitignore is properly configured"
else
    log_error "   ✗ Missing entries in .gitignore:$MISSING_ENTRIES"
    ISSUES=$((ISSUES + 1))
fi

# 3. Check for exposed secrets
log_info "3. Checking for exposed secrets..."
if [ -f ".env" ]; then
    if grep -q ".env" .gitignore; then
        log_info "   ✓ .env is in .gitignore"
    else
        log_error "   ✗ .env not in .gitignore"
        ISSUES=$((ISSUES + 1))
    fi
else
    log_warn "   ⚠ No .env file found (expected for dev)"
fi

# 4. Check for SQL injection patterns
log_info "4. Checking for SQL injection patterns..."
SQL_INJECTION=$(grep -r "SELECT.*WHERE.*\+" --include="*.ts" --include="*.js" --exclude-dir=node_modules --exclude-dir=dist . || true)

if [ -z "$SQL_INJECTION" ]; then
    log_info "   ✓ No SQL injection patterns found"
else
    log_error "   ✗ Found potential SQL injection patterns:"
    echo "$SQL_INJECTION"
    ISSUES=$((ISSUES + 1))
fi

# 5. Check for plain text passwords in logs
log_info "5. Checking for plain text passwords in logs..."
PLAINTEXT_PASSWORDS=$(grep -r "password.*:" logs/ --include="*.log" 2>/dev/null || true)

if [ -z "$PLAINTEXT_PASSWORDS" ]; then
    log_info "   ✓ No plain text passwords in logs"
else
    log_error "   ✗ Found plain text passwords in logs:"
    echo "$PLAINTEXT_PASSWORDS"
    ISSUES=$((ISSUES + 1))
fi

# 6. Check session files
log_info "6. Checking session files..."
if [ -d "session/" ]; then
    for file in session/*; do
        if [ -f "$file" ]; then
            # Check if file is encrypted (should look like random data)
            CONTENT=$(head -c 100 "$file")
            if echo "$CONTENT" | grep -q '{"'; then
                log_error "   ✗ Session file appears to be plain JSON: $file"
                ISSUES=$((ISSUES + 1))
            else
                log_info "   ✓ Session file appears encrypted: $file"
            fi
        fi
    done
else
    log_warn "   ⚠ No session directory found"
fi

# 7. Check CORS configuration
log_info "7. Checking CORS configuration..."
CORS_CONFIG=$(grep -r "CORS" apps/api/src/ --include="*.ts" || true)

if [ -n "$CORS_CONFIG" ]; then
    log_info "   ✓ CORS configuration found"
else
    log_warn "   ⚠ No CORS configuration found"
fi

# 8. Check rate limiting
log_info "8. Checking rate limiting configuration..."
RATE_LIMIT=$(grep -r "rate.limit" apps/api/src/ --include="*.ts" || true)

if [ -n "$RATE_LIMIT" ]; then
    log_info "   ✓ Rate limiting configuration found"
else
    log_warn "   ⚠ No rate limiting configuration found"
fi

# 9. Check for exposed debug endpoints
log_info "9. Checking for exposed debug endpoints..."
DEBUG_ENDPOINTS=$(grep -r "app.use.*debug\|app.get.*debug" apps/api/src/ --include="*.ts" || true)

if [ -z "$DEBUG_ENDPOINTS" ]; then
    log_info "   ✓ No exposed debug endpoints found"
else
    log_error "   ✗ Found exposed debug endpoints:"
    echo "$DEBUG_ENDPOINTS"
    ISSUES=$((ISSUES + 1))
fi

# 10. Check dependencies for vulnerabilities
log_info "10. Checking dependencies (npm audit)..."
AUDIT_OUTPUT=$(npm audit --production --json 2>/dev/null || true)

if echo "$AUDIT_OUTPUT" | grep -q '"vulnerabilities": *[^0]'; then
    log_warn "   ⚠ Found vulnerabilities in dependencies"
    ISSUES=$((ISSUES + 1))
else
    log_info "   ✓ No vulnerabilities found"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "          AUDIT SUMMARY"
echo "═══════════════════════════════════════════════════════"
echo ""

if [ $ISSUES -eq 0 ]; then
    log_info "✓ No security issues found!"
    echo ""
    log_info "Recommendations:"
    echo "  - Keep dependencies updated"
    echo "  - Use strong SESSION_ENCRYPT_KEY"
    echo "  - Rotate Facebook session regularly"
    echo "  - Monitor logs for suspicious activity"
    exit 0
else
    log_error "✗ Found $ISSUES security issue(s)"
    echo ""
    log_info "Please address the issues above before deploying to production."
    exit 1
fi
