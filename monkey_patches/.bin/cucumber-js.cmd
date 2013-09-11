@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\cucumber\bin\cucumber.js" %*
) ELSE (
  node  "%~dp0\..\cucumber\bin\cucumber.js" %*
)