$content = Get-Content 'h:\test\client\app\packages\add\page.tsx' -Raw

# 1. Add useParams import
$content = $content -replace "import \{ useRouter \} from 'next/navigation';", "import { useRouter, useParams } from 'next/navigation';"

# 2. Change function name
$content = $content -replace 'export default function AddPackagePage\(\)', 'export default function EditPackagePage()'

# 3. Add packageId and loading state after router
$content = $content -replace '(const router = useRouter\(\);)', "`$1`n  const params = useParams();`n  const packageId = params.id as string;`n  const [loading, setLoading] = useState(true);"

# 4. Change Add Package to Edit Package
$content = $content -replace 'Add Package', 'Edit Package'

# 5. Change Make Available Package to Update Package  
$content = $content -replace 'Make Available Package', 'Update Package'

# 6. Change POST to PUT in submit handler
$content = $content -replace "fetch\('http://localhost:3001/api/packages',correct \{\s+method: 'POST',", "fetch``(`http://localhost:3001/api/packages/`${packageId}`, {`n        method: 'PUT',"

# 7. Change created to updated
$content = $content -replace "alert\('Package created successfully!'\);", "alert('Package updated successfully!');"
$content = $content -replace 'Failed to create package:', 'Failed to update package:'

# Save
$content | Set-Content 'h:\test\client\app\packages\edit\[id]\page.tsx'
