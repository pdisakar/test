#!/usr/bin/env python3
"""
Fix tables for dark mode - specifically tbody dividers and row hover states
"""
import re
import os
from pathlib import Path

def process_file(file_path):
    """Process a single file and fix table dark mode issues"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix tbody dividers
        content = re.sub(
            r'\bdivide-y divide-gray-100\b(?! dark:)',
            r'divide-y divide-gray-100 dark:divide-gray-800',
            content
        )
        
        # Fix table row hover states
        content = re.sub(
            r'\bhover:bg-gray-50\b(?! dark:)(?!.*dark:bg)',
            r'hover:bg-gray-50 dark:hover:bg-gray-800',
            content
        )
        
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
    
    # Find all .tsx files
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
