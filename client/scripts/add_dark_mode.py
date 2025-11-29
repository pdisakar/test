#!/usr/bin/env python3
"""
Adds dark mode classes to React/Next.js components
"""
import re
import os
from pathlib import Path

# Define replacement patterns
PATTERNS = [
    # Backgrounds - cards and containers
    (r'\bbg-white\b(?! dark:)', r'bg-white dark:bg-gray-900'),
    (r'\bbg-gray-50\b(?! dark:)', r'bg-gray-50 dark:bg-gray-950'),
    (r'\bbg-gray-100\b(?! dark:)', r'bg-gray-100 dark:bg-gray-800'),
    
    # Text colors
    (r'\btext-gray-900\b(?! dark:)', r'text-gray-900 dark:text-white'),
    (r'\btext-gray-800\b(?! dark:)', r'text-gray-800 dark:text-gray-200'),
    (r'\btext-gray-700\b(?! dark:)', r'text-gray-700 dark:text-gray-300'),
    (r'\btext-gray-600\b(?! dark:)', r'text-gray-600 dark:text-gray-400'),
    (r'\btext-gray-500\b(?! dark:)(?!.*group-hover)', r'text-gray-500 dark:text-gray-400'),
    (r'\btext-gray-400\b(?! dark:)', r'text-gray-400 dark:text-gray-500'),
    
    # Borders
    (r'\bborder-gray-100\b(?! dark:)', r'border-gray-100 dark:border-gray-800'),
    (r'\bborder-gray-200\b(?! dark:)', r'border-gray-200 dark:border-gray-700'),
    (r'\bborder-gray-300\b(?! dark:)', r'border-gray-300 dark:border-gray-600'),
    
    # Hover states for backgrounds
    (r'\bhover:bg-gray-50\b(?! dark:)', r'hover:bg-gray-50 dark:hover:bg-gray-800'),
    (r'\bhover:bg-gray-100\b(?! dark:)', r'hover:bg-gray-100 dark:hover:bg-gray-700'),
    
    # Hover states for text
    (r'\bhover:text-gray-900\b(?! dark:)', r'hover:text-gray-900 dark:hover:text-white'),
    (r'\bhover:text-gray-600\b(?! dark:)', r'hover:text-gray-600 dark:hover:text-gray-300'),
    
    # Placeholders
    (r'\bplaceholder-gray-400\b(?! dark:)', r'placeholder-gray-400 dark:placeholder-gray-600'),
    (r'\bplaceholder-gray-500\b(?! dark:)', r'placeholder-gray-500 dark:placeholder-gray-400'),
]

def process_file(file_path):
    """Process a single file and add dark mode classes"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all patterns
        for pattern, replacement in PATTERNS:
            content = re.sub(pattern, replacement, content)
        
        # Only write if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main function to process all page files"""
    base_path = Path('/home/fear/Projects/test/client/app')
    
    # Find all .tsx files except layout.tsx
    tsx_files = list(base_path.rglob('*.tsx'))
    tsx_files = [f for f in tsx_files if f.name not in ['layout.tsx']]
    
    processed = 0
    total = len(tsx_files)
    
    print(f"Found {total} files to process...")
    
    for file_path in tsx_files:
        if process_file(file_path):
            processed += 1
            print(f"✓ Updated: {file_path.relative_to(base_path)}")
    
    print(f"\nProcessed {processed}/{total} files")

if __name__ == '__main__':
    main()
