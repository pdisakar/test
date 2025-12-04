# PowerShell script to centralize all admin API URLs

$clientPath = "h:\test\client\app\admin"

# Find all .tsx and .ts files in admin directory
$files = Get-ChildItem -Path $clientPath -Recurse -Include *.tsx,*.ts

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Check if file needs updating (contains localhost:3001)
    if ($content -match 'http://localhost:3001') {
        Write-Host "Updating: $($file.FullName)"
        
        # Add import if not present
        if ($content -notmatch "from '@/app/admin/lib/api-config'") {
            # Find the last import statement
            $lines = Get-Content $file.FullName
            $lastImportIndex = -1
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match "^import ") {
                    $lastImportIndex = $i
                }
            }
            
            if ($lastImportIndex -ne -1) {
                # Insert the new import after the last import
                $lines = @(
                    $lines[0..$lastImportIndex]
                    "import { getApiUrl, getImageUrl } from '@/app/admin/lib/api-config';"
                    $lines[($lastImportIndex + 1)..($lines.Count - 1)]
                )
                $content = $lines -join "`r`n"
            }
        }
        
        # Replace API URLs
        $content = $content -replace "fetch\('http://localhost:3001/api/([^']+)'\)", "fetch(getApiUrl('`$1'))"
        $content = $content -replace 'fetch\("http://localhost:3001/api/([^"]+)"\)', 'fetch(getApiUrl("$1"))'
        $content = $content -replace 'fetch\(`http://localhost:3001/api/([^`]+)`\)', 'fetch(getApiUrl(`$1`))'
        
        # Replace image URLs  
        $content = $content -replace 'return `http://localhost:3001\$\{([^}]+)\}`;', 'return getImageUrl($1);'
        $content = $content -replace "return 'http://localhost:3001' \+ ([^;]+);", 'return getImageUrl($1);'
        
        # Write back
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modified = $true
    }
    
    if ($modified) {
        Write-Host "Updated: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`nDone! All admin files have been updated." -ForegroundColor Cyan
