class SudokuUI {
    constructor() {
        this.sudoku_container = document.querySelector('.sudoku-container')
        this.infoDiv = document.querySelector('.info-panel')
    }
    set_coords() {
        /** Create Sudoku UI fields.*/
        for (let block=0; block<9; block++) {
            let new_blockDiv = document.createElement('div')
            new_blockDiv.className = 'sudoku-block'
            new_blockDiv.dataset.block = `${block}`

            // new_blockDiv.innerHtml = ''
            for (let i=0; i<9; i++) {
                let sudoku_cell = document.createElement('div')
                sudoku_cell.addEventListener('click', (e) => this.show_digits(sudoku_cell))

                sudoku_cell.className = 'cell'
                sudoku_cell.dataset.coordR = `${Math.floor(i/3) + 3*Math.floor(block/3)}`
                sudoku_cell.dataset.coordC = `${i%3 + 3*(block%3)}`

                new_blockDiv.appendChild(sudoku_cell)
            }
            this.sudoku_container.appendChild(new_blockDiv)
        }
    }

    preload_sudoku(sudoku) {
        /** Fills Sudoku UI with given Sudoku board.*/
        this.clear()
        for (let coord_r=0; coord_r<9; coord_r++) {
            document.querySelectorAll(`div[data-coord-r="${coord_r}"]`).forEach((item, coord_c) => {
                if (sudoku[coord_r*9 + coord_c] != 0) {
                    item.innerText = sudoku[coord_r*9 + coord_c]
                }
            })
        }
    }

    set_backtracking() {
        this.sudoku_container.style.transform = 'scale(1.35)'

        let empty_fields = document.querySelectorAll('.cell')

        empty_fields.forEach(sudoku_cell => {
            if (sudoku_cell.innerText === '') {
                sudoku_cell.innerHTML = `
                    <div class="cell-back-options">
                        <div data-option="1"></div>
                        <div data-option="2"></div>
                        <div data-option="3"></div>
                        <div data-option="4"></div>
                        <div data-option="5"></div>
                        <div data-option="6"></div>
                        <div data-option="7"></div>
                        <div data-option="8"></div>
                        <div data-option="9"></div>
                    </div>
                `
            }
        })
    }

    get_sudoku() {
        /** Builds Sudoku board from Sudoku UI. */
        let sudoku = ''
        for (let coord_r=0; coord_r<9; coord_r++) {
            document.querySelectorAll(`div[data-coord-r="${coord_r}"]`).forEach((item, coord_c) => {
                if (item.innerText !== '') {
                    sudoku += item.innerText
                }
                else {
                    sudoku += '0'
                }
            })
        }
        return Array.from(sudoku)
    }

    show_message(msg, type) {
        this.infoDiv.innerText = msg
        this.infoDiv.classList.add(type)
        setTimeout(() => {
            this.infoDiv.innerText = ''
            this.infoDiv.classList.remove(type)
        }, 3000)
    }

    clear() {
        /** Clears all digits from Sudoku board. */
        document.querySelectorAll('.cell').forEach(cell => {
            cell.innerText = ''
            cell.classList.remove('success')
        })
        this.sudoku_container.style.transform = 'none'
    }

    show_digits(clickedCell) {
        /** Shows digit options for chosen Sudoku cell which it marks. */
        this.sudoku_container.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('active-cell')
        })
        clickedCell.classList.add('active-cell')
        var digitContainer = document.createElement('div')
        digitContainer.className = 'digit-container'
        for (let i=1; i<11; i++) {
            let digitDiv = document.createElement('div')
            digitDiv.className = 'digit-input'
            digitDiv.innerText = i < 10 ? i : '\u2190'

            digitContainer.appendChild(digitDiv)
        }
        this.infoDiv.innerHTML = digitContainer.innerHTML
        this.infoDiv.querySelectorAll('.digit-input').forEach(digitDiv => {
            digitDiv.addEventListener('click', (e) => this.choose_digit(e))
        })
    }

    choose_digit(e) {
        /** Adds chosen digit to marked Sudoku cell. */
        let active_cell = this.sudoku_container.querySelector('.active-cell')

        if (active_cell) {
            active_cell.classList.remove('success')
            active_cell.innerText = e.target.innerText !== '\u2190' ? e.target.innerText : ''
            active_cell.classList.remove('active-cell')
        }
        else {
            this.show_message('Choose cell...', 'alert-danger')
        }
    }

    toggle_buttons() {
        document.querySelectorAll('button').forEach(button => {
            button.disabled = !button.disabled
        })
        if (this.infoDiv.style.pointerEvents === 'none') {
            this.infoDiv.style.pointerEvents = 'auto'
        }
        else {
            this.infoDiv.style.pointerEvents = 'none'
        }
        this.sudoku_container.style.transform = 'none'
    }
}
