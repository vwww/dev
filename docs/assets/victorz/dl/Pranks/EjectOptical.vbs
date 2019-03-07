Set player = CreateObject("WMPlayer.OCX.7")
Set cds = player.CdromCollection
If cds.Count >= 1 then
	Do
		For i = 0 to cds.Count - 1
			cds.Item(i).Eject
			cds.Item(i).Eject
		Next
		wscript.sleep 5000
	Loop
End If