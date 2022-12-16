import Checkers from '../common/Checkers.js';
import R from "../common/ramda.js";


const display_board = function (board) {
    return '\n' + JSON.stringify(board)
}


/**
 * Returns if the board is in a valid state.
 * A board is valid if all the following are true:
 * - The board is a rectangular 2d array containing only 0, 1, or 2 as elements.
 * - At most one player has a winning configuration.
 * - A space on the board that should remain blank at all times is currently filled.
 * @memberof Checkers.test
 * @function
 * @param {Board} board The board to test.
 * @throws if the board fails any of the above conditions.
 */
const throw_if_invalid = function (board) {
    // Rectangular array.
    if (!Array.isArray(board) || !Array.isArray(board[0])) {
        throw new Error(
            "The board is not a 2D array: " + display_board(board)
        );
    }
    const height = board[0].length;
    const rectangular = R.all(
        (column) => column.length === height,
        board
    );

    if (!rectangular) {
        throw new Error(
            "The board is not rectangular: " + display_board(board)
        );
    }

    //only valid tokens
    const token_or_empty = [0, 1, 2];
    const contains_valid_tokens = R.pipe(
        R.flatten,
        R.all((slot) => token_or_empty.includes(slot))
    )(board);

    if (!contains_valid_tokens) {
        throw new Error(
            "The board contains invalid tokens: " + display_board(board)
        );
    }

    //only one player is currently winning
    const winning_for_1 = Checkers.player_win(1,board);
    const winning_for_2 = Checkers.player_win(2,board);
    if (winning_for_1 && winning_for_2) {
        throw new Error(
            "The board is winning for both players: " + display_board(board)
        );
    }

    const check_row = function (row) {
        R.mapObjIndexed((current,index) => {
            if (index % 2 === 0) {
                if (current === 0) {
                    return true
                }
                else {
                    return false
                }
            }
            else {
                return true
            };
        },row)
    }

    //tokens are only placed on valid spaces in the grid
    const proper_setup = function (board) {
        return R.mapObjIndexed((current,index) => {
            if (index % 2 === 0){
                return check_row(current)
            }
            else if ( index % 2 === 1) {
                return check_row(R.reverse(current))
            }
        },board)

    };

    if (R.all((x => R.equals(x,true)),R.flatten(proper_setup(board))) === false) {
        throw new Error (
            'There is a blank space that is currently filled' + display_board(board)
        );
    };
};

describe('Initial board', function () {
    it('An empty board is a valid board', function () {
        const initial_board = Checkers.populate(Checkers.empty_board());
        throw_if_invalid(initial_board);
    })
    it('An empty board is not an ended board', function () {
        const board = Checkers.populate(Checkers.empty_board())
        if ( Checkers.check_finish(board,Checkers.empty_king_map()) === true) {
            throw new Error (
                'An initial board is ended' + display_board(board)
            )
        }
    })
    it('An empty board is populated only in the first and last three rows', function () {
        const initial_board = Checkers.populate(Checkers.empty_board());
        const check_row = (token,x) => R.equals(x,[0,token,0,token,0,token,0,token])
        const first_layer = [0,1,2]
        const second_layer = [5,6,7]
        const rows_checked = R.values(R.mapObjIndexed((current,index) => {
            if (index in first_layer) {
                if (index % 2 === 0) {
                    return check_row(1,current)
                }
                else if (index % 2 === 1) {
                    return check_row(1,R.reverse(current))
                }
            }

            else if ( index in second_layer) {
                if (index % 2 === 0) {
                    return check_row(2,current)
                }
                else if (index % 2 ===1) {
                    return check_row(2,R.reverse(current))
                }
            }
            else {
                return true
            }
        },initial_board))
        const is_true = x => R.equals(x,true)
        if (!R.all(is_true,rows_checked)) {
            throw new Error (
                'The board is setup incorrectly' + display_board(initial_board)
            )
        }
    })
    it('No player is winning an initial board', function () {
        const initial_board = Checkers.populate(Checkers.empty_board())
        const winning_for_1 = Checkers.player_win(1,initial_board);
        const winning_for_2 = Checkers.player_win(2,initial_board);
        if (winning_for_1 || winning_for_2) {
            throw new Error (
                'Someone is winning the initial board' + display_board(initial_board)
            )
        }
    })
})

/**
 * This function tests the jump of a token on a board and will throw if,
 * - The resultant board is invalid,
 * - The piece still remains in its original position on the board.
 * - The piece has not been placed at the index to which it was assigned.
 * - The piece that had been hopped still remains on the board.
 * @memberof Checkers.test
 * @function
 * @param {Board} board The board to test.
 * @throws if the board fails any of the above conditions.
 */
const throw_if_bad_jump_forward = function (token,col,row,direction,board) {
    const moved_board = Checkers.jump_piece_bottom(token,col,row,direction,board)
    throw_if_invalid(moved_board);
    if (moved_board[row][col] === token) {
        throw new Error (
            'the existing piece has not been removed from its original area' + display_board(moved_board)
        )
    }
    const smaller_board = Checkers.collapse_board(moved_board)
    if (direction === 'left') {
        if (smaller_board[row-2][~~(col/2)-1] !== token) {
            throw new Error (
                'the piece has not been moved to the right place' + display_board(moved_board)
            )
        }
    else if (direction === 'right') {
        if (smaller_board[row-2][~~(col/2)+1] !== token) {
            throw new Error (
                'the piece has not been moved to the right place' + display_board(moved_board)
            )
        }
    }
    if (direction === 'left') {
        if (row & 2 === 1) {
            if (smaller_board[row-1][~~(col/2)-1] !== token) {
                throw new Error (
                    'the jumped piece has not been removed' + display_board(moved_board)
                )
            }
        }
        else if (row % 2 === 0) {
            if (smaller_board[row-1][~~(col/2)] !== 0) {
                throw new Error (
                    'the jumped piece has not been removed' + display_board(moved_board)
                )
            }
        }
    }
    else if (direction === 'right') {
        if (row & 2 === 1) {
            if (smaller_board[row-1][~~(col/2)+1] !== token) {
                throw new Error (
                    'the jumped piece has not been removed' + display_board(moved_board)
                )
            }
        }
        else if (row % 2 === 0) {
            if (smaller_board[row-1][~~(col/2)] !== token) {
                throw new Error (
                    'the jumped piece has not been removed' + display_board(moved_board)
                )
            }
        }
    }
    }
}

describe('Jumping a piece', function () {
    it('Jumping mechanic has been executed correctly', function () {
        const initial_board = Checkers.populate(Checkers.empty_board())
        const odd_row__board = [
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0],
            [2, 0, 2, 0, 2, 0, 2, 0],
            [0, 2, 0, 2, 0, 2, 0, 2],
            [2, 0, 2, 0, 2, 0, 2, 0]]
        const even_row_board = [
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 2, 0, 2, 0, 2, 0, 2],
            [2, 0, 2, 0, 2, 0, 2, 0]]
        //const board_post_jump = Checkers.jump_piece_bottom(2,4,5,'left',setup_board)
        throw_if_bad_jump_forward(2,6,5,'left',odd_row__board)
        throw_if_bad_jump_forward(2,4,5,'right',odd_row__board)
        throw_if_bad_jump_forward(2,1,6,'right',even_row_board)
        throw_if_bad_jump_forward(2,3,6,'left',even_row_board)
    })
})

describe('King tests', function () {
    const check_boolean = function (board) {
        const bools = [true,false]
        if (!R.all(x => bools.includes(x))(R.flatten(board))) {
            throw new Error (
                'The king map contains objects other than boolean statments' + display_board(board)
            )
        }
    }
    it('Only contains booleans', function () {
        const empty = Checkers.empty_king_map()
        const kinged = Checkers.crown_player([
            [0, 2, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 2, 0, 2, 0, 2, 0, 2],
            [2, 0, 2, 0, 2, 0, 2, 0]],empty)
        check_boolean(kinged)
    })
    const size_check = function (board) {
        const king_map = Checkers.empty_king_map(board.length,board[0].length)
        if (king_map.length !== board.length) {
            throw new Error (
                'your king map is not the right height' + display_board(board)
            )
        }
        else if (king_map[0].length !== ~~(board[0].length/2)) {
            throw new Error (
                'your king map is not the right width' + display_board(board)
            )
        }
    }
    it('Proper king map dimensions', function () {
        const test_board = Checkers.populate(Checkers.empty_board())
        size_check(test_board)
    })
    const only_crowns_outer_lines = function (board) {
        const empty = Checkers.empty_king_map(board.length,board.length[0])
        const kinged = Checkers.crown_player(board,empty)
        const accepted_rows = [0,7]
        const accepted_values = [true,false]
        const accepted = R.mapObjIndexed((current,index) => {
            if (accepted_rows.includes(index)) {
                if (accepted_values.includes(current)) {
                    return true
                }
                else {
                    return false
                }
            }
            else {
                if (current !== false) {
                    return false
                }
            }
        },kinged)
        if (!R.all(x => R.equals(x,true),accepted)) {
            throw new Error (
                'A king was crowned outside the outer most rows' + display_board(board)
            )
        }
    }
    it('Only crowns pieces in the outer rows', function () {
        const kingable_map_bottom = [
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 2, 0, 2, 0, 2, 0, 2],
            [2, 0, 1, 0, 2, 0, 2, 0]] 
        const kingable_map_top = [
            [0, 1, 0, 1, 0, 1, 0, 2],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [2, 0, 1, 0, 1, 0, 2, 0]] 
        only_crowns_outer_lines(kingable_map_bottom)
        only_crowns_outer_lines(kingable_map_top)
    })
    const king_moves_properly = function(col,row,direction,king_map) {
        const updated = Checkers.update_king_map_move(col,row,direction,king_map)
        if (updated[row][~~(col/2)] !== false) {
            throw new Error (
                'the piece has not been moved out of its spot' + display_board(king_map)
            )
        }
        if (direction === 'straight') {
            if (updated[row-1][~~(col/2)] !== true) {
                throw new Error (
                    'Your king map has not moved the king to the right space' + display_board(king_map)
                )
            }
        else if (direction === 'diagonal' && R.equals(Checkers.legal_moves(row)[~~(col/2)],'L')) {
            if (updated[row-1][~~(col/2)-1] !== true) {
                throw new Error (
                    'Your king map has not moved the king to the right space' + display_board(king_map)
                )
            }
        else if (direction === 'diagonal' && R.equals(Checkers.legal_moves(row)[~~(col/2)],'R')) {
            if (updated[row-1][~~(col/2)+1] !== true) {
                throw new Error (
                    'Your king map has not moved the king to the right space' + display_board(king_map)
                )
            }
        }
        }
        }
    }
    it('King moves properly', function () {
        const empty = Checkers.empty_king_map()
        const kingable_map_top = [
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [2, 0, 2, 0, 1, 0, 2, 0]] 
        const kinged = Checkers.crown_player(kingable_map_top,empty)
        king_moves_properly(4,7,'straight',kinged)
        king_moves_properly(4,7,'diagonal',kinged)
    })
})

