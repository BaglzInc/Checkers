import Checkers from "../common/Checkers.js";
import R from "../common/ramda.js";

const grid_cols = 8;
const grid_rows = 8;
let board = Checkers.populate(Checkers.empty_board(grid_cols, grid_rows));
let king_map = Checkers.empty_king_map(grid_rows,grid_cols)
let current_player = 1; //since we update the player before we start the game, 2 will be the starting player
console.log(board)

document.documentElement.style.setProperty("--grid-rows", grid_rows);
document.documentElement.style.setProperty("--grid-columns", grid_cols);

const grid = document.getElementById("grid");
const footer = document.getElementById('footer');

const range = (n) => Array.from({'length': n}, (ignore, k) => k);

const cells = range(grid_rows).map(function (row_index) {
    const row = document.createElement('div');
    row.className = 'row';

    const rows = range(grid_cols).map(function (col_index) {
        //console.log(`(${row_index}, ${col_index})`);
        const cell = document.createElement('div');
        cell.className = 'cell';
        //cell.textContent = `(${row_index}, ${col_index})`;
        //cell.onclick = refresh_cell(0,0,row_index,col_index)
        row.append(cell);

        return cell;
    });
    grid.append(row);
    return rows;
});

const update_king = function (board,kmap) {
    king_map = Checkers.crown_player(board,kmap)
}

const refresh_cell = function (displace_1,displace_2,row_index,col_index) {
    const current_token = board[row_index][col_index]
    return function () {
        //update_king(board,king_map)
        //check_win(board)
        if (king_map[row_index][~~(col_index/2)] === false) {
            if (current_token === 1) {
                jump_piece_down(row_index + displace_1, col_index + displace_2)
                move_down(row_index + displace_1, col_index + displace_2)
            }
            else if (current_token === 2) {
                move(row_index + displace_1, col_index + displace_2)
                jump_piece(row_index + displace_1, col_index + displace_2)
            }
        }
        else {
        move(row_index + displace_1, col_index + displace_2)
        jump_piece(row_index + displace_1, col_index + displace_2)
        jump_piece_down(row_index + displace_1, col_index + displace_2)
        move_down(row_index + displace_1, col_index + displace_2)
        }
    };
}

const update_visuals = function (row_index,col_index) {
    const current_cell = cells[row_index][col_index]
    const token = board[row_index][col_index]
    current_cell.classList.remove("empty");
    current_cell.classList.remove("empty_display");
    current_cell.classList.remove("token_1");
    current_cell.classList.remove("token_2");
    current_cell.classList.remove("token_1_king");
    current_cell.classList.remove("token_2_king");
    if (token === 0 && Checkers.legal_tile(row_index,col_index)) {
        current_cell.classList.add("empty");
    }
    if (token === 0 && !Checkers.legal_tile(row_index,col_index)) {
        current_cell.classList.add("empty_display");
    }
    if (token === 1) {
        if (king_map[row_index][~~(col_index/2)] === true) {
            current_cell.classList.add("token_1_king")
        }
        else {
            current_cell.classList.add("token_1");
        }
    }
    if (token === 2) {
        if (king_map[row_index][~~(col_index/2)] === true) {
            current_cell.classList.add("token_2_king")
        }
        else {
            current_cell.classList.add("token_2");
        }
    }
}

const refresh_board = function () {
    update_king(board,king_map)
    check_win(board)
    const height = board.length
    const width = board[0].length
    R.forEach(function (x) {
        R.forEach(function (y) {
            cells[x][y].onclick = refresh_cell(0,0,x,y)
            update_visuals(x,y)
        },R.range(0,width))
    },R.range(0,height));
}

const stitch = function (board_1,board_2) {
    const count = R.range(0,board.length);
    return R.map(function (x) {
        return R.zip(board_1[x],board_2[x]);
    },count);
};


const check_win = function (board) {
if (Checkers.check_finish(board,king_map,current_player)) {
    let result;
    if (Checkers.player_win(1,board)) {
        result = 'The red player wins!';
    }
    else if (Checkers.player_win(2,board)) {
        result = 'The yellow player wins!';
    }
    else {
        result = 'The game ends in a draw.';
    }
    document.getElementById("result_message").textContent = (
        result
    );
    result_dialog.showModal();
    }
}

result_dialog.onclick = function () {
    board = Checkers.populate(Checkers.empty_board(grid_cols, grid_rows));
    king_map = Checkers.empty_king_map(grid_rows,grid_cols);
    //update_player() whoever lost will start the next game
    refresh_board()
    result_dialog.close();
};

result_dialog.onkeydown = result_dialog.onclick;

const update_player = function () {
current_player = 3 - current_player;
let result;
if (current_player === 1) {
    result = 'red';
}
else if (current_player === 2) {
    result = 'yellow';
}
document.getElementById("current_player").textContent = (
    `Current player: ${result}'s turn`
);
}

const check_jump = function (row_index,col_index) {
const current_token = board[row_index][col_index]
const left = Checkers.can_player_jump_left(board,current_token);
const right = Checkers.can_player_jump_right(board,current_token);
const mesh = stitch(left,right)
return mesh[row_index][~~(col_index/2)].includes(true)
}

const check_jump_down = function (row_index,col_index) {
    const updside_down = Checkers.flip_board(board)
    const current_token = updside_down[7-row_index][7-col_index]
    const left = Checkers.can_player_jump_left(updside_down,current_token);
    const right = Checkers.can_player_jump_right(updside_down,current_token);
    const mesh = stitch(left,right)
    const flipped = Checkers.flip_board(mesh)
    return flipped[row_index][(~~(col_index/2))].includes(true)

}

const move_click_right_down = function (token,direction,row_index,col_index) {
const cell_right = cells[row_index + 1][col_index + 1];
cell_right.onclick = function () {
    board = Checkers.move_piece_down(token,col_index,row_index,direction,board)
    king_map = Checkers.update_king_map_top(col_index,row_index,direction,king_map)
    console.log(board)
    update_player()
    refresh_board()
}
}
  
const move_click_left_down = function (token,direction,row_index,col_index) {
const cell_left = cells[row_index + 1][col_index - 1];
cell_left.onclick = function () {
    board = Checkers.move_piece_down(token,col_index,row_index,direction,board)
    king_map = Checkers.update_king_map_top(col_index,row_index,direction,king_map)
    console.log(board)
    update_player()
    refresh_board()
}
}

const remove_king = function (row,col) {
    king_map[row][col] = false
}

const jump_left_option = function (token,row_index,col_index) {
    const cell_left = cells[row_index - 2][col_index -2]
    cell_left.onclick = function () {
        board = Checkers.jump_piece_bottom(token,col_index,row_index,'left',board)
        king_map = Checkers.update_king_map_jump(col_index,row_index,'left',king_map)
        console.log(board)
        if (check_jump(row_index - 2,col_index - 2) || (king_map[row_index - 2][~~((col_index - 2)/2)] === true && check_jump_down(row_index - 2,col_index - 2))) {
            jump_piece(row_index - 2,col_index - 2)
            if (king_map[row_index - 2][~~((col_index - 2)/2)] === true) {
                    jump_piece_down(row_index -2,col_index - 2)
                }
                try {
                    const cell_below = cells [row_index - 1][col_index - 2]
                    cell_below.onclick = function () {
                        update_player()
                        refresh_board()
                    }
                }
                catch{}
                try {
                    var cell_above = cells [row_index - 3][col_index - 2]
                    cell_above.onclick = function () {
                        update_player()
                        refresh_board()
                    }
                }
                catch{}
            }
        else {
            update_player()
            refresh_board()
        }
    }
}

const jump_left_option_bottom = function (token,row_index,col_index) {
    const cell_left = cells[row_index + 2][col_index -2]
    cell_left.onclick = function () {
        board = Checkers.jump_piece_top(token,col_index,row_index,'left',board)
        king_map = Checkers.update_king_jump_top(col_index,row_index,'left',king_map)
        console.log(board)
        if (check_jump_down(row_index + 2,col_index - 2) || (king_map[row_index + 2][~~((col_index - 2)/2)] === true && check_jump(row_index + 2,col_index - 2))) {
            jump_piece_down(row_index + 2,col_index - 2)
            if (king_map[row_index + 2][~~((col_index - 2)/2)] === true) {
                    jump_piece(row_index + 2,col_index - 2)
                }
                try {
                    const cell_below = cells [row_index + 3][col_index -2]
                    cell_below.onclick = function () {
                        update_player()
                        refresh_board()
                    }
                }
                catch{}
                try {
                    var cell_above = cells [row_index + 1][col_index - 2]
                    cell_above.onclick = function () {
                        update_player()
                        refresh_board()
                    }
                }
                catch{}
            }
        else {
            update_player()
            refresh_board()
        }
    }
}

const jump_right_option = function (token,row_index,col_index) {
    const cell_right = cells[row_index - 2][col_index + 2]
    cell_right.onclick = function () {
        board = Checkers.jump_piece_bottom(token,col_index,row_index,'right',board)
        king_map = Checkers.update_king_map_jump(col_index,row_index,'right',king_map)
        console.log(board)
        if (check_jump(row_index - 2,col_index + 2) || (king_map[row_index - 2][~~((col_index + 2)/2)] === true && check_jump_down(row_index - 2,col_index + 2))) {
            jump_piece(row_index - 2,col_index + 2)
            if (king_map[row_index - 2][~~((col_index + 2)/2)] === true) {
                    jump_piece_down(row_index -2,col_index + 2)
                }
                try {
                    const cell_below = cells [row_index - 1][col_index + 2]
                    cell_below.onclick = function () {
                        update_player()
                        refresh_board()
                    }
                }
                catch{}
                try {
                    var cell_above = cells [row_index - 3][col_index + 2]
                    cell_above.onclick = function () {
                        update_player()
                        refresh_board()
                    }
                }
                catch{}
            }
        else {
            update_player()
            refresh_board()
        }
    }
}

const jump_right_option_bottom = function (token,row_index,col_index) {
    const cell_right = cells[row_index + 2][col_index + 2]
    cell_right.onclick = function () {
        board = Checkers.jump_piece_top(token,col_index,row_index,'right',board)
        king_map = Checkers.update_king_jump_top(col_index,row_index,'right',king_map)
        //console.log(board)
        if (check_jump_down(row_index + 2,col_index + 2) || (king_map[row_index + 2][~~((col_index + 2)/2)] === true && check_jump(row_index + 2,col_index + 2))) {
            jump_piece_down(row_index + 2,col_index + 2)
            if (king_map[row_index + 2][~~((col_index + 2)/2)] === true) {
                    jump_piece(row_index + 2,col_index + 2)
                }
                try {
                    const cell_below = cells [row_index + 1][col_index + 2]
                    cell_below.onclick = function () {
                        update_player()
                        refresh_board()
                    }
                }
                catch{}
                try {
                    var cell_above = cells [row_index + 3][col_index + 2]
                    cell_above.onclick = function () {
                        update_player()
                        refresh_board()
                    }
                }
                catch{}
            }
        else {
            update_player()
            refresh_board()
        }
    }
}

const move_click_right = function (token,direction,row_index,col_index) {
    const cell_right = cells[row_index - 1][col_index + 1];
    cell_right.onclick = function () {
        board = Checkers.move_piece(token,col_index,row_index,direction,board)
        king_map = Checkers.update_king_map_move(col_index,row_index,direction,king_map)
        console.log(board)
        update_player()
        refresh_board()
    }
}


const move_click_left = function (token,direction,row_index,col_index) {
    const cell_left = cells[row_index - 1][col_index - 1];
    cell_left.onclick = function () {
        board = Checkers.move_piece(token,col_index,row_index,direction,board)
        king_map = Checkers.update_king_map_move(col_index,row_index,direction,king_map)
        console.log(board)
        update_player()
        refresh_board()
    }
}


const move = function (row_index,col_index) {
    const current_token = board[row_index][col_index]
    const diag = Checkers.check_diagonal(board,current_token);
    const straight = Checkers.where_player_can_move_straight(board,current_token);
    const mesh = stitch(straight,diag);
    if (mesh[row_index][~~(col_index/2)].includes(true) && current_player === current_token) {
        if (Checkers.legal_moves(row_index,((board[0].length)/2)).includes('L')) {
            if(mesh[row_index][~~(col_index/2)][0] === true) {
                move_click_right(current_token,'straight',row_index,col_index);
            }
            if(mesh[row_index][~~(col_index/2)][1] === true) {
                move_click_left(current_token,'diagonal',row_index,col_index);
            }
        }
        else if (Checkers.legal_moves(row_index,((board[0].length)/2)).includes('R')) {
            if(mesh[row_index][~~(col_index/2)][0] === true) {
                move_click_left(current_token,'straight',row_index,col_index)
            }
            if(mesh[row_index][~~(col_index/2)][1] === true) {
                move_click_right(current_token,'diagonal',row_index,col_index)
            }
        }
    }
}

const move_down = function (row_index,col_index) {
    const current_token = board[row_index][col_index]
    const diag = Checkers.flip_board(Checkers.check_diagonal(Checkers.flip_board(board),current_token));
    const straight = Checkers.flip_board(Checkers.where_player_can_move_straight(Checkers.flip_board(board),current_token));
    const mesh = stitch(straight,diag)
    if (mesh[row_index][~~(col_index/2)].includes(true) && current_player === current_token) {
        if (Checkers.legal_moves(row_index,((board[0].length)/2)).includes('L')) {
            if(mesh[row_index][~~(col_index/2)][1] === true) {
                move_click_left_down(current_token,'diagonal',row_index,col_index)
            }
            if(mesh[row_index][~~(col_index/2)][0] === true) {
                move_click_right_down(current_token,'straight',row_index,col_index)
            }
        }
        else if (Checkers.legal_moves(row_index,((board[0].length)/2)).includes('R')) {
            if(mesh[row_index][~~(col_index/2)][0] === true) {
                move_click_left_down(current_token,'straight',row_index,col_index)
            }
            if(mesh[row_index][~~(col_index/2)][1] === true) {
                move_click_right_down(current_token,'diagonal',row_index,col_index)
            }
        }
    }
}

const jump_piece = function (row_index,col_index) {
    const current_token = board[row_index][col_index]
    const left = Checkers.can_player_jump_left(board,current_token);
    const right = Checkers.can_player_jump_right(board,current_token);
    const mesh = stitch(left,right)
    if ((Checkers.legal_tile(row_index, col_index) === true) && current_player === current_token) {
        if (mesh[row_index][~~(col_index/2)].includes(true)) {
            if (mesh[row_index][~~(col_index/2)][1] === true) {
                jump_right_option(current_token,row_index,col_index)
            }
            if (mesh[row_index][~~(col_index/2)][0] === true) {
                jump_left_option(current_token,row_index,col_index)
            }
        }
    }
}

const jump_piece_down = function (row_index,col_index) {
    const current_token = board[row_index][col_index]
    const left = Checkers.flip_board(Checkers.can_player_jump_left(Checkers.flip_board(board),current_token));
    const right = Checkers.flip_board(Checkers.can_player_jump_right(Checkers.flip_board(board),current_token));
    const mesh = stitch(left,right)
    if ((Checkers.legal_tile(row_index, col_index) === true) && current_player === current_token) {
        if (mesh[row_index][~~(col_index/2)].includes(true)) {
            if (mesh[row_index][~~(col_index/2)][0] === true) {
                jump_right_option_bottom(current_token,row_index,col_index)

            }
            if (mesh[row_index][~~(col_index/2)][1] === true) {
                jump_left_option_bottom(current_token,row_index,col_index)
            }
        }
    }
}


refresh_board()
update_player()

