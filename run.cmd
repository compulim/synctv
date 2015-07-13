@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION
CHCP 65001
PUSHD "%~dp0"
MKDIR "batchfiles" 2>NUL

node program.js %* > batchfiles\current.cmd

IF %ERRORLEVEL% NEQ 0 GOTO :EOF

CALL batchfiles\current.cmd