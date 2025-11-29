#!/bin/bash

# Dark Mode Update Script  
# This script adds dark mode classes to all page components

# Define the replacements as an array
declare -A replacements=(
    # Backgrounds
    ["bg-white "]="bg-white dark:bg-gray-900 "
    ["bg-gray-50 "]="bg-gray-50 dark:bg-gray-950 "
    ["bg-gray-100 "]="bg-gray-100 dark:bg-gray-800 "
   
    # Text colors
    ["text-gray-900 "]="text-gray-900 dark:text-white "
    ["text-gray-800 "]="text-gray-800 dark:text-gray-200 "
    ["text-gray-700 "]="text-gray-700 dark:text-gray-300 "
    ["text-gray-600 "]="text-gray-600 dark:text-gray-400 "
    ["text-gray-500 "]="text-gray-500 dark:text-gray-400 "
    
    # Borders
    ["border-gray-100 "]="border-gray-100 dark:border-gray-800 "
    ["border-gray-200 "]="border-gray-200 dark:border-gray-700 "
    ["border-gray-300 "]="border-gray-300 dark:border-gray-600 "
    
    # Placeholders
    ["placeholder-gray-400"]="placeholder-gray-400 dark:placeholder-gray-500"
)

# Find all TypeScript/TSX files in app directory
files=$(find /home/fear/Projects/test/client/app -type f \( -name "*.tsx" -o -name "*.ts" \) ! -name "layout.tsx" ! -name "page.tsx" -path "*/app/*")

# Apply replacements
for file in $files; do
    echo "Processing: $file"
    for search in "${!replacements[@]}"; do
        replacement="${replacements[$search]}"
        # Use sed to replace, only if dark: doesn't already exist in that context
        sed -i "s/${search}/${replacement}/g" "$file" 2>/dev/null || true
    done
done

echo "Dark mode classes added to all pages!"
