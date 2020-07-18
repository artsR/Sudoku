import sys
import json
from solver_backtracking import SudokuBoardError, SudokuValidator



def solve_obv_fields(sudoku, empty_fields, fields_inputs):
    """Solves fields with only one possible choice and tracks made changes."""
    changed_fields = []
    obv_choices = [
        (coord_r, coord_c, obv_input)
        for coord_r, coord_c, obv_input in fields_inputs
        if len(obv_input) == 1
    ]
    while obv_choices:

        for coord_r, coord_c, obv_choice in obv_choices:
            value = obv_choice.pop()
            if not no_conflicts(sudoku, coord_r, coord_c, value):
                obv_choices = []
                break
            empty_fields.remove((coord_r, coord_c))
            sudoku[coord_r][coord_c] = value
            changed_fields.append((coord_r, coord_c, value))
        else:
            fields_inputs = available_inputs(sudoku, empty_fields)
            obv_choices = [
                (coord_r, coord_c, obv_choice)
                for coord_r, coord_c, obv_choice in fields_inputs
                if len(obv_choice) == 1
            ]

    return changed_fields


def get_empty(sudoku):
    """Generates list of tuples with coordinates of fields to fill."""
    return {
        (coord_r, coord_c)
        for coord_r, row in enumerate(sudoku)
        for coord_c, field in enumerate(row)
        if field == 0
    }


def available_inputs(sudoku, empty_fields):
    """Returns possible digits to input for each field of given sudoku board."""
    possible = set(range(1,10))
    return [
        (coord_r, coord_c, possible - {
            *set(get_row(sudoku, coord_r)),
            *set(get_column(sudoku, coord_c)),
            *set(get_block(sudoku, coord_r, coord_c)),
            })
        for coord_r, coord_c in empty_fields
    ]


def no_conflicts(sudoku, coord_r, coord_c, current_value):
    """Procedure checks that the most recently introduced number is
    unique one in its row, column and block.
    """
    if current_value in get_row(sudoku, coord_r):
        return False

    if current_value in get_column(sudoku, coord_c):
        return False

    if current_value in get_block(sudoku, coord_r, coord_c):
        return False

    return True


def get_row(sudoku, coord_r):
    return sudoku[coord_r]


def get_column(sudoku, coord_c):
    return list(zip(*sudoku))[coord_c]


def get_block(sudoku, coord_r, coord_c):
    block_row = coord_r - coord_r%3
    block_col = coord_c - coord_c%3
    return [
        field
        for row in sudoku[block_row : block_row+3]
        for field in row[block_col : block_col+3]
    ]



if __name__ == '__main__':

    sudoku_text = sys.argv[1]

    with SudokuValidator(sudoku_text) as sv:
        valid_board = sv.board_validation

        empty_fields = get_empty(valid_board)
        fields_inputs = available_inputs(valid_board, empty_fields)
        solved_cells = solve_obv_fields(valid_board, empty_fields, fields_inputs)
        if solved_cells:
            print(json.dumps({'code': 0, 'result': solved_cells}))
        else:
            print(json.dumps({'code': 1, 'result': 'Not able to solve more...'}))
