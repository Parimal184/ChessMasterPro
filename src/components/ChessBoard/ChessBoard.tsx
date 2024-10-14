import React, { useState, useEffect } from "react";
import "../../styles/ChessBoard.scss";
import { INITIAL_TIMER, initialBoard, pieceImages } from "../../constants/BoardConfig";
import webSocketService from "../../services/WebSocketService";

// Column and Row labels
const columnLabels = ["a", "b", "c", "d", "e", "f", "g", "h"];
const rowLabels = [8, 7, 6, 5, 4, 3, 2, 1];
const promotionPieces = ["q", "r", "b", "n"];

interface ChessBoardProps {
    handleMove: (move: string) => void; // Define the handleMove prop
}

const ChessBoard: React.FC<ChessBoardProps>  = ({ handleMove }) => {
    const [board, setBoard] = useState(initialBoard);
    const [selectedPiece, setSelectedPiece] = useState<{
        row: number;
        col: number;
    } | null>(null);

    const [lastMovedFrom, setLastMovedFrom] = useState<{ row: number; col: number } | null>(null);
    const [lastMovedTo, setLastMovedTo] = useState<{ row: number; col: number } | null>(null);
    const [gameOver, setGameOver] = useState(false);


    const [moveHistory, setMoveHistory] = useState<string[]>([]); // State to track move history
    const [validMoves, setValidMoves] = useState<
        { row: number; col: number }[]
    >([]);

    // Timers for both players
    const [whiteTime, setWhiteTime] = useState(INITIAL_TIMER);
    const [blackTime, setBlackTime] = useState(INITIAL_TIMER);

    // Track which player's turn it is (white starts)
    const [isWhiteTurn, setIsWhiteTurn] = useState(true);

    const [isPromoting, setIsPromoting] = useState(false);
    const [promotedPawnPosition, setPromotedPawnPosition] = useState<{ row: number; col: number } | null>(null);
    const [popupStyle, setPopupStyle] = useState<React.CSSProperties | null>(null);


     // Add drag handlers to pieces
     const handleDragStart = async (row: number, col: number, e: React.DragEvent<HTMLImageElement>, piece: string) => {
        if (!isPieceColor(piece, isWhiteTurn) || gameOver) {
            e.preventDefault(); // Prevent dragging if it's not the player's turn
            return; // Exit early
        }
        handleSquareClick(row, col, e.currentTarget);
        e.currentTarget.classList.add('dragging'); // Add dragging class on drag start  
    
        setSelectedPiece({ row, col });
    };
  
    const handleDrop = (row: number, col: number) => {
        if (selectedPiece) {
          if (isValidMove(selectedPiece.row, selectedPiece.col, row, col)) {
            movePiece(selectedPiece.row, selectedPiece.col, row, col);
          } 
          setSelectedPiece(null);
          setValidMoves([]); // Clear valid moves
        }
      };
  
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); // Prevent default to allow drop
    };
  
    const handleDragEnd = (e: React.DragEvent<HTMLImageElement>) => {
      e.currentTarget.classList.remove('dragging'); // Remove dragging class on drag end
    };
  
    const renderPiece = (piece: string | null, row: number, col: number) => {
      if (!piece) return null;
      const pieceImageSrc = pieceImages[piece as keyof typeof pieceImages];
  
      const pieceClass = selectedPiece?.row === row && selectedPiece?.col === col ? "piece selected" : "piece";

      return (
        <img
          src={pieceImageSrc}
          alt={piece}
          className={pieceClass}
          draggable
          onDragStart={(e) => handleDragStart(row, col, e, piece)}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          aria-label={pieceImageSrc}
        />
      );
    };

    const findKingPosition = (board : string[][], isWhiteTurn : boolean) => {
        const king = isWhiteTurn ? 'K' : 'k';
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                if (board[row][col] === king) {
                    return { row, col };
                }
            }
        }
        return null;  // Should not happen unless the king is missing from the board.
    };
    
    const isKingInCheck = (board : string[][], kingPosition : { row: number; col: number }, isWhiteTurn : boolean) => {
        const opponentMoves = getAllOpponentMoves(board, isWhiteTurn);
        // Check if any opponent move can capture the king
        return opponentMoves.some((move: { row: number; col: number; }) => move.row === kingPosition.row && move.col === kingPosition.col);
    };
    
    const getAllOpponentMoves = (board : string[][], isWhiteTurn : boolean) => {
        const opponentPieces = isWhiteTurn ? ['r', 'n', 'b', 'q', 'p'] : ['R', 'N', 'B', 'Q', 'P'];
        let moves: any = [];
        
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const piece = board[row][col];
                if (opponentPieces.includes(piece)) {
                    const pieceMoves = calculateValidMoves(row, col, board, !isWhiteTurn);
                    moves = [...moves, ...pieceMoves];
                }
            }
        }
        
        return moves;
    };

    const findAttackingPieces = (board : string[][], kingPosition : { row: number; col: number }, isWhiteTurn : boolean ) => {
        const opponentMoves = getAllOpponentMoves(board, isWhiteTurn);
        const attackers = [];
        
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const piece = board[row][col];
                const pieceMoves = calculateValidMoves(row, col, board, !isWhiteTurn);
                
                if (pieceMoves.some((move: { row: number; col: number; })  => move.row === kingPosition.row && move.col === kingPosition.col)) {
                    attackers.push({ row, col, piece });
                }
            }
        }
        
        return attackers;
    };

    const getValidMovesForPiece = (row : any, col : any, board : string[][], isWhiteTurn : boolean) => {
        const validMoves = calculateValidMoves(row, col, board, isWhiteTurn);
    
        return validMoves.filter((move : any) => {
            const newBoard = simulateMove(board, row, col, move.row, move.col);
            const kingPosition: any = findKingPosition(newBoard, isWhiteTurn);
            return !isKingInCheck(newBoard, kingPosition, isWhiteTurn);  // Only allow moves that remove the check
        });
    };

    const isCheckmate = (board : string[][] , isWhiteTurn : boolean) => {
        const kingPosition: any = findKingPosition(board, isWhiteTurn);
        
        if (!isKingInCheck(board, kingPosition, isWhiteTurn)) return false;  // Not in check, so no checkmate
    
        // Check if there are any valid moves for the current player
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const piece = board[row][col];
                if (isWhiteTurn && piece.match(/[PBNRQK]/) || !isWhiteTurn && piece.match(/[pbnrqk]/)) {
                    const validMoves = getValidMovesForPiece(row, col, board, isWhiteTurn);
                    if (validMoves.length > 0) {
                        return false;  // There's at least one valid move, no checkmate
                    }
                }
            }
        }
    
        return true;  // No valid moves, this is checkmate
    };
    
    const calculateValidMoves = (row : any, col : any, board: string[][], isWhiteTurn: boolean) => {
        const piece = board[row][col];
    
        if (!piece) return [];  // Empty square, no valid moves
    
        let validMoves = [];
    
        switch (piece.toLowerCase()) {
            case 'p':  // Pawn
                validMoves = calculatePawnMoves(row, col, board, isWhiteTurn);
                break;
            case 'r':  // Rook
                validMoves = calculateRookMoves(row, col, board, isWhiteTurn);
                break;
            case 'n':  // Knight
                validMoves = calculateKnightMoves(row, col, board, isWhiteTurn);
                break;
            case 'b':  // Bishop
                validMoves = calculateBishopMoves(row, col, board, isWhiteTurn);
                break;
            case 'q':  // Queen
                validMoves = calculateQueenMoves(row, col, board, isWhiteTurn);
                break;
            case 'k':  // King
                validMoves = calculateKingMoves(row, col, board, isWhiteTurn);
                break;
        }
    
        return validMoves.filter((move: { row: number; col: number; }) => isWithinBoard(move.row, move.col));  // Ensure moves are within board boundaries
    };
    
    const isWithinBoard = (row : any, col : any) => {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    };


    const calculatePawnMoves = (row : any, col : any, board : string[][], isWhiteTurn : boolean) => {
        const direction = isWhiteTurn ? -1 : 1;
        const startRow = isWhiteTurn ? 6 : 1;
        let moves = [];
    
        // Forward move
        if (!board[row + direction][col]) {
            moves.push({ row: row + direction, col });
            
            // Initial double move
            if (row === startRow && !board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col });
            }
        }
    
        // Diagonal captures
        if (col > 0 && isOpponentPiece(row + direction, col - 1, board, isWhiteTurn)) {
            moves.push({ row: row + direction, col: col - 1 });
        }
        if (col < 7 && isOpponentPiece(row + direction, col + 1, board, isWhiteTurn)) {
            moves.push({ row: row + direction, col: col + 1 });
        }
    
        return moves;
    };
    
    const calculateRookMoves = (row : any, col : any, board : string[][], isWhiteTurn : boolean) => {
        let moves: any = [];
    
        // Vertical and horizontal directions
        moves = moves.concat(scanDirection(row, col, 1, 0, board, isWhiteTurn));   // Down
        moves = moves.concat(scanDirection(row, col, -1, 0, board, isWhiteTurn));  // Up
        moves = moves.concat(scanDirection(row, col, 0, 1, board, isWhiteTurn));   // Right
        moves = moves.concat(scanDirection(row, col, 0, -1, board, isWhiteTurn));  // Left
    
        return moves;
    };

    const calculateKnightMoves = (row : any, col : any, board : string[][], isWhiteTurn : boolean) => {
        const knightMoves = [
            { row: row + 2, col: col + 1 },
            { row: row + 2, col: col - 1 },
            { row: row - 2, col: col + 1 },
            { row: row - 2, col: col - 1 },
            { row: row + 1, col: col + 2 },
            { row: row + 1, col: col - 2 },
            { row: row - 1, col: col + 2 },
            { row: row - 1, col: col - 2 }
        ];
    
        return knightMoves.filter(move => {
            return isWithinBoard(move.row, move.col) &&
                   (!board[move.row][move.col] || isOpponentPiece(move.row, move.col, board, isWhiteTurn));
        });
    };
    
    const calculateBishopMoves = (row : any, col : any, board : string[][], isWhiteTurn : boolean) => {
        let moves: any = [];
    
        // Diagonal directions
        moves = moves.concat(scanDirection(row, col, 1, 1, board, isWhiteTurn));   // Down-right
        moves = moves.concat(scanDirection(row, col, 1, -1, board, isWhiteTurn));  // Down-left
        moves = moves.concat(scanDirection(row, col, -1, 1, board, isWhiteTurn));  // Up-right
        moves = moves.concat(scanDirection(row, col, -1, -1, board, isWhiteTurn)); // Up-left
    
        return moves;
    };

    const calculateQueenMoves = (row : any, col : any, board: string[][], isWhiteTurn: boolean) => {
        let moves: any = [];
    
        // Rook-like moves (vertical and horizontal)
        moves = moves.concat(calculateRookMoves(row, col, board, isWhiteTurn));
    
        // Bishop-like moves (diagonal)
        moves = moves.concat(calculateBishopMoves(row, col, board, isWhiteTurn));
    
        return moves;
    };
    

    const calculateKingMoves = (row : any, col : any, board : string[][], isWhiteTurn : boolean) => {
        const kingMoves = [
            { row: row + 1, col },
            { row: row - 1, col },
            { row, col: col + 1 },
            { row, col: col - 1 },
            { row: row + 1, col: col + 1 },
            { row: row + 1, col: col - 1 },
            { row: row - 1, col: col + 1 },
            { row: row - 1, col: col - 1 }
        ];
    
        return kingMoves.filter(move => {
            return isWithinBoard(move.row, move.col) &&
                   (!board[move.row][move.col] || isOpponentPiece(move.row, move.col, board, isWhiteTurn));
        });
    };
    
    const scanDirection = (row : any, col : any, rowDir : any, colDir : any, board : string[][], isWhiteTurn : boolean) => {
        const moves = [];
        let r = row + rowDir;
        let c = col + colDir;
    
        while (isWithinBoard(r, c)) {
            if (!board[r][c]) {
                moves.push({ row: r, col: c });
            } else if (isOpponentPiece(r, c, board, isWhiteTurn)) {
                moves.push({ row: r, col: c });
                break;  // Cannot move beyond opponent piece
            } else {
                break;  // Blocked by own piece
            }
    
            r += rowDir;
            c += colDir;
        }
    
        return moves;
    };
    
    const isOpponentPiece = (row : any, col : any, board : string[][], isWhiteTurn : boolean) => {
        const piece = board[row][col];
        return isWhiteTurn ? piece && piece.toLowerCase() === piece : piece && piece.toUpperCase() === piece;
    };
    
    
    const simulateMove = (board : string[][], fromRow : any, fromCol : any, toRow : any, toCol : any) => {
        const newBoard = board.map(row => [...row]); // Clone the board
        newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
        newBoard[fromRow][fromCol] = '';
        return newBoard;
    };
    
    
  
    useEffect(() => {
        const interval = setInterval(() => {
            if (isWhiteTurn) {
                setWhiteTime((prevTime) => Math.max(prevTime - 1, 0));
            } else {
                setBlackTime((prevTime) => Math.max(prevTime - 1, 0));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isWhiteTurn]);


    const handleSquareClick = (row: number, col: number, squareElement: HTMLDivElement) => {
        if(gameOver) return;
        const piece = board[row][col];
        const rect = squareElement.getBoundingClientRect();
            setPopupStyle({
                top: `${rect.top - rect.height}px`, // Adjust top to be exactly above the square
                left: `${rect.left - rect.width}px`, // Align left with the square's left
            });
        
    
        // If a piece is selected and a valid move is clicked
        if (selectedPiece) {
            if (validMoves.some(move => move.row === row && move.col === col)) {
                // Move the piece from the selected position to the new position
                movePiece(selectedPiece.row, selectedPiece.col, row, col);
            } else if (piece && isPieceColor(piece, isWhiteTurn)) {
                // If the clicked piece is of the same color, switch selection
                setSelectedPiece({ row, col });
                
                setValidMoves(getValidMovesForPiece(row, col, board, isWhiteTurn)); // Get valid moves for the newly selected piece
            } else {
                // Deselect if not a valid move and not the same color
                setSelectedPiece(null);
                setValidMoves([]); // Clear valid moves
            }
        } else {
            // If no piece is selected and clicked piece is valid
            if (piece && isPieceColor(piece, isWhiteTurn)) {
                setSelectedPiece({ row, col });
                setValidMoves(getValidMovesForPiece(row, col, board, isWhiteTurn)); // Get valid moves for selected piece
            }
        }
    };
    
    const movePiece = (
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number
    ) => {
        let newBoard = [...board];
        const movedPiece = newBoard[startRow][startCol];

        handleMove(movedPiece);
    
        newBoard = simulateMove(board, startRow, startCol, endRow, endCol);
        const kingPosition: any = findKingPosition(newBoard, isWhiteTurn);
    
        if (isKingInCheck(newBoard, kingPosition, isWhiteTurn)) {
            alert("You cannot leave your king in check!");
            return;  // Move not allowed
        }

    
        // Check for pawn promotion after moving
        if (movedPiece.toLowerCase() === 'p' && (endRow === 0 || endRow === 7)) {
            setIsPromoting(true);
            setPromotedPawnPosition({ row: endRow, col: endCol });
        } else {
            setBoard(newBoard);
    
            const move = `${movedPiece} moved from ${columnLabels[startCol]}${8 - startRow} to ${columnLabels[endCol]}${8 - endRow}`;
            setMoveHistory([...moveHistory, move]);

            // Set the last moved positions for highlighting
            setLastMovedFrom({ row: startRow, col: startCol });
            setLastMovedTo({ row: endRow, col: endCol });
    
            setIsWhiteTurn(!isWhiteTurn);
            setSelectedPiece(null);
            setValidMoves([]); // Clear valid moves
        }

        setTimeout(() => {
            if (isCheckmate(newBoard, !isWhiteTurn)) {
                alert(!isWhiteTurn ? "Black wins by checkmate!" : "White wins by checkmate!");
                setGameOver(true);
            }
        }, 200);
    };
    
    const isPieceColor = (piece: string, isWhiteTurn: boolean) => {
        return (
            (isWhiteTurn && piece === piece.toUpperCase()) ||
            (!isWhiteTurn && piece === piece.toLowerCase())
        );
    };

    //   Function to validate if a move is legal
    const isValidMove = (
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number
    ) => {
        const piece = board[startRow][startCol];
        const target = board[endRow][endCol];

        // Prevent moving to a square occupied by a piece of the same color
        if (target && isSameColor(piece, target)) {
            return false;
        }

        // Movement rules for each piece
        switch (piece.toLowerCase()) {
            case "p": // Pawn
                return isValidPawnMove(
                    piece,
                    startRow,
                    startCol,
                    endRow,
                    endCol
                );
            case "r": // Rook
                return isValidRookMove(startRow, startCol, endRow, endCol);
            case "n": // Knight
                return isValidKnightMove(startRow, startCol, endRow, endCol);
            case "b": // Bishop
                return isValidBishopMove(startRow, startCol, endRow, endCol);
            case "q": // Queen
                return isValidQueenMove(startRow, startCol, endRow, endCol);
            case "k": // King
                return isValidKingMove(startRow, startCol, endRow, endCol);
            default:
                return false;
        }
    };

    // Helper to check if two pieces are the same color
    const isSameColor = (piece1: string, piece2: string) => {
        return (
            (piece1 === piece1.toUpperCase() &&
                piece2 === piece2.toUpperCase()) ||
            (piece1 === piece1.toLowerCase() && piece2 === piece2.toLowerCase())
        );
    };

    // Piece movement validation functions

    const isValidPawnMove = (
        piece: string,
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number
    ) => {
        const direction = piece === "P" ? -1 : 1; // White moves up (-1), Black moves down (+1)
        const startRowInitial = piece === "P" ? 6 : 1; // Initial row for white and black pawns

        if (startCol === endCol && board[endRow][endCol] === "") {
            if (endRow === startRow + direction) return true;
            if (
                startRow === startRowInitial &&
                endRow === startRow + 2 * direction
            )
                return true;
        } else if (
            Math.abs(endCol - startCol) === 1 &&
            endRow === startRow + direction &&
            board[endRow][endCol]
        ) {
            return true; // Diagonal capture
        }

        return false;
    };

    const isValidRookMove = (
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number
    ) => {
        if (startRow !== endRow && startCol !== endCol) return false; // Must move in straight lines
        return isPathClear(startRow, startCol, endRow, endCol);
    };

    const isValidKnightMove = (
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number
    ) => {
        const rowDiff = Math.abs(startRow - endRow);
        const colDiff = Math.abs(startCol - endCol);
        return (
            (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
        );
    };

    const isValidBishopMove = (
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number
    ) => {
        if (Math.abs(startRow - endRow) !== Math.abs(startCol - endCol))
            return false; // Must move diagonally
        return isPathClear(startRow, startCol, endRow, endCol);
    };

    const isValidQueenMove = (
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number
    ) => {
        return (
            isValidRookMove(startRow, startCol, endRow, endCol) ||
            isValidBishopMove(startRow, startCol, endRow, endCol)
        );
    };

    const isValidKingMove = (
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number
    ) => {
        const rowDiff = Math.abs(startRow - endRow);
        const colDiff = Math.abs(startCol - endCol);
        return rowDiff <= 1 && colDiff <= 1; // King can move one square in any direction
    };

    const isPathClear = (
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number
    ) => {
        const rowDirection = Math.sign(endRow - startRow);
        const colDirection = Math.sign(endCol - startCol);
        let currentRow = startRow + rowDirection;
        let currentCol = startCol + colDirection;

        while (currentRow !== endRow || currentCol !== endCol) {
            if (board[currentRow][currentCol] !== "") {
                return false; // Path is blocked
            }
            currentRow += rowDirection;
            currentCol += colDirection;
        }

        return true;
    };

    // Format the timer to display minutes and seconds
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    const handlePromotion = (piece: string) => {
        if (promotedPawnPosition) {
            const { row, col } = promotedPawnPosition;
            const newBoard = [...board];
            newBoard[row][col] = piece;
            setBoard(newBoard);

            setIsPromoting(false);
            setPromotedPawnPosition(null);
            setIsWhiteTurn(!isWhiteTurn); // Switch turn after promotion
            setSelectedPiece(null);
            setValidMoves([]); // Clear valid moves
        }
    };

    const renderSquare = (row: number, col: number) => {
        const piece = board[row][col];
    
        // Determine if the square should be highlighted
        const isHighlightFrom = lastMovedFrom && lastMovedFrom.row === row && lastMovedFrom.col === col;
        const isHighlightTo = lastMovedTo && lastMovedTo.row === row && lastMovedTo.col === col;

        const rankNumber = 8 - row;
        const columnLabel = String.fromCharCode(97 + col);

        return (
            <div
                className={`square ${isHighlightFrom || isHighlightTo ? 'highlight' : ''}`}
                onClick={(e) => handleSquareClick(row, col, e.currentTarget)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(row, col)}
            >
                {col === 0 && <div className="num-label" style={{color : row % 2 !== 0 ? '#ebecd0' : '#739552'}}>{rankNumber}</div>}
                {renderPiece(piece, row, col)}
                {row === 7 && (
                    <div className="column-label" style={{color : col % 2 === 0 ? '#ebecd0' : '#739552'}}>
                        {columnLabel}
                    </div>
                )}
                {validMoves.some(
                                (move) =>
                                    move.row === row &&
                                    move.col === col
                            ) && (
                                <div
                                    className="valid-move-marker"
                                    style={{
                                        gridRow: row + 1,
                                        gridColumn: col + 1,
                                    }}
                                />
                            )}
            </div>
        );
    };
    

    return (
        <div className="chess-container">
            <div className="timers">
                <div className={`timer ${isWhiteTurn ? "active" : ""}`}>
                    White: {formatTime(whiteTime)}
                </div>
                <div className={`timer ${!isWhiteTurn ? "active" : ""}`}>
                    Black: {formatTime(blackTime)}
                </div>
            </div>

            <div className="chessboard">
                {board.map((rowArray, rowIndex) =>
                    rowArray.map((piece, colIndex) => (
                        renderSquare(rowIndex, colIndex)
                    ))
                )}
            </div>
                {isPromoting && promotedPawnPosition && (
                <div className="promotion-popup" style={popupStyle || {}}>
                    {promotionPieces.map((promoPiece) => (
                        promoPiece = isWhiteTurn ? promoPiece.toUpperCase() : promoPiece.toLowerCase(),
                        <img
                            key={promoPiece}
                            src={pieceImages[promoPiece as keyof typeof pieceImages]}
                            alt={promoPiece}
                            className="piece"
                            onClick={() => handlePromotion(promoPiece)}
                        />
                    ))}
                </div>
            )}
            

            <div className="move-history">
                <h3>Move History</h3>
                <ul>
                    {moveHistory.map((move, index) => (
                        <li key={index}>{move}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ChessBoard;
