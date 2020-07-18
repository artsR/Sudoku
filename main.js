const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')
const {PythonShell} = require('python-shell')



let mainWindow


app.whenReady().then(() => {
    createWindow()
    mainWindow.show()
})
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('activate', () => {
    // Reopen the app on macOS:
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})
app.on('closed', () => {
    app.quit()
})
app.allowRendererProcessReuse = false

ipcMain.on('sudoku:invalid-input', () => {
    mainWindow.webContents.send('sudoku:message', 'Invalid input', 'alert-danger')
})
ipcMain.on('sudoku:valid-input', (e, sudoku_board) => {
    mainWindow.webContents.send('sudoku:message', 'Sudoku accepted', 'alert-success', sudoku_board)

    // let options = {
    //     mode: 'json',
    //     scriptPath: path.join(__dirname, 'sudoku'),
    //     args: [sudoku_board],
    // }
    // console.log(path.join(__dirname, 'sudoku'))
    // let pyshell = PythonShell.run('solver_I.py', options, (err, solution) => {
    //     // if (err) throw err
    //     console.log('returned: ', solution)
    // })

})

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 640,
        show: false,
        transparent: true,
        frame: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        }
    })
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, 'sudoku.html'),
            protocol: 'file:',
            slashes: true,
        })
    )
    mainWindow.on('closed', () => {
        mainWindow = null
    })
}
