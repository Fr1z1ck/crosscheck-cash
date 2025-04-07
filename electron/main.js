const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');

// Определяем, запущено ли приложение в режиме разработки
const isDev = process.argv.includes('--dev');

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
app.on('ready', createWindow);

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