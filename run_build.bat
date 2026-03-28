@echo off
cd /d D:\work\claude_code\my-tech-blog-web
npx next build > build_result.txt 2>&1
if %ERRORLEVEL% == 0 (
  echo BUILD_SUCCESS >> build_result.txt
) else (
  echo BUILD_FAILED >> build_result.txt
)
