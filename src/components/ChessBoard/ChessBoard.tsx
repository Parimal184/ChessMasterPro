import React, { useState, useEffect } from "react";
import "../../styles/ChessBoard.scss";

const pieceImages = {
    P: "/assets/pieces/wp.png", // White Pawn
    R: "/assets/pieces/wr.png", // White Rook
    N: "/assets/pieces/wn.png", // White Knight
    B: "/assets/pieces/wb.png", // White Bishop
    Q: "/assets/pieces/wq.png", // White Queen
    K: "/assets/pieces/wk.png", // White King
    p: "/assets/pieces/bp.png", // Black Pawn
    r: "/assets/pieces/br.png", // Black Rook
    n: "/assets/pieces/bn.png", // Black Knight
    b: "/assets/pieces/bb.png", // Black Bishop
    q: "/assets/pieces/bq.png", // Black Queen
    k: "/assets/pieces/bk.png", // Black King
};

const initialBoard = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

// Column and Row labels
const columnLabels = ["a", "b", "c", "d", "e", "f", "g", "h"];
const rowLabels = [8, 7, 6, 5, 4, 3, 2, 1];

// Constants for the initial timer values (in seconds)
const INITIAL_TIMER = 300; // 5 minutes per player

const ChessBoard: React.FC = () => {
    const [board, setBoard] = useState(initialBoard);
    const [selectedPiece, setSelectedPiece] = useState<{
        row: number;
        col: number;
    } | null>(null);
    const [moveHistory, setMoveHistory] = useState<string[]>([]); // State to track move history
    const [validMoves, setValidMoves] = useState<
        { row: number; col: number }[]
    >([]);

    // Timers for both players
    const [whiteTime, setWhiteTime] = useState(INITIAL_TIMER);
    const [blackTime, setBlackTime] = useState(INITIAL_TIMER);

    // Track which player's turn it is (white starts)
    const [isWhiteTurn, setIsWhiteTurn] = useState(true);

     // Add drag handlers to pieces
     const handleDragStart = async (row: number, col: number, e: React.DragEvent<HTMLImageElement>, piece: string) => {
      handleSquareClick(row, col);
      // e.currentTarget.classList.add('dragging'); // Add dragging class on drag start  
    //   console.log(e.currentTarget);
    //   e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
      setSelectedPiece({ row, col });
    };
  
    const handleDrop = (row: number, col: number) => {
      if (selectedPiece) {
        if (isValidMove(selectedPiece.row, selectedPiece.col, row, col)) {
          movePiece(selectedPiece.row, selectedPiece.col, row, col);
        }
        setSelectedPiece(null);
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
  
      return (
        <img
          src={pieceImageSrc}
          alt={piece}
          className="piece"
          draggable
          onDragStart={(e) => handleDragStart(row, col, e, piece)}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          aria-label={pieceImageSrc}
        />
      );
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

    const handleSquareClick = (row: number, col: number) => {
        const piece = board[row][col];

        if (selectedPiece) {
            if (isValidMove(selectedPiece.row, selectedPiece.col, row, col)) {
                movePiece(selectedPiece.row, selectedPiece.col, row, col);
            }
            setSelectedPiece(null); // Deselect regardless of move validity
            setValidMoves([]); // Clear valid moves
        } else {
            if (piece && isPieceColor(piece, isWhiteTurn)) {
                setSelectedPiece({ row, col });
                setValidMoves(getValidMoves(row, col)); // Get valid moves for selected piece
            }
        }
    };

    // Get valid moves based on the selected piece
    const getValidMoves = (row: number, col: number) => {
        const piece = board[row][col];
        const moves: { row: number; col: number }[] = [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (isValidMove(row, col, r, c)) {
                    moves.push({ row: r, col: c });
                }
            }
        }
        return moves;
    };

    const movePiece = (
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number
    ) => {
        const newBoard = [...board];
        const movedPiece = newBoard[startRow][startCol];
        newBoard[endRow][endCol] = movedPiece;
        newBoard[startRow][startCol] = "";
        setBoard(newBoard);

        const move = `${movedPiece} moved from ${columnLabels[startCol]}${
            8 - startRow
        } to ${columnLabels[endCol]}${8 - endRow}`;
        setMoveHistory([...moveHistory, move]);

        setIsWhiteTurn(!isWhiteTurn);
        setSelectedPiece(null);
        setValidMoves([]); // Clear valid moves
    };

    // Helper function to check if the piece color matches the current player
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
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className="square"
                            onClick={() =>
                                handleSquareClick(rowIndex, colIndex)
                            }
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(rowIndex, colIndex)} 
                        >
                            {renderPiece(piece, rowIndex, colIndex)}
                            {validMoves.some(
                                (move) =>
                                    move.row === rowIndex &&
                                    move.col === colIndex
                            ) && (
                                <div
                                    className="valid-move-marker"
                                    style={{
                                        gridRow: rowIndex + 1,
                                        gridColumn: colIndex + 1,
                                    }}
                                />
                            )}
                        </div>
                    ))
                )}
            </div>

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
