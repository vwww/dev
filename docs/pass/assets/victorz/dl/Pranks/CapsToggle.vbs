Set wshShell = wscript.CreateObject("WScript.Shell")
do
	wscript.sleep 500
	wshShell.sendkeys "{CAPSLOCK}{NUMLOCK}{SCROLLLOCK}"
loop