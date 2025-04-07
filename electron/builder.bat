@echo off
chcp 65001 > nul
cls

:menu
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║               CrossCheck CASH - System Builder                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo  Выберите действие:
echo.
echo  [1] Запустить приложение в режиме разработки
echo  [2] Собрать инсталлятор (Windows)
echo  [3] Собрать портативную версию (Windows)
echo  [4] Установить/обновить зависимости
echo  [5] Очистить кэш и временные файлы
echo  [6] Опубликовать обновление на GitHub
echo  [0] Выход
echo.

set /p choice="Ваш выбор: "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto installer
if "%choice%"=="3" goto portable
if "%choice%"=="4" goto dependencies
if "%choice%"=="5" goto clean
if "%choice%"=="6" goto publish
if "%choice%"=="0" goto exit
goto menu

:dev
echo.
echo Запуск приложения в режиме разработки...
cd ..
npm run dev
goto menu

:installer
echo.
echo Сборка инсталлятора для Windows...
cd ..
npm run dist -- --win --x64 --config.win.target=nsis
echo.
echo Инсталлятор создан в папке dist/
pause
goto menu

:portable
echo.
echo Сборка портативной версии для Windows...
cd ..
npm run dist -- --win --x64 --config.win.target=portable
echo.
echo Портативная версия создана в папке dist/
pause
goto menu

:dependencies
echo.
echo Установка/обновление зависимостей...
cd ..
npm install
echo.
echo Зависимости установлены.
pause
goto menu

:clean
echo.
echo Очистка кэша и временных файлов...
cd ..
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist
if exist .cache rmdir /s /q .cache
if exist package-lock.json del package-lock.json
echo.
echo Очистка завершена.
pause
goto menu

:publish
echo.
echo Для публикации обновления вам понадобится токен доступа GitHub.
echo Если у вас его нет, создайте его в настройках GitHub (Settings -^> Developer settings -^> Personal access tokens).
echo.
echo Перед публикацией убедитесь, что:
echo  1. Вы обновили версию в package.json
echo  2. У вас есть права на репозиторий
echo  3. Вы сохранили токен GitHub как GH_TOKEN в переменных среды
echo.
set /p confirm="Продолжить публикацию? (y/n): "
if /i "%confirm%"=="y" (
    cd ..
    npm run publish
    echo.
    echo Публикация завершена.
    pause
) else (
    echo.
    echo Публикация отменена.
    pause
)
goto menu

:exit
echo.
echo До свидания!
timeout /t 2 > nul
exit 