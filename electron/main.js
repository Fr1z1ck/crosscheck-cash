const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { autoUpdater } = require('electron-updater');

// Определяем, запущено ли приложение в режиме разработки
const isDev = process.argv.includes('--dev');

// Отключаем автоматическое обновление в режиме разработки
autoUpdater.autoDownload = !isDev;
autoUpdater.autoInstallOnAppQuit = true;

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
            autoUpdater.checkForUpdatesAndNotify();
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
}

// Этот метод будет вызван, когда Electron закончит инициализацию
app.on('ready', () => {
  createWindow();
  
  // Проверка обновлений при запуске
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
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
  console.log('Проверка обновлений...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Доступно обновление', info);
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Доступно обновление',
    message: `Доступна новая версия: ${info.version}`,
    detail: 'Обновление загружается автоматически. После завершения вы будете уведомлены.',
    buttons: ['OK']
  });
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Обновлений нет', info);
});

autoUpdater.on('error', (err) => {
  console.log('Ошибка при обновлении', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Скорость загрузки: ${progressObj.bytesPerSecond}`;
  log_message = log_message + ' - Загружено ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
  console.log(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Обновление загружено', info);
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Обновление готово',
    message: 'Новая версия загружена',
    detail: 'Установить сейчас? Приложение будет перезапущено.',
    buttons: ['Установить', 'Позже'],
    cancelId: 1
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
}); 