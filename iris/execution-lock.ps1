# Both launchers hold this OS mutex for their entire lifetime. No process-inspection race.
function Enter-IrisExecutionLock {
 param([string]$Name=('Local\SANCTUM.IRIS.Queue.'+[Security.Principal.WindowsIdentity]::GetCurrent().User.Value))
 $created=$false
 $lock=[Threading.Mutex]::new($false,$Name,[ref]$created)
 $owned=$false
 try {$owned=$lock.WaitOne(0)}catch [Threading.AbandonedMutexException]{$owned=$true}
 if(!$owned){$lock.Dispose();return $null}
 return $lock
}
