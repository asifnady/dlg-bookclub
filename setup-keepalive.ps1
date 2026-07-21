$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File C:\Users\flick\dlg-bookclub\keep-alive.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 10:00AM
Register-ScheduledTask -TaskName "DlgBookclub-SupabaseKeepAlive" -Action $action -Trigger $trigger -Description "Daily ping to prevent Supabase free-tier pausing" -Force

$task = Get-ScheduledTask -TaskName "DlgBookclub-SupabaseKeepAlive" -ErrorAction SilentlyContinue
if ($task) {
  Write-Output "Task registered. State: $($task.State)"
} else {
  Write-Output "Failed to register task."
}
