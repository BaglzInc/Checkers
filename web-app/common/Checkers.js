import R from "../common/ramda.js";

/**
 * Checkers.js is a module to model and play "Checkers" and related games.
 * @namespace Checkers
 * @author William Baglole
 * @version 2021/22
 */

/**
 * A Board is an rectangular grid that tokens can be placed into one at a time.
 * Tokens moves throughout the board and can be removed by being jumped over by
 * the opposing token
 * @memberof Checkers
 * @typedef {Checkers.Token_or_empty[][]} Board
 */

/**
 * A boolean king map is a collapsed version of a rectangular grid that tracks
 * wether a piece is a king or not by assigning its equivalent position in the grid
 * of where it would be on the board with a true or false value.
 * @memberof Checkers
 * @typedef {Checkers.booleans[][]} king_map
 */

/**
 * A token is a coloured disk that players place in the grid.
 * @memberof Checkers
 * @typedef {(1 | 2)} Token
 */

/**
 * A boolean is either true or false.
 * @memberof Checkers
 * @typedef {(true | false)} booleans
 */

/**
 * Either a token or an empty position.
 * @memberof Checkers
 * @typedef {(Checkers.Token | 0)} Token_or_empty
 */

const Checkers = Object.create(null);


/**
 * Create a new empty board.
 * Optionally with a specified width and height,
 * otherwise returns a standard 8 wide, 8 high board.
 * @memberof Checkers
 * @function
 * @param {number} [width = 8] The width of the new board.
 * @param {number} [height = 8] The height of the new board.
 * @returns {Checkers.Board} board An empty Checkers board.
 */
Checkers.empty_board = function (height = 8, width = 8) {
    return R.repeat(R.repeat(0,height),width);
};

/**
 * Populates an empty board.
 * - The first 3 rows (starting from the top) should only have 1 tokens interchangining
 * with 0 tokens every index. Further more each row should change which token it starts with,
 * starting with a 0 token in the top left of the board.
 * - The last 3 rows (starting from the bottom) should only have 2 tokens interlacing with 0
 * tokens in the same configuration as the top rows with a 2 in the bottom left of the board.
 * - On a standard 8x8 board the two middle rows should only be populated with 0 tokens. 
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board An empty Checkers board.
 * @returns {Checkers.Board} board An empty Checkers board.
 */
Checkers.populate = function (board) {
    const bottom = Checkers.pop_bottom_side(2,board)
    return Checkers.pop_top_side(1,bottom)
};

Checkers.pop_bottom_side = function (token,board) {
    return R.transpose(R.reverse(R.transpose(R.reverse(Checkers.pop_top_side(token,board))))) 
}

Checkers.pop_top_side = function (token,board){
    const first = Checkers.update_row(token,board,0)
    const second = Checkers.update_inv_row(token,first,1)
    return Checkers.update_row(token, second,2)
}

Checkers.update_row = function (token,board,row) {
    return R.update(row,Checkers.pop_row(token,board[row]),board)
}

Checkers.update_inv_row = function (token,board,row) {
    return R.update(row,Checkers.pop_inv_row(token,board[row]),board)
}

Checkers.pop_inv_row = function(token,row) {
    return R.reverse(Checkers.pop_row(token,row))
}

Checkers.pop_row = function (token,row) {
    return R.values(R.mapObjIndexed((currentitem,index) => {
        if (index % 2 === 1) {
            return token
        }
        else {
            return 0
        }
    },row))
}


/**
 * Returns if a game has ended,
 * this occurs when only a single player's token and
 * empty spaces (i.e 0 tokens) remain.
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board The board to test.
 * @param {Checkers.king_map} king_map The board's related boolean king map.
 * @returns {boolean} Whether the game has ended.
 */
Checkers.check_finish = function (board,king_map,current) { 
    return Checkers.player_win(1,board) ||
    Checkers.player_win(2,board) ||
    Checkers.game_draw(board,king_map,current)
}

Checkers.game_draw = function(board,king_map,current) {
    return (Checkers.player_1_draw(board,king_map) && current === 1) ||
    (Checkers.player_2_draw(board,king_map && current === 2))
}

Checkers.player_1_draw = function (board,king_map) {
    return Checkers.player_draw(1,Checkers.flip_board(board),king_map)
}

Checkers.player_2_draw = function (board,king_map) {
    return Checkers.player_draw(2,board,king_map)
}


/**
 * Returns if a player can move any of his tokens
 * in any legal direction. This includes if their tokens
 * are kings and if they can jump the opposing player.
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board The board to test.
 * @param {Checkers.king_map} king_map The board's related boolean king map.
 * @returns {boolean} Whether the player can move.
 */
Checkers.player_draw = function (token,board,king_map) {
    //console.log(!Checkers.player_move(token,board),!Checkers.player_jump(token,board),!Checkers.king_backwards_move_check(token,board,king_map),!Checkers.king_backwards_jump_check(token,board,king_map))
    return !Checkers.player_move(token,board) &&
    !Checkers.player_jump(token,board) &&
    !Checkers.king_backwards_move_check(token,board,king_map) &&
    !Checkers.king_backwards_jump_check(token,board,king_map)

}

Checkers.player_move = function (token,board) {
    const straight_moves = Checkers.where_player_can_move_straight(board,token)
    const diagonal_moves = Checkers.check_diagonal(board,token)
    return R.flatten(straight_moves).includes(true) || R.flatten(diagonal_moves).includes(true)
}

Checkers.player_jump = function (token,board) {
    const left_jump = Checkers.can_player_jump_left(board,token)
    const right_jump = Checkers.can_player_jump_right(board,token)
    return R.flatten(left_jump).includes(true) || R.flatten(right_jump).includes(true)
}

Checkers.compare_maps = function (b1,b2) {
    const flat = R.flatten(b2)
    const compared_maps = R.values(R.mapObjIndexed((currentitem,index) => {
        return R.equals(currentitem,flat[index]) && R.equals(currentitem,true) 
    },R.flatten(b1)))
    return R.flatten(compared_maps).includes(true)
}

Checkers.king_backwards_move_check = function (token,board,king_map) {
    const straight_moves = Checkers.where_player_can_move_straight(Checkers.flip_board(board),token)
    const diagonal_moves = Checkers.check_diagonal(Checkers.flip_board(board),token)
    return Checkers.compare_maps(straight_moves,king_map) || Checkers.compare_maps(diagonal_moves,king_map)
}

Checkers.king_backwards_jump_check = function (token,board,king_map) {
    const left_jump = Checkers.can_player_jump_left(Checkers.flip_board(board),token)
    const right_jump = Checkers.can_player_jump_right(Checkers.flip_board(board),token)
    return Checkers.compare_maps(left_jump,king_map) || Checkers.compare_maps(right_jump,king_map)
}

Checkers.player_win = function (player,board) {
    //const unique = x => x in [0,player];
    return !R.flatten(board).includes(3-player)//R.filter(unique, R.flatten(board)).length === R.flatten(board).length
}

/**
 * Returns a checkers board that is effectively void of any
 * unecessary spaces. Since checkers pieces can only move
 * diagonally though a standard board has 64 spaces only 32 of
 * these spaces are actually used.
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board The board we want to collapse.
 * @returns {Checkers.Board} A collapsed board that has the same height but half the width.
 */
Checkers.collapse_board = function (board) {
    return R.values(R.mapObjIndexed((currentitem,index) =>{
        if (index % 2 === 0) {
            return Checkers.collapse_row(currentitem)
        }
        else  {
            return R.reverse(Checkers.collapse_row(R.reverse(currentitem)))
        }
    },board));
};

Checkers.collapse_row = function (row) {
    const remove = x => x % 2 === 1;
    return row.filter((currentitem,index)=> {
        return remove(index)
    });
    }


/**
 * Returns a collapsed checkers board that has been repopulated
 * with its spaces. It factors in the asymetric nature of the board
 * and repopulates it accordingly depending on the parity of the row's index.
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board A collapsed board.
 * @returns {Checkers.Board} A repopulated board with the same height and twice the width.
 */
Checkers.reform_board = function(board) {
    return R.values(R.mapObjIndexed((currentitem,index) => {
        if (index % 2 === 0) {
            return Checkers.reform_row_even(currentitem);
        }
        else {
            return Checkers.reform_row_odd((currentitem));
        };
    },board));
};

Checkers.reform_row_even = function (row) {
    const add = x => R.insert(0,0,x)
    return  R.flatten(R.map(add,R.aperture(1,row)));
};

Checkers.reform_row_odd = function (row) {
    const add = x => R.append(0,x)
    return  R.flatten(R.map(add,R.aperture(1,row)));
};


/**
 * Takes as argument a row's index and returns its each cell's legal moves.
 * @memberof Checkers
 * @function
 * @param {number} row A row's index.
 * @param {number} width the size of the collapsed row.
 * @returns {Array} An array indicating the legal moves of each of the row's cell based
 * on its index. 'S' signifies it can only move straight while 'L' means it can move left
 * as well as straight and 'R' the same but right.
 */

const generate_legal_row = function (side,width) {
    return R.drop(1,R.append('S',R.repeat(side,width)))
}
Checkers.legal_moves = function (row,width) {
    if (row % 2 === 0) {
        return generate_legal_row('R',width)
    }
    else if (row % 2 === 1) {
        return R.reverse(generate_legal_row('L',width))
    }
}

Checkers.legal_tile = function(row,col) {
    if (row % 2 === 0) {
        if (col % 2 === 1) {
            return true
        }
    }
    else if (row % 2 === 1) {
        if (col % 2  === 0) {
            return true
        }
    }
}

/**
 * Returns a collapsed boolean map of the board. A true value indicates that the
 * piece that resides in that cell has the ability to move forward where as the 
 * false values indicates it cannot
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board A checkers board.
 * @param {Checkers.token} token the player as to which we are enquiring.
 * @returns {Checkers.Board} A collapsed boolean map with the same height and half the width.
 */
Checkers.where_player_can_move_straight = function (board,token) {
    const smaller_board = Checkers.collapse_board(board)
    const flipped_board = R.transpose(smaller_board)
    const pairs = x => R.aperture(2,x)
    const straight_moves = R.map(pairs,flipped_board)
    const open = function (x) {
        if (R.equals(x,[0,token])) {
            return true
        }
        else {
            return false
        }
    }
    const playable_straight_moves = R.map(R.map(open),straight_moves)
    const rearranged_board = R.insert(0,[false,false,false,false],R.transpose(playable_straight_moves))
    return rearranged_board
}

Checkers.move_x = function (row) {
    const longer = R.insert(0,'x',row)
    return R.reverse(R.drop(1,R.reverse(longer)))
}

/**
 * Returns a collapsed boolean map of the board. A true value indicates that the
 * piece that resides in that cell has the ability to move diagonally where as the 
 * false values indicates it cannot
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board A checkers board.
 * @param {Checkers.token} token the player as to which we are enquiring.
 * @returns {Checkers.Board} A collapsed boolean map with the same height and half the width.
 */
Checkers.check_diagonal = function (board,token) {
    const smaller_board = Checkers.collapse_board(board)
    const flipped_board = R.transpose(smaller_board)
    const pairs = x => R.aperture(2,x)
    const straight_moves = R.map(pairs,flipped_board) 
    const segmented = R.map(R.transpose,R.transpose(straight_moves))
    const adjusted = R.values(R.mapObjIndexed((currentitem,index) => {
        if (index % 2 === 0) {
            return R.update(0,Checkers.move_x(currentitem[0]),currentitem)
        }
        else if (index % 2 === 1) {
            return R.update(0,R.reverse(Checkers.move_x(R.reverse(currentitem[0]))),currentitem)
        }
    },segmented))
    const readjusted = R.map(R.transpose,adjusted)
    const open = function (x) {
        if (R.equals(x,[0,token])) {
            return true
        }
        else {
            return false
        }
    }
    const playable_left_jumps = R.map(R.map(open),readjusted)
    return R.insert(0,[false,false,false,false],playable_left_jumps)
}

Checkers.move_one_square = function (row) {
    const longer = R.insert(0,'x',row)
    return R.reverse(R.drop(1,R.reverse(longer)))
}

/**
 * Returns a checkers board with a piece located in a specified row and coloumn 
 * that has been moved in a specified direction. In the process it also removes
 * the previous position of the piece. It also has a safety check where you specify
 * the wether the piece belongs to player 1 or 2 and will only proceed if the piece
 * matches the one specified. Lastly this function only moves pieces from the bottom 
 * of the board to the top. 
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board A checkers board.
 * @param {Checkers.token} token the player as to which we are enquiring.
 * @param {('straight' | 'diagonal')} direction indicates which way the player moves. 
 * @param {number} row indicates the row of the piece you want to move
 * @param {number} col indicates the coloumn of the piece you want to move 
 * @returns {Checkers.Board} An updated board with the same height and width.
 */
Checkers.move_piece = function (token,col,row,direction,board) {
    const smaller_board = Checkers.collapse_board(board)
    if (direction === 'straight'){
        const straight = Checkers.where_player_can_move_straight(board,token)
        if (R.equals(board[row][col],token) && R.equals(straight[row][~~(col/2)],true)){
            const new_piece = R.update(row-1,R.update((~~(col/2)),token,smaller_board[row-1]),smaller_board)
            return Checkers.reform_board(R.update(row,R.update((~~(col/2)),0,smaller_board[row]),new_piece))
        }
    }
    else if (direction === 'diagonal'){
        const diagonals = Checkers.check_diagonal(board,token)
        if (R.equals(board[row][col],token) && R.equals(diagonals[row][~~(col/2)],true)){
            if (R.equals(Checkers.legal_moves(row,((board[0].length)/2))[~~(col/2)],'L')){
                const new_piece = R.update(row-1,R.update((~~(col/2)-1),token,smaller_board[row-1]),smaller_board)
                return Checkers.reform_board(R.update(row,R.update((~~(col/2)),0,new_piece[row]),new_piece))
            }
            else if (R.equals(Checkers.legal_moves(row,((board[0].length)/2))[~~(col/2)],'R')){
                const new_piece = R.update(row-1,R.update((~~(col/2)+1),token,smaller_board[row-1]),smaller_board)
                return Checkers.reform_board(R.update(row,R.update((~~(col/2)),0,new_piece[row]),new_piece))
            }
        }
    }
}


/**
 * Returns a checkers board with a piece located in a specified row and coloumn 
 * that has been moved in a specified direction. In the process it also removes
 * the previous position of the piece. It also has a safety check where you specify
 * the wether the piece belongs to player 1 or 2 and will only proceed if the piece
 * matches the one specified. Lastly this function only moves pieces from the top 
 * of the board to the bottom. 
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board A checkers board.
 * @param {Checkers.token} token the player as to which we are enquiring.
 * @param {('straight' | 'diagonal')} direction indicates which way the player moves. 
 * @param {number} row indicates the row of the piece you want to move
 * @param {number} col indicates the coloumn of the piece you want to move 
 * @returns {Checkers.Board} An updated board with the same height and width.
 */
Checkers.move_piece_down = function (token,col,row,direction,board) {
    const flip = Checkers.flip_board(board)
    return Checkers.flip_board(Checkers.move_piece(token,7-col,7-row,direction,flip))
}


/**
 * Returns a collapsed boolean map of the board. A true value indicates that the
 * piece that resides in that cell has the ability to jump forward and to the left
 *  where as the false values indicates it cannot.
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board A checkers board.
 * @param {Checkers.token} token the player as to which we are enquiring.
 * @returns {Checkers.Board} A collapsed boolean map with the same height and half the width.
 */
Checkers.can_player_jump_left = function(board,token) {
    const smaller_board = Checkers.collapse_board(board)
    const flipped_board = R.transpose(smaller_board)
    const pairs = x => R.aperture(3,x)
    const straight_moves = R.map(pairs,flipped_board) 
    const segmented = R.map(R.transpose,R.transpose(straight_moves))
    const adjusted = R.values(R.mapObjIndexed((currentitem,index) => {
        if (index % 2 === 0) {
            return R.update(0,Checkers.move_one_square(currentitem[0]),currentitem) 
        }
        else if (index % 2 === 1) {
            const row_move = R.update(1,Checkers.move_one_square(currentitem[1]),currentitem)
            return R.update(0,Checkers.move_one_square(currentitem[0]),row_move)
        }
    },segmented))
    const readjusted = R.map(R.transpose,adjusted)
    const open = function (x) {
        if (R.equals(x,[0,2-token+1,token])) {
            return true
        }
        else {
            return false
        }
    }
    const playable_left_jumps = R.map(R.map(open),readjusted)
    return R.insert(0,[false,false,false,false],R.insert(0,[false,false,false,false],playable_left_jumps))
}


/**
 * Returns a collapsed boolean map of the board. A true value indicates that the
 * piece that resides in that cell has the ability to jump forward and to the right
 *  where as the false values indicates it cannot.
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board A checkers board.
 * @param {Checkers.token} token the player as to which we are enquiring.
 * @returns {Checkers.Board} A collapsed boolean map with the same height and half the width.
 */
Checkers.can_player_jump_right = function (board,token) {
    const smaller_board = Checkers.collapse_board(board)
    const flipped_board = R.transpose(smaller_board)
    const pairs = x => R.aperture(3,x)
    const straight_moves = R.map(pairs,flipped_board) 
    const segmented = R.map(R.transpose,R.transpose(straight_moves))
    const adjusted = R.values(R.mapObjIndexed((currentitem,index) => {
        if (index % 2 === 0) {
            const row_move = R.update(1,R.reverse(Checkers.move_one_square(R.reverse(currentitem[1]))),currentitem)
            return R.update(0,R.reverse(Checkers.move_one_square(R.reverse(row_move[0]))),row_move)
        }
        else if (index % 2 === 1) {
            return R.update(0,R.reverse(Checkers.move_one_square(R.reverse(currentitem[0]))),currentitem)
        }
    },segmented))
    const readjusted = R.map(R.transpose,adjusted)
    const open = function (x) {
        if (R.equals(x,[0,2-token+1,token])) {
            return true
        }
        else {
            return false
        }
    }
    const playable_left_jumps = R.map(R.map(open),readjusted)
    return R.insert(0,[false,false,false,false],R.insert(0,[false,false,false,false],playable_left_jumps))
}


/**
 * Returns a checkers board with a piece located in a specified row and coloumn 
 * that has jumped another piece in a specified direction. In the process it also removes
 * the previous position of the piece as well as the piece you jumped. It also has a safety
 * check where you specify the wether the piece belongs to player 1 or 2 and will only proceed 
 * if the piece matches the one specified. Lastly this function only moves pieces from the bottom 
 * of the board to the top. 
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board A checkers board.
 * @param {Checkers.token} token the player as to which we are enquiring.
 * @param {('left' | 'right')} direction indicates which way the player moves. 
 * @param {number} row indicates the row of the piece you want to move
 * @param {number} col indicates the coloumn of the piece you want to move 
 * @returns {Checkers.Board} An updated board with the same height and width.
 */
Checkers.jump_piece_bottom = function (token,col,row,direction,board) {
    const smaller_board = Checkers.collapse_board(board)
    if (direction === 'left') {
        const possible = Checkers.can_player_jump_left(board,token)
        if (R.equals(board[row][col],token) && R.equals(possible[row][~~(col/2)],true)){
            if (row % 2 === 1) {
                const new_piece = R.update(row-2,R.update((~~(col/2)-1),token,smaller_board[row-2]),smaller_board)
                const remove_opp = R.update(row-1,R.update((~~(col/2)-1),0,new_piece[row-1]),new_piece)
                return Checkers.reform_board(R.update(row,R.update((~~(col/2)),0,remove_opp[row]),remove_opp))
            }
            else if (row % 2 === 0) {
                const new_piece = R.update(row-2,R.update((~~(col/2)-1),token,smaller_board[row-2]),smaller_board)
                const remove_opp = R.update(row-1,R.update((~~(col/2)),0,new_piece[row-1]),new_piece)
                return Checkers.reform_board(R.update(row,R.update((~~(col/2)),0,remove_opp[row]),remove_opp))
            }
        }
    }
    else if (direction === 'right') {
        const possible = Checkers.can_player_jump_right(board,token)
        if (R.equals(board[row][col],token) && R.equals(possible[row][~~(col/2)],true)){
            if (row % 2 === 1) {
                const new_piece = R.update(row-2,R.update((~~(col/2)+1),token,smaller_board[row-2]),smaller_board)
                const remove_opp = R.update(row-1,R.update((~~(col/2)),0,new_piece[row-1]),new_piece)
                return Checkers.reform_board(R.update(row,R.update((~~(col/2)),0,remove_opp[row]),remove_opp)) 
            }
            else if (row % 2 === 0) {
                const new_piece = R.update(row-2,R.update((~~(col/2)+1),token,smaller_board[row-2]),smaller_board)
                const remove_opp = R.update(row-1,R.update((~~(col/2)+1),0,new_piece[row-1]),new_piece)
                return Checkers.reform_board(R.update(row,R.update((~~(col/2)),0,remove_opp[row]),remove_opp))
            }
        }
    }
}


/**
 * Returns a checkers board with a piece located in a specified row and coloumn 
 * that has jumped another piece in a specified direction. In the process it also removes
 * the previous position of the piece as well as the piece you jumped. It also has a safety
 * check where you specify the wether the piece belongs to player 1 or 2 and will only proceed 
 * if the piece matches the one specified. Lastly this function only moves pieces from the top 
 * of the board to the bottom. 
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board A checkers board.
 * @param {Checkers.token} token the player as to which we are enquiring.
 * @param {('left' | 'right')} direction indicates which way the player moves. 
 * @param {number} row indicates the row of the piece you want to move
 * @param {number} col indicates the coloumn of the piece you want to move 
 * @returns {Checkers.Board} An updated board with the same height and width.
 */
Checkers.jump_piece_top = function (token,col,row,direction,board) {
    if (direction === 'left') {
        return Checkers.flip_board(Checkers.jump_piece_bottom(token,7-col,7-row,'right',Checkers.flip_board(board)))
    }
    else if (direction === 'right') {
        return Checkers.flip_board(Checkers.jump_piece_bottom(token,7-col,7-row,'left',Checkers.flip_board(board))) 
    }
}


/**
 * Returns a checkers board that has been flipped about the horizontal and
 * vertical axis. For reference if a board is flipped twice it returns to 
 * its original state.
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board A checkers board.
 * @returns {Checkers.Board} An updated board with the same height and width.
 */
Checkers.flip_board = function (board) {
    return R.transpose(R.reverse(R.transpose(R.reverse(board))))
}


/**
 * Create a new empty boolean map that is used to tell
 * rather a piece is a king or not.
 * Optionally with a specified width and height,
 * otherwise returns a standard 8 wide, 8 high board.
 * @memberof Checkers
 * @function
 * @param {number} [width = 8] Twice the width of the new board.
 * @param {number} [height = 8] The height of the new board.
 * @returns {Checkers.king_map} An empty king map with the same height and half the width.
 */
Checkers.empty_king_map = function (height = 8, width = 8) {
    return R.repeat(R.repeat(false,~~(width/2)),height);
};


/**
 * Populates an empty board.
 * - The first 3 rows (starting from the top) should only have 1 tokens interchangining
 * with 0 tokens every index. Further more each row should change which token it starts with,
 * starting with a 0 token in the top left of the board.
 * - The last 3 rows (starting from the bottom) should only have 2 tokens interlacing with 0
 * tokens in the same configuration as the top rows with a 2 in the bottom left of the board.
 * - On a standard 8x8 board the two middle rows should only be populated with 0 tokens. 
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board An empty Checkers board.
 * @returns {Checkers.king_map} An updated king map.
 */
Checkers.crown_player = function (board,king_map) {
    const smaller_board = Checkers.collapse_board(board)
    if (smaller_board[0].includes(2)) {
        return R.update(0,R.update(R.indexOf(2,smaller_board[0]),true,king_map[0]),king_map)
    }
    if (smaller_board[7].includes(1)) {
        return R.update(7,R.update(R.indexOf(1,smaller_board[7]),true,king_map[7]),king_map)
    }
    else {
        return king_map
    }
}


/**
 * Returns a checkers board with a piece located in a specified row and coloumn 
 * that has been moved in a specified direction (either straight or diagonal) as
 * well as in a specified orientation (either forward or backwards). In the process 
 * it also removes the previous position of the piece. It also has a safety check where 
 * you specify the wether the piece belongs to player 1 or 2 and will only proceed if the piece
 * matches the one specified.
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board A checkers board.
 * @param {Checkers.token} token the player as to which we are enquiring.
 * @param {('straight' | 'diagonal')} direction indicates which direction the move is made. 
 * @param {('forward' | 'backward')} orientation indicates which way the player moves up or down the board. 
 * @param {number} row indicates the row of the piece you want to move
 * @param {number} col indicates the coloumn of the piece you want to move 
 * @returns {Checkers.Board} An updated board with the same height and width.
 */
Checkers.move_king = function (token,col,row,direction,orientation,board,king_map) {
    if (R.equals(orientation,'forward') &&
    R.equals(king_map[row][~~(col/2)],true) &&
    R.equals(board[row][col],token)) {
        return Checkers.move_piece(token,col,row,direction,board)
    }
    else if (R.equals(orientation,'backward') &&
    R.equals(king_map[row][~~(col/2)],true) &&
    R.equals(board[row][col],token)) {
        return Checkers.move_piece_down(token,col,row,direction,board)
    }
}


/**
 * Returns an updated king map where the piece located in a specified row and coloumn will
 * be moved in a specified direction. The old location of the true value will be removed
 * and replaced in the correct index. Lastly this function only moves pieces from the bottom
 * of the board towards the top.
 * @memberof Checkers
 * @function
 * @param {Checkers.king_map} board A populated king map.
 * @param {('straight' | 'diagonal')} direction indicates which direction the move is made. 
 * @param {number} row indicates the row of the piece you want to move
 * @param {number} col indicates the coloumn of the piece you want to move 
 * @returns {Checkers.king_map} An updated king map.
 */
Checkers.update_king_map_move = function (col,row,direction,king_map) {
    if (direction === 'straight'){
        if (R.equals(king_map[row][~~(col/2)],true)){
            const new_piece = R.update(row-1,R.update((~~(col/2)),true,king_map[row-1]),king_map)
            return (R.update(row,R.update((~~(col/2)),false,king_map[row]),new_piece))
        }
    }
    else if (direction === 'diagonal'){
        if (R.equals(king_map[row][~~(col/2)],true)){
            if (R.equals(Checkers.legal_moves(row,(king_map[0].length))[~~(col/2)],'L')){
                const new_piece = R.update(row-1,R.update((~~(col/2)-1),true,king_map[row-1]),king_map)
                return (R.update(row,R.update((~~(col/2)),false,new_piece[row]),new_piece))
            }
            else if (R.equals(Checkers.legal_moves(row,(king_map[0].length))[~~(col/2)],'R')){
                const new_piece = R.update(row-1,R.update((~~(col/2)+1),true,king_map[row-1]),king_map)
                return (R.update(row,R.update((~~(col/2)),false,new_piece[row]),new_piece))
            }
        }
    }
    if (king_map[row][~~(col/2)] === false) {
        return king_map
    }
}


/**
 * Returns an updated king map where the piece located in a specified row and coloumn will
 * be moved in a specified direction. The old location of the true value will be removed
 * and replaced in the correct index. Lastly this function only moves pieces from the top
 * of the board towards the bottom.
 * @memberof Checkers
 * @function
 * @param {Checkers.king_map} board A populated king map.
 * @param {('straight' | 'diagonal')} direction indicates which direction the move is made. 
 * @param {number} row indicates the row of the piece you want to move
 * @param {number} col indicates the coloumn of the piece you want to move 
 * @returns {Checkers.king_map} An updated king map.
 */
Checkers.update_king_map_top = function (col,row,direction,king_map) {
    const flip = Checkers.flip_board(king_map)
    return Checkers.flip_board(Checkers.update_king_map_move(7-col,7-row,direction,flip))
}


/**
 * Returns a checkers board with a piece located in a specified row and coloumn 
 * that has jumped in a specified direction (either straight or diagonal) as
 * well as in a specified orientation (either forward or backwards). In the process 
 * it also removes the previous position of the piece and the piece it had jumped over.
 *  It also has a safety check where you specify the wether the piece belongs to player 
 * 1 or 2 and will only proceed if the piece matches the one specified.
 * @memberof Checkers
 * @function
 * @param {Checkers.Board} board A checkers board.
 * @param {Checkers.token} token the player as to which we are enquiring.
 * @param {('straight' | 'diagonal')} direction indicates which direction the move is made. 
 * @param {('forward' | 'backward')} orientation indicates which way the player moves up or down the board. 
 * @param {number} row indicates the row of the piece you want to move
 * @param {number} col indicates the coloumn of the piece you want to move 
 * @returns {Checkers.Board} An updated board with the same height and width.
 */
Checkers.jump_king = function (token,col,row,direction,orientation,board,king_map) {
    if (R.equals(orientation,'forward') &&
    R.equals(king_map[row][~~(col/2)],true) &&
    R.equals(board[row][col],token)) {
        return Checkers.jump_piece_bottom(token,col,row,direction,board)
    }
    else if (R.equals(orientation,'backward') &&
    R.equals(king_map[row][~~(col/2)],true) &&
    R.equals(board[row][col],token)) {
        return Checkers.jump_piece_top(token,col,row,direction,board)
    }
}


/**
 * Returns an updated king map where the piece located in a specified row and coloumn will
 * be moved in a specified direction. The old location of the true value will be removed
 * and replaced in the correct index as well as the true value of the piece it jumped over
 * if that piece happened to be a king. Lastly this function only moves pieces from the bottom
 * of the board towards the top.
 * @memberof Checkers
 * @function
 * @param {Checkers.king_map} board A populated king map.
 * @param {('straight' | 'diagonal')} direction indicates which direction the move is made. 
 * @param {number} row indicates the row of the piece you want to move
 * @param {number} col indicates the coloumn of the piece you want to move 
 * @returns {Checkers.king_map} An updated king map.
 */
Checkers.update_king_map_jump = function (col,row,direction,king_map) {
    const current = king_map[row][~~(col/2)]
    if (direction === 'left') {
        if (row % 2 === 1) {
            const new_piece = R.update(row-2,R.update((~~(col/2)-1),current,king_map[row-2]),king_map)
            const remove_opp = R.update(row-1,R.update((~~(col/2)-1),false,new_piece[row-1]),new_piece)
            return (R.update(row,R.update((~~(col/2)),false,remove_opp[row]),remove_opp)) 
        }
        else if (row % 2 === 0) {
            const new_piece = R.update(row-2,R.update((~~(col/2)-1),current,king_map[row-2]),king_map)
            const remove_opp = R.update(row-1,R.update((~~(col/2)),false,new_piece[row-1]),new_piece)
            return (R.update(row,R.update((~~(col/2)),false,remove_opp[row]),remove_opp))
        }
    }
    else if (direction === 'right') {
        if (row % 2 === 1) {
            const new_piece = R.update(row-2,R.update((~~(col/2)+1),current,king_map[row-2]),king_map)
            const remove_opp = R.update(row-1,R.update((~~(col/2)),false,new_piece[row-1]),new_piece)
            return (R.update(row,R.update((~~(col/2)),false,remove_opp[row]),remove_opp)) 
        }
        else if (row % 2 === 0) {
            const new_piece = R.update(row-2,R.update((~~(col/2)+1),current,king_map[row-2]),king_map)
            const remove_opp = R.update(row-1,R.update((~~(col/2)+1),false,new_piece[row-1]),new_piece)
            return (R.update(row,R.update((~~(col/2)),false,remove_opp[row]),remove_opp))
        }
    }
    if (king_map[row][~~(col/2)] === false) {
        return king_map
    }
}


/**
 * Returns an updated king map where the piece located in a specified row and coloumn will
 * be moved in a specified direction. The old location of the true value will be removed
 * and replaced in the correct index as well as the true value of the piece it jumped over
 * if that piece happened to be a king. Lastly this function only moves pieces from the top
 * of the board towards the bottom.
 * @memberof Checkers
 * @function
 * @param {Checkers.king_map} board A populated king map.
 * @param {('straight' | 'diagonal')} direction indicates which direction the move is made. 
 * @param {number} row indicates the row of the piece you want to move
 * @param {number} col indicates the coloumn of the piece you want to move 
 * @returns {Checkers.king_map} An updated king map.
 */
Checkers.update_king_jump_top = function (col,row,direction,king_map) {
    if (direction === 'left') {
        return Checkers.flip_board(Checkers.update_king_map_jump(7-col,7-row,'right',Checkers.flip_board(king_map)))
    }
    else if (direction === 'right') {
        return Checkers.flip_board(Checkers.update_king_map_jump(7-col,7-row,'left',Checkers.flip_board(king_map))) 
    }
}

export default Object.freeze(Checkers);