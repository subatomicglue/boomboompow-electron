'use strict'

// bootable:
// https://medium.com/@WebReflection/a-minimalistic-64-bit-web-kiosk-for-rpi-3-98e460419b47

// WebKit+Audio on raspberry pi
// https://github.com/slandis/WebAudio
//
// Node audio player interface for raspberry pi
// https://www.npmjs.com/package/node-aplay

// if blank screen on raspberry pi, then disable GPU
//    electron main.js --disable-gpu


// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, dialog, Blob, File} = require('electron')
let mime = require('mime');
const path = require('path')
const url = require('url')

console.log( `DEBUG: ${process.env['DEBUG'] !== undefined ? process.env['DEBUG'] : 'not set (defaulting to production)'}` );
console.log( `NODE_ENV: ${process.env['NODE_ENV'] !== undefined ? process.env['NODE_ENV'] : 'not set (defaulting to production)'}` );

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function setMainMenu() {
  // https://electronjs.org/docs/api/menu
  const template = [
    {
      role: 'Main',
      submenu: [
        {role: 'quit'},
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {role: 'undo'},
        {role: 'redo'},
        {type: 'separator'},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {role: 'pasteandmatchstyle'},
        {role: 'delete'},
        {role: 'selectall'}
      ]
    },
    /*
    {
      label: 'View',
      submenu: [
        {role: 'resetzoom'},
        {role: 'zoomin'},
        {role: 'zoomout'},
        {type: 'separator'},
        {role: 'togglefullscreen'}
      ]
    },
    */
    {
      label: 'Debug',
      submenu: [
        {role: 'reload'},
        {role: 'forcereload'},
        {role: 'toggledevtools'},
        {type: 'separator'},
        {role: 'togglefullscreen'}
      ]
    },
    /*
    {
      role: 'window',
      submenu: [
        {role: 'minimize'},
        {role: 'close'}
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click () { require('electron').shell.openExternal('https://electronjs.org') }
        }
      ]
    }
    */
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}


function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    //minWidth: 640,
    //minHeight: 480,
    //backgroundColor: '#000000',
    //icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
  })
  setMainMenu();
  mainWindow.maximize();
  mainWindow.setFullScreen(true);

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  if (process.env['DEBUG'] == '*') {
    mainWindow.webContents.openDevTools()
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

function exit() {
  app.quit();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  app.quit();
})

// enable this in production to prevent devtools:
// win.webContents.on("devtools-opened", () => { win.webContents.closeDevTools(); });

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})


//var usbDetect = require('usb-detection');
var fs = require('fs');

let watch_location = '/Volumes/';
//let watch_location = '/Users/kevinmeinert/src/boomboompow/';
fs.watch( watch_location, (eventType, filename) => {
  console.log( "volumes changed" );
  console.log(eventType);
  // could be either 'rename' or 'change'. new file event and delete
  // also generally emit 'rename'
  console.log( watch_location + filename );
  console.log( app );

  mainWindow.webContents.executeJavaScript( `newDriveInserted( '${watch_location}${filename}' )` );
})

/*

usbDetect.startMonitoring();

// Detect add/insert
usbDetect.on('add', function(device) { console.log('add', device); });
usbDetect.on('add:vid', function(device) { console.log('add', device); });
usbDetect.on('add:vid:pid', function(device) { console.log('add', device); });

// Detect remove
usbDetect.on('remove', function(device) { console.log('remove', device); });
usbDetect.on('remove:vid', function(device) { console.log('remove', device); });
usbDetect.on('remove:vid:pid', function(device) { console.log('remove', device); });

// Detect add or remove (change)
usbDetect.on('change', function(device) { console.log('change', device); });
usbDetect.on('change:vid', function(device) { console.log('change', device); });
usbDetect.on('change:vid:pid', function(device) { console.log('change', device); });
*/


app.setPath ('userData', watch_location);

let dataurl = require( './dataurl' );

exports.selectAudioFile = function(filters, cb) {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters,
    title: "Pick a File",
    defaultPath: watch_location,
    buttonLabel: "Load",
  }, (filePaths) => {
    if (filePaths && filePaths.length == 1) {
      //console.log( filePaths[0] );

      // dataurl
      fs.readFile(filePaths[0], function(err, data) {
        let dataURL = dataurl.convert({ data, mimetype: mime.getType(filePaths[0]) });
        cb( dataURL, filePaths[0], mime.getType(filePaths[0]) );
      });

      // filename
      //cb( filePaths[0], mime.getType(filePaths[0]) );

      // data blob / data array
      //fs.readFile(filePaths[0], function(err, data) {
        //cb( new Uint8Array(data), filePaths[0], mime.getType(filePaths[0]) );
      //});
    }
  });
}

