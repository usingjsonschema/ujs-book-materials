@echo off
set valid="TRUE"
for %%f in (..\chapter2\*.json) do (
  call syntax %%f >nul
  if errorlevel 1 (
    echo File: %%f invalid
    set valid="FALSE"
  ) else (
    echo File: %%f valid
  )
)
if %valid%=="TRUE" (
  echo All files valid.
)