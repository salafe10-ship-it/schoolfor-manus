param(
  [Parameter(Mandatory=$true)][ValidateSet('seal','open')][string]$Action,
  [Parameter(Mandatory=$true)][string]$Source,
  [Parameter(Mandatory=$true)][string]$Destination
)
$ErrorActionPreference = 'Stop'
# File paths, never credential values, are passed on the command line.
# CurrentUser binds the ciphertext to this Windows account on this device.
Add-Type -AssemblyName System.Security
$taskBytes = $null
$taskResult = $null
try {
  $taskBytes = [System.IO.File]::ReadAllBytes($Source)
  $taskEntropy = [System.Text.Encoding]::UTF8.GetBytes('EduPro:schoolfor-manus:staging:v1')
  if ($Action -eq 'seal') {
    $taskResult = [System.Security.Cryptography.ProtectedData]::Protect($taskBytes, $taskEntropy, 'CurrentUser')
  } else {
    $taskResult = [System.Security.Cryptography.ProtectedData]::Unprotect($taskBytes, $taskEntropy, 'CurrentUser')
  }
  # Refuse to overwrite another file; the caller validates before renaming.
  $taskStream = [System.IO.File]::Open($Destination, 'CreateNew', 'Write', 'None')
  try { $taskStream.Write($taskResult, 0, $taskResult.Length) } finally { $taskStream.Dispose() }
} catch {
  # PowerShell's normal exception rendering can include user-supplied text.
  [Console]::Error.WriteLine('STAGING_DPAPI_OPERATION_FAILED')
  exit 1
} finally {
  if ($null -ne $taskBytes) { [Array]::Clear($taskBytes, 0, $taskBytes.Length) }
  if ($null -ne $taskResult) { [Array]::Clear($taskResult, 0, $taskResult.Length) }
}
