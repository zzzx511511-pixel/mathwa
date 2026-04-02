@echo off
chcp 65001 >nul
set "HERE=%~dp0"
set "HTML=%HERE%public\employee-preview-demo.html"

echo.
echo === معاينة واجهة الموظفين (بدون سيرفر) ===
echo سيتم فتح ملف HTML مباشرة في المتصفح الافتراضي.
echo.

if exist "%HTML%" (
  start "" "%HTML%"
  echo تم فتح: %HTML%
) else (
  echo لم يُعثر على الملف: %HTML%
)

echo.
echo إذا أردت الموقع الكامل: انقل المجلد إلى C:\dev\mathwa ثم شغّل: npm install ^&^& npm run dev
echo ثم افتح: http://localhost:3000/employee-preview
echo.
pause
