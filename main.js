const { app, BrowserWindow, shell, Menu, protocol, webFrame } = require('electron');
// const autoUpdater = require('electron-updater').autoUpdater;
const { Console } = require('console');
const is = require('electron-util');
const toExecutableName = require('to-executable-name');
const url = require('url');
const path = require('path');
const crossSpawn = require('cross-spawn');
const signalExit = require('signal-exit');

const basePath = is.development ? __dirname : path.join(process.resourcesPath, 'app.asar.unpacked', 'ember-electron');
global.resourcesPath = path.normalize(path.join(basePath, 'resources'));

app.setAsDefaultProtocolClient('qlc'); // Register handler for xrb: links

let mainWindow;

const forceKill = (child, timeout = 5000) => {
	if (!child.killed) {
		child.kill();
	}

	if (child.stdin) {
		child.stdin.destroy();
	}

	if (child.stdout) {
		child.stdout.destroy();
	}

	if (child.stderr) {
		child.stderr.destroy();
	}

	const { pid } = child;
	child.unref();

	const interval = 500;
	function poll() {
		try {
			process.kill(pid, 0);
			setTimeout(() => {
				try {
					process.kill(pid, 'SIGKILL');
					console.log('Forcefully killed process PID:', pid);
				} catch (e) {
					setTimeout(poll, interval);
				}
			}, timeout);
		} catch (e) {
			// ignore
		}
	}

	return setTimeout(poll, interval);
};

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		titleBarStyle: 'hidden',
		width: 1200,
		height: 800,
		webPreferences: { webSecurity: true },
		icon: path.join(__dirname, 'dist/assets/favicon/favicon.ico')
	});
	// const options = { extraHeaders: "pragma: no-cache\n" };

	// mainWindow.loadURL('http://localhost:4200/');
	mainWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, 'dist/index.html'),
			protocol: 'file:',
			slashes: true
		})
	);

	// Open dev tools
	//mainWindow.webContents.openDevTools();

	// Emitted when the window is closed.
	mainWindow.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});

	mainWindow.webContents.on('new-window', function(e, url) {
		e.preventDefault();
		shell.openExternal(url);
	});

	const menuTemplate = getApplicationMenu();

	// Create our menu entries so that we can use MAC shortcuts
	Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

app.on('ready', () => {
	// Once the app is ready, launch the wallet window
	createWindow();

	// start gqlc
	// console.log(`path: ${global.resourcesPath}`);
	// const cmd = path.join(global.resourcesPath, toExecutableName('gqlc'));
	// console.log(`starg qglc ${cmd}`);
	// const child = crossSpawn(cmd, {
	// 	windowsHide: true,
	// 	stdio: ['ignore', 'pipe', 'pipe']
	// });

	// if (!child) {
	// 	const err = new Error('gqlc not started');
	// 	err.code = 'ENOENT';
	// 	err.path = cmd;
	// 	throw err;
	// }

	// child.stdout.on('data', data => console.log('[node]', String(data).trim()));
	// child.stderr.on('data', data => console.log('[node]', String(data).trim()));

	// console.log(`start gqlc, ${child}`);

	// const killHandler = () => child.kill();
	// const removeExitHandler = signalExit(killHandler);
	// child.once('exit', () => {
	// 	removeExitHandler();
	// 	global.isNodeStarted = false;
	// 	console.log(`Node exiting (PID ${pid})`);
	// 	forceKill(child);
	// });

	// app.once('will-quit', killHandler);
	// child.once('exit', () => app.removeListener('will-quit', killHandler));

	// Detect when the application has been loaded using an xrb: link, send it to the wallet to load
	app.on('open-url', (event, path) => {
		if (!mainWindow) {
			createWindow();
		}
		if (!mainWindow.webContents.isLoading()) {
			mainWindow.webContents.executeJavaScript(
				`window.dispatchEvent(new CustomEvent('protocol-load', { detail: '${path}' }));`
			);
		}
		mainWindow.webContents.once('did-finish-load', () => {
			mainWindow.webContents.executeJavaScript(
				`window.dispatchEvent(new CustomEvent('protocol-load', { detail: '${path}' }));`
			);
		});
		event.preventDefault();
	});

	// Check for any updates on GitHub
	//checkForUpdates();
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q

	if (process.platform !== 'darwin') {
		// close gqlc
		app.quit();
	}
});

app.on('activate', function() {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

// function checkForUpdates() {
//   autoUpdater.checkForUpdatesAndNotify()
//     .then(() => {})
//     .catch(console.log);
// }

// Build up the menu bar options based on platform
function getApplicationMenu() {
	const template = [
		{
			label: 'Edit',
			submenu: [
				{ role: 'undo' },
				{ role: 'redo' },
				{ type: 'separator' },
				{ role: 'cut' },
				{ role: 'copy' },
				{ role: 'paste' },
				{ role: 'pasteandmatchstyle' },
				{ role: 'delete' },
				{ role: 'selectall' }
			]
		},
		{
			label: 'View',
			submenu: [
				{ role: 'reload' },
				{ role: 'forcereload' },
				{ role: 'toggledevtools' },
				{ type: 'separator' },
				{ role: 'resetzoom' },
				{ role: 'zoomin' },
				{ role: 'zoomout' },
				{ type: 'separator' },
				{ role: 'togglefullscreen' }
			]
		},
		{
			role: 'window',
			submenu: [{ role: 'minimize' }, { role: 'close' }]
		},
		{
			role: 'help',
			submenu: [
				{
					label: 'View GitHub',
					click() {
						loadExternal('https://github.com/qlcchain/qlcwallet');
					}
				},
				{
					label: 'Submit Issue',
					click() {
						loadExternal('https://github.com/qlcchain/qlcwallet/issues/new');
					}
				},
				// {type: 'separator'},
				// {
				//   type: 'normal',
				//   label: `QLCWallet Version: ${autoUpdater.currentVersion}`,
				// },
				{
					label: 'View Latest Updates',
					click() {
						loadExternal('https://github.com/qlcchain/qlcwallet/releases');
					}
				}
				// {type: 'separator'},
				// {
				//   label: `Check for Updates...`,
				//   click (menuItem, browserWindow) {
				//     checkForUpdates();
				//   }
				// },
			]
		}
	];

	if (process.platform === 'darwin') {
		template.unshift({
			label: 'QLCWallet',
			submenu: [
				{ role: 'about' },
				{ type: 'separator' },
				{
					label: `Check for Updates...`,
					click(menuItem, browserWindow) {
						//checkForUpdates();
					}
				},
				{ type: 'separator' },
				// {role: 'services', submenu: []},
				// {type: 'separator'},
				{ role: 'hide' },
				{ role: 'hideothers' },
				{ role: 'unhide' },
				{ type: 'separator' },
				{ role: 'quit' }
			]
		});

		// Edit menu
		template[1].submenu.push(
			{ type: 'separator' },
			{
				label: 'Speech',
				submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }]
			}
		);

		// Window menu
		template[3].submenu = [
			{ role: 'close' },
			{ role: 'minimize' },
			{ role: 'zoom' },
			{ type: 'separator' },
			{ role: 'front' }
		];
	}

	return template;
}

function loadExternal(url) {
	shell.openExternal(url);
}
