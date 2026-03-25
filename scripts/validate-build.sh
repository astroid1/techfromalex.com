#!/usr/bin/env bash
set -euo pipefail

echo "=== Build Validation ==="
echo ""

# Step 1: Lint
echo "[1/3] Running linter..."
if npx eslint . --quiet 2>/dev/null; then
  echo "  Lint: PASSED"
else
  echo "  Lint: FAILED (run 'npm run lint' for details)"
  exit 1
fi

# Step 2: Type check
echo "[2/3] Running type check..."
if npx tsc --noEmit 2>/dev/null; then
  echo "  Types: PASSED"
else
  echo "  Types: FAILED (run 'npx tsc --noEmit' for details)"
  exit 1
fi

# Step 3: Build
echo "[3/3] Running build..."
if npm run build > /dev/null 2>&1; then
  echo "  Build: PASSED"
else
  echo "  Build: FAILED (run 'npm run build' for details)"
  exit 1
fi

echo ""
echo "All checks passed!"
