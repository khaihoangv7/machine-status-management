' PC Monitor Pro - Silent Collector Launcher
' Chay collector an hoan toan, khong hien CMD

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Lay duong dan hien tai
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
collectorPath = scriptPath & "\cloud_collector.py"

' Kiem tra file ton tai
If Not fso.FileExists(collectorPath) Then
    MsgBox "Khong tim thay file: " & collectorPath, vbCritical, "PC Monitor Pro"
    WScript.Quit
End If

' Chay Python an (0 = hidden)
WshShell.Run "pythonw """ & collectorPath & """", 0, False
