const {remote, ipcRenderer} = require('electron')
const path = require('path')
const url = require('url')
const {PythonShell} = require('python-shell')



const sudoku = new SudokuUI()


document.querySelector('#close').addEventListener('click', closeWindow)

document.querySelector('#clear-all-fields').addEventListener('click', clearSudoku)
document.querySelector('#load-own-sudoku').addEventListener('click', loadSudoku)
document.querySelector('#solve-easy-fields').addEventListener('click', solveEasy)
document.querySelector('#solve-backtracking').addEventListener('click', solveBacktracking)
const pauseSudoku = document.querySelector('#pause')
const resumeSudoku = document.querySelector('#continue')
const stopSudoku = document.querySelector('#stop')

document.addEventListener('DOMContentLoaded', () => sudoku.set_coords())

ipcRenderer.on('sudoku:message', (e, msg, type, sudoku_board) => {
    sudoku.show_message(msg, type)
    if (sudoku_board) {
        sudoku.preload_sudoku(sudoku_board)
    }
})


function closeWindow() {
    let sudokuWindow = remote.getCurrentWindow()
    sudokuWindow.close()
}
function clearSudoku() {
    sudoku.clear()
}
function loadSudoku() {
    let addSudokuWindow = new remote.BrowserWindow({
        width: 200,
        height: 300,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true
        }
    })
    addSudokuWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'load_sudoku.html'),
        protocol: 'file',
        slashes: true,
    }))
    addSudokuWindow.on('close', () => addSudokuWindow = null)
}
function solveEasy() {
    sudoku_board = sudoku.get_sudoku()

    let options = {
        mode: 'json',
        scriptPath: path.join(__dirname, 'sudoku'),
        args: [sudoku_board],
    }
    let pyshell = PythonShell.run('solver_easy.py', options, (err, stdout) => {
        if (err) throw err
        const outcome = stdout[0]
        if (outcome.code) {
            sudoku.show_message(outcome.result, 'alert-danger')
        }
        else {
            pauseSudoku.style.display = 'inline-block'
            pauseSudoku.addEventListener('click', pause)
            resumeSudoku.addEventListener('click', continueFilling)

            sudoku.toggle_buttons()

            let solution = outcome.result
            if (solution[0].constructor !== Array) {
                solution = Array(solution)
            }
            var i = 0
            var flag = true
            display_solution()

            function display_solution() {
                if (flag) {
                    if (i === solution.length) {
                        sudoku.toggle_buttons()
                        pauseSudoku.style.display = 'none'
                        resumeSudoku.style.display = 'none'
                        return null
                    }
                    else {
                        var field = solution[i]
                        var current_cell = document.querySelector(`div[data-coord-r="${field[0]}"][data-coord-c="${field[1]}"]`)
                        current_cell.classList.add('active')
                        current_cell.classList.add('success')
                        setTimeout(() => {
                            current_cell.classList.remove('active')
                        }, 150)
                        setTimeout(() => {
                            current_cell.classList.add('active')
                        }, 250)
                        setTimeout(() => {
                            current_cell.innerText = field[2]
                            current_cell.classList.remove('active')

                        }, 450)
                        i++
                    }
                    setTimeout(display_solution, 500)
                }
                else {
                    return null
                }
            }
            function pause() {
                /** Stops filling Sudoku board. */
                flag = false
                pauseSudoku.style.display = 'none'
                resumeSudoku.style.display = 'inline-block'
            }
            function continueFilling() {
                /** Resumes filling Sudoku board. */
                flag = true
                pauseSudoku.style.display = 'inline-block'
                resumeSudoku.style.display = 'none'
                display_solution()
            }
        }
    })
}
function solveBacktracking() {
    let starting_coord = choose_starting_coord()
    if (starting_coord === null) return null

    sudoku.toggle_buttons()
    sudoku.set_backtracking()

    stopSudoku.style.display = 'inline-block'
    stopSudoku.addEventListener('click', stop)

    let coord_r = starting_coord[0],
        coord_c = starting_coord[1],
        speed = document.querySelector('input#speedInputId').value
    let sudoku_board = sudoku.get_sudoku()

    let options = {
        mode: 'json',
        scriptPath: path.join(__dirname, 'sudoku'),
        args: [sudoku_board, coord_r, coord_c, speed]
    }
    let pyshell = new PythonShell('solver_backtracking.py', options)

    // pyshell.send({args: [sudoku_board]})
    pyshell.on('message', (cell) => {

        if (cell.data) {
            let value = cell.data
            let i = cell.id
            let color = cell.color

            let current_cell = document.querySelector(`div[data-coord-r="${value[0]}"][data-coord-c="${value[1]}"] .cell-back-options div:nth-child(${i})`)
            current_cell.style.background = value[2] === 0 ? 'initial' : color
            current_cell.style.color = '#000'
            current_cell.innerText = value[2] === 0 ? '' : value[2]
        }
        else if (cell.solution) {
            if (cell.solution.length === 0) {
                sudoku.show_message('Not able to solve', 'alert-danger')
            }
            else {
                sudoku.show_message(`Sudoku has at least ${cell.solution.length} solution(s)`, 'alert-success')
                setTimeout(() => {
                    sudoku.choose_solution(cell.solution, displaySolution)
                }, 3000)
            }
        }
        else {
            console.log(cell)
            sudoku.show_message('Error. Refresh or Clear board', 'alert-danger')
        }
    })
    pyshell.end((err, code, signal) => {
        if (err) throw err
        console.log(`Exit code: ${code}`)
        console.log(`Exit signal: ${signal}`)

        sudoku.toggle_buttons()
        stopSudoku.style.display = 'none'
    })

    function stop() {
        stopSudoku.style.display = 'none'
        pyshell.kill('SIGTERM')
    }
    function choose_starting_coord() {
        /** Chooses and Validates starting point. */
        let starting_cell = document.querySelector('input[name="starting_cell"]:checked')
        let coord_r, coord_c

        if (starting_cell.value == 3) {
            // Custom starting cell
            let cell = document.querySelector('.sudoku-container .active-cell')

            if (cell === null || cell.innerText !== '') {
                sudoku.show_message('Choose empty starting cell', 'alert-danger')
                return null
            }
            else {
                coord_r = cell.dataset.coordR
                coord_c = cell.dataset.coordC
                return [coord_r, coord_c]
            }
        }
        else if (starting_cell.value == 2) {
            // Random starting cell
            let population = []
            document.querySelectorAll('.cell').forEach(cell => {
                if (cell.innerText === '') {
                    population.push([cell.dataset.coordR, cell.dataset.coordC])
                }
            })

            if (!population.length) {
                return null
            }
            else {
                let random = population[Math.floor(Math.random() * population.length)]
                coord_r = random[0]
                coord_c = random[1]
                return [coord_r, coord_c]
            }
        }
        else {
            // First empty starting cell
            coord_r = -1
            coord_c = -1
            return [coord_r, coord_c]
        }
    }
    function displaySolution(data) {
        let solution = data[0]
        let color = data[1]

        if (solution.constructor !== Array) {
            solution = Array(solution)
        }
        solution.forEach(value => {
            let current_cell = document.querySelector(`div[data-coord-r="${value[0]}"][data-coord-c="${value[1]}"]`)
            setTimeout(() => {
                current_cell.classList.add('active')
                current_cell.classList.add('success')
            }, 1000)
            setTimeout(() => {
                current_cell.innerText = value[2]
                current_cell.classList.remove('active')
            }, 2000)
        })
    }
}
