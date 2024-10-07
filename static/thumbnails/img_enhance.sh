#!/bin/bash
# Recursively convert all PNG files in the current directory to WebP format, while remove the background color specified.

background_color="#1f1f1f"

find . -type f -name "*.png" | while read file; do
  convert "$file" -fuzz 2% -transparent "$background_color" "$file"
  cwebp -q 80 "$file" -o "${file%.png}.webp"
  echo "$file converted to ${file%.png}.webp with background color $background_color removed."
done