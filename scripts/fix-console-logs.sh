#!/bin/bash

# Script to replace console.log with logger in API files

API_FILES=(
"app/api/news/trends/route.ts"
"app/api/news/rss/route.ts"
"app/api/news/generate/route.ts"
"app/api/forum/threads/route.ts"
"app/api/webring/route.ts"
"app/api/guestbook/route.ts"
"app/api/advertisement/route.ts"
"app/api/advertisement/slides/route.ts"
"app/api/admin/auth/route.ts"
"app/api/admin/honeypot/route.ts"
"app/api/mentor/chat/route.ts"
"app/api/chat/route.ts"
"app/api/mentor/validate/route.ts"
"app/api/news/route.ts"
"app/api/advertisement/upload/route.ts"
"app/api/webring/navigate/route.ts"
"app/api/radio/stations/[id]/route.ts"
"app/api/radio/stations/route.ts"
"app/api/tetris-scores/route.ts"
"app/api/legal/[file]/route.ts"
"app/api/photos/route.ts"
"app/api/forum/posts/route.ts"
"app/api/downloads/upload/route.ts"
"app/api/forum/categories/route.ts"
"app/api/downloads/files/route.ts"
"app/api/downloads/route.ts"
"app/api/downloads/[id]/download/route.ts"
"app/api/chat/private/route.ts"
"app/api/chat/simple/route.ts"
)

for file in "${API_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Check if logger import already exists
    if ! grep -q "import { logger } from '@/lib/logger'" "$file"; then
      # Add logger import after the first import line
      sed -i "1a import { logger } from '@/lib/logger';" "$file"
    fi

    # Replace console.log with logger.log
    sed -i 's/console\.log/logger.log/g' "$file"
    sed -i 's/console\.error/logger.error/g' "$file"
    sed -i 's/console\.warn/logger.warn/g' "$file"

    echo "✓ Fixed $file"
  else
    echo "⚠ File not found: $file"
  fi
done

echo "✅ All API files processed!"
