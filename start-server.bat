@echo off
cd /d "%~dp0"
@echo off
cd /d "%~dp0"
start "" http://localhost:3000
call pnpm exec ts-node --loader ts-node/esm server\index.ts
pause
