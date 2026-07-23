
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("C:\Users\antho\OneDrive\Desktop\Registre EPI Paprec.lnk")
    $Shortcut.TargetPath = "C:\Users\antho\OneDrive\Desktop\Registre_EPI_Paprec\index.html"
    $Shortcut.IconLocation = "C:\Windows\System32\shell32.dll, 47" # Shield icon in shell32.dll
    $Shortcut.Save()
    