const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Определяем, запущено ли приложение в режиме разработки
const isDev = process.argv.includes('--dev');
const isForceUpdate = process.argv.includes('--force-update');

// Создаем свою простую систему логирования
const logFilePath = path.join(app.getPath('userData'), 'logs', 'app.log');

// Создаем папку для логов, если она не существует
try {
  const logsDir = path.dirname(logFilePath);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (err) {
  console.error('Ошибка при создании папки логов:', err);
}

// Простая функция для логирования
function logToFile(message) {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    console.log(logMessage.trim());
    
    fs.appendFileSync(logFilePath, logMessage);
  } catch (err) {
    console.error('Ошибка при записи в лог-файл:', err);
  }
}

// Настройки автообновления
autoUpdater.autoDownload = !isDev || isForceUpdate;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowDowngrade = false;

// Сохраняем глобальную ссылку на объект окна
let mainWindow;

function createWindow() {
  // Создание окна браузера
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'logov3.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // Загрузка index.html
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '..', 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Открываем DevTools в режиме разработки
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Установка меню
  const template = [
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Выход',
          accelerator: 'CmdOrCtrl+Q',
          click() {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        {
          label: 'Перезагрузить',
          accelerator: 'CmdOrCtrl+R',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload();
          }
        },
        {
          label: 'Инструменты разработчика',
          accelerator: 'F12',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Справка',
      submenu: [
        {
          label: 'О программе',
          click() {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'О программе',
              message: `CrossCheck CASH v${app.getVersion()}`,
              detail: 'Приложение для автоматизации кассовых операций',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Проверить обновления',
          click() {
            // Показываем диалог о начале проверки
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Проверка обновлений',
              message: 'Выполняется проверка наличия обновлений...',
              detail: 'Текущая версия: ' + app.getVersion(),
              buttons: ['OK']
            });
            
            // Выполняем проверку с принудительным поиском
            autoUpdater.checkForUpdatesAndNotify();
          }
        },
        { type: 'separator' },
        {
          label: 'Диагностика обновлений',
          click() {
            // Показываем информацию о настройках обновления
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Диагностика обновлений',
              message: 'Информация о системе обновлений',
              detail: `Версия: ${app.getVersion()}\nРежим разработки: ${isDev}\nФайл логов: ${logFilePath}\nАвтозагрузка: ${autoUpdater.autoDownload}`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Обработка закрытия окна
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
  
  logToFile('Приложение запущено. Версия: ' + app.getVersion());
}

// Этот метод будет вызван, когда Electron закончит инициализацию
app.on('ready', () => {
  createWindow();
  
  // Проверка обновлений при запуске
  setTimeout(() => {
    if (!isDev || isForceUpdate) {
      logToFile('Проверка обновлений при запуске...');
      autoUpdater.checkForUpdatesAndNotify();
    }
  }, 3000); // Небольшая задержка для инициализации окна
});

// Выход, когда все окна закрыты
app.on('window-all-closed', function() {
  // На macOS приложения обычно продолжают работать, пока пользователь не выйдет явно через Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  // На macOS обычно воссоздают окно приложения, когда пользователь кликает на иконку в доке,
  // если нет других открытых окон
  if (mainWindow === null) {
    createWindow();
  }
});

// Обработчики событий обновления
autoUpdater.on('checking-for-update', () => {
  logToFile('Проверка обновлений...');
});

autoUpdater.on('update-available', (info) => {
  logToFile(`Доступно обновление: ${info.version}`);
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Доступно обновление',
    message: `Доступна новая версия: ${info.version}`,
    detail: `Ваша версия: ${app.getVersion()}\nНовая версия: ${info.version}\n\nОбновление загружается автоматически. После завершения вы будете уведомлены.`,
    buttons: ['OK']
  });
});

autoUpdater.on('update-not-available', (info) => {
  logToFile('Обновлений нет. Текущая версия: ' + app.getVersion());
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Обновления не найдены',
    message: 'У вас установлена последняя версия приложения',
    detail: `Текущая версия: ${app.getVersion()}`,
    buttons: ['OK']
  });
});

autoUpdater.on('error', (err) => {
  logToFile(`Ошибка при обновлении: ${err.message}`);
  
  dialog.showMessageBox(mainWindow, {
    type: 'error',
    title: 'Ошибка обновления',
    message: 'Произошла ошибка при проверке или установке обновлений',
    detail: `Ошибка: ${err.message}\n\nПопробуйте перезапустить приложение или скачать обновление вручную с официального сайта.`,
    buttons: ['OK']
  });
});

autoUpdater.on('download-progress', (progressObj) => {
  const logMessage = `Загрузка обновления: ${progressObj.percent.toFixed(2)}% (${Math.round(progressObj.transferred / 1024)} / ${Math.round(progressObj.total / 1024)} КБ)`;
  logToFile(logMessage);
  
  // Здесь можно добавить отображение прогресса загрузки в интерфейсе
});

autoUpdater.on('update-downloaded', (info) => {
  logToFile(`Обновление загружено: ${info.version}`);
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Обновление готово',
    message: 'Новая версия загружена',
    detail: `Версия ${info.version} загружена и готова к установке.\nУстановить сейчас? Приложение будет перезапущено.`,
    buttons: ['Установить сейчас', 'Установить позже'],
    cancelId: 1
  }).then(result => {
    if (result.response === 0) {
      logToFile('Установка обновления и перезапуск...');
      autoUpdater.quitAndInstall(true, true);
    }
  });
}); 