@echo off
start .\thirdparty\bin\SmartControl.exe --urls=http://*:10000
start npm run preview
timeout 3
start http://localhost:4173/