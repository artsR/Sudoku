import sys
import time
import json
import concurrent.futures



# Get starting point:
"""Sent from user."""
"""Some other criteria."""


class Sudoku:
    colors = [
        '#75594d', '#ff9800', '#ffeb3b', '#8bc34a', '#009688', '#03a9f4',
        '#3f51b5', '#9c27b0', '#e91e63'
    ]

    def __init__(self, sudoku, coord_r, coord_c, speed=0.01):
        self.sudoku = sudoku
        self.solved = False
        self.speed = speed

        if (coord_r == -1) or (coord_c == -1):
            self.coord_r, self.coord_c = self.get_next_empty(self.sudoku)
        else:
            self.coord_r = coord_r
            self.coord_c = coord_c


    def init_threads(self, coord_r, coord_c, i):
        if self.no_conflicts(self.sudoku, coord_r, coord_c, i):
            color = Sudoku.colors[i-1]
            sudoku = [row.copy() for row in self.sudoku]

            print(json.dumps({'data': (coord_r, coord_c, i), 'id': i, 'color': color}))
            sys.stdout.flush()
            sudoku[coord_r][coord_c] = i
            solved_fields = [(coord_r, coord_c, i)]

            solution = self.solve_sudoku(sudoku, i, color, solved_fields)

            if solution:
                # print(json.dumps({'result': solved_fields, 'color': color}))
                # sys.stdout.flush()
                # self.solved = True
                return solved_fields, color
            else:
                print(json.dumps({'data': (coord_r, coord_c, 0), 'id': i, 'color': color}))
                sys.stdout.flush()
                sudoku[coord_r][coord_c] = 0
            return False


    def solve_sudoku(self, sudoku, i, color, solved_fields):
        coord_r, coord_c = self.get_next_empty(sudoku)
        if (coord_r == -1) or (coord_c == -1):
            return True

        for digit in range(1, 10):
            if self.no_conflicts(sudoku, coord_r, coord_c, digit):
                sudoku[coord_r][coord_c] = digit
                solved_fields.append((coord_r, coord_c, digit))
                print(json.dumps({'data': (coord_r, coord_c, digit), 'id': i, 'color': color}))
                sys.stdout.flush()
                time.sleep(self.speed)

                solved_sudoku = self.solve_sudoku(sudoku, i, color, solved_fields)

                if solved_sudoku:
                    return True

                solved_fields.remove((coord_r, coord_c, digit))
                print(json.dumps({'data': (coord_r, coord_c, 0), 'id': i, 'color': color}))
                sys.stdout.flush()
                sudoku[coord_r][coord_c] = 0

        return False


    def no_conflicts(self, sudoku, coord_r, coord_c, current_value):
        """Procedure checks that the most recently introduced number is
        unique one in its row, column and block.
        """
        if current_value in self.get_row(sudoku, coord_r):
            return False

        if current_value in self.get_column(sudoku, coord_c):
            return False

        if current_value in self.get_block(sudoku, coord_r, coord_c):
            return False

        return True


    @staticmethod
    def get_next_empty(sudoku):
        """Generates coordinates of next empty field to fill."""
        for coord_r, row in enumerate(sudoku):
            for coord_c, field in enumerate(row):
                if field == 0:
                    return (coord_r, coord_c)
        return (-1, -1)

    @staticmethod
    def get_row(sudoku, coord_r):
        return sudoku[coord_r]

    @staticmethod
    def get_column(sudoku, coord_c):
        return list(zip(*sudoku))[coord_c]

    @staticmethod
    def get_block(sudoku, coord_r, coord_c):
        block_row = coord_r - coord_r%3
        block_col = coord_c - coord_c%3
        return [
            field
            for row in sudoku[block_row : block_row+3]
            for field in row[block_col : block_col+3]
        ]



class SudokuBoardError(Exception):
    pass



class SudokuValidator:
    """Validates and preprocesses given Sudoku board."""
    def __init__(self, sudoku_text):
        self.sudoku_list = sudoku_text.split(',')


    @property
    def board_validation(self):
        """Prepare Sudoku board. Returns False if invalid."""
        if len(self.sudoku_list) != 81:
            raise SudokuBoardError('Invalid board')

        try:
            sudoku_board = [
                [int(digit_txt) for digit_txt in self.sudoku_list[i:i+9]]
                for i in range(0, 81, 9)
            ]
        except ValueError:
            raise SudokuBoardError('Invalid digits')

        for row in sudoku_board:
            row_ = [d for d in row if d != 0]
            if len(set(row_)) != len(row_):
                raise SudokuBoardError('Duplicates in Row')

        for col in zip(*sudoku_board):
            col_ = [d for d in col if d != 0]
            if len(set(col_)) != len(col_):
                raise SudokuBoardError('Duplicates in Column')

        blocks = [
             [n for row in sudoku_board[i-3:i] for n in row[j-3:j]]
             for i in range(3, 10, 3)
             for j in range(3, 10, 3)
        ]
        for block in blocks:
            block_ = [d for d in block if d != 0]
            if len(set(block_)) != len(block_):
                raise SudokuBoardError('Duplicates in Block')

        return sudoku_board


    def __enter__(self):
        return self


    def __exit__(self, exctype, excval, exctb):
        if exctype == SudokuBoardError:
            print(json.dumps({'code': 1, 'result': excval.args[0]}))
            return True
        else:
            return False



if __name__ == '__main__':

    sudoku_text = sys.argv[1]
    coord_r, coord_c = int(sys.argv[2]), int(sys.argv[3])
    speed = float(sys.argv[4])

    with SudokuValidator(sudoku_text) as sv:
        valid_board = sv.board_validation
        sudoku = Sudoku(valid_board, coord_r, coord_c, speed)

        with concurrent.futures.ThreadPoolExecutor() as executor:
            results = [
                executor.submit(sudoku.init_threads, sudoku.coord_r, sudoku.coord_c, i)
                for i in range(1, 10)
            ]
            solutions = [
                solution.result()
                for solution in concurrent.futures.as_completed(results)
                if solution.result()
            ]
            print(json.dumps({'solution': solutions}))
