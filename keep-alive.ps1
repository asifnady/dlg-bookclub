# Supabase Keep-Alive Script
# Pings the dlg-bookclub Supabase project to prevent free-tier pausing
# Run daily via cron

$supabaseUrl = "https://ozyvwadyfgqslvrckles.supabase.co"
$anonKey = "sb_publishable_m6lP2h6plepVAPaipCyP0g_DuA_ERJF"

try {
  $response = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/health" -Headers @{ apikey = $anonKey } -Method Get
  Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] SUCCESS - Supabase ping OK ($($response.name) $($response.version))"
} catch {
  Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] WARN - Supabase ping failed: $($_.Exception.Message)"
}
