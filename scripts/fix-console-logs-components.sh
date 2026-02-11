#!/bin/bash

# Script to replace console.log with logger in component and page files

FILES=(
# Components
"components/ClippyChat.tsx"
"components/Webring/WebringCompact.js"
"components/Webring/Webring.js"
"components/Webring/AddSiteModal.js"
"components/TetrisGame/TetrisGame.js"
"components/PrivateChatroom/PrivateChatroom.js"
"components/LegalNoticeBoard/LegalNoticeBoard.js"
"components/Guestbook/Guestbook.js"
"components/GuestbookForm/GuestbookForm.js"
"components/Downloads/FileUploadModal.js"
"components/Forum/Forum.js"
"components/Chatroom/Chatroom.js"
# Pages
"app/page.tsx"
"app/panelrudy/page.tsx"
"app/news/page.tsx"
"app/mentor/page.tsx"
"app/shop/page.tsx"
"app/reklama/page.tsx"
"app/tetris/page.tsx"
"app/webring/page.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Check if logger import already exists
    if ! grep -q "import { logger } from" "$file"; then
      # Determine correct import path based on file location
      if [[ $file == components/* ]]; then
        import_path="@/lib/logger"
      else
        import_path="@/lib/logger"
      fi

      # Add logger import after 'use client' if exists, otherwise after first import
      if grep -q "'use client'" "$file"; then
        sed -i "/'use client'/a import { logger } from '$import_path';" "$file"
      else
        sed -i "1a import { logger } from '$import_path';" "$file"
      fi
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

echo "✅ All component and page files processed!"
