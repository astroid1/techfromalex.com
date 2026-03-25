#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/new-post.sh "My Post Title" [category]
# Categories: reviews, guides, deals, news, comparisons

if [ -z "${1:-}" ]; then
  echo "Usage: $0 \"Post Title\" [category]"
  echo "Categories: reviews, guides, deals, news, comparisons"
  exit 1
fi

TITLE="$1"
CATEGORY="${2:-reviews}"
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-\|-$//g')
DATE=$(date +%Y-%m-%d)
FILE="content/posts/${SLUG}.mdx"

if [ -f "$FILE" ]; then
  echo "Error: $FILE already exists"
  exit 1
fi

cat > "$FILE" << EOF
---
title: "${TITLE}"
description: "TODO: Add a compelling description"
date: "${DATE}"
category: "${CATEGORY}"
tags: []
image: ""
imageAlt: "${TITLE}"
author: "Alex"
published: false
hasAffiliateLinks: false
affiliateProducts: []
---

## Introduction

TODO: Write your introduction here.

## Key Features

TODO: Cover the main points.

## Verdict

TODO: Summarize your thoughts.
EOF

echo "Created: $FILE"
echo "Slug: $SLUG"
echo "Category: $CATEGORY"
echo ""
echo "Next steps:"
echo "  1. Edit $FILE to add your content"
echo "  2. Set published: true when ready"
echo "  3. Run 'npm run dev' to preview"
