// module to control application life
const electron = require('electron'),
      app = electron.app;

var ipc = require('ipc');

// create native browser window.
const BrowserWindow = electron.BrowserWindow,
    path = require('path'),
    url = require('url');

// global reference of the window object
let mainWindow

function createWindow() {
    // create the browser window.
    mainWindow = new BrowserWindow({
        width: 600,
        height: 525
    });

    // and load the index.html of the app
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // open the DevTools.
    // mainWindow.webContents.openDevTools();

    // emitted when the window is closed.
    mainWindow.on('closed', function () {
        // dereference the window object
        mainWindow = null
    });
}

// when electron has finished
app.on('ready', createWindow);

// when all windows are closed.
app.on('window-all-closed', function () {
    // stay active until the user quits with cmd + q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // re-create window when dock icon clicked
    if (mainWindow === null) {
        createWindow()
    }
});