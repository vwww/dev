set nLogOff = 0
set nReboot = 2 
set nForceLogOff = 4 
set nForceReboot = 6 
set nPowerDown = 8 
set nForcePowerDown = 12 

Set oOS = GetObject("winmgmts:{(Shutdown)}").ExecQuery("Select * from Win32_OperatingSystem") 

For Each oOperatingSystem in oOS 
oOperatingSystem.Win32Shutdown(nForcePowerDown) 
Next 