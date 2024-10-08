import React, { useState, useEffect } from "react";
import "../../styles/ChessBoard.scss";
import { INITIAL_TIMER, initialBoard, pieceImages } from "../../constants/BoardConfig";

// Column and Row labels
const columnLabels = ["a", "b", "c", "d", "e", "f", "g", "h"];
const rowLabels = [8, 7, 6, 5, 4, 3, 2, 1];
const promotionPieces = ["q", "r", "b", "n"];

const ChessBoard: React.FC = () => {
    const [board, setBoard] = useState(initialBoard);
    const [selectedPiece, setSelectedPiece] = useState<{
        row: number;
        col: number;
    } | null>(null);

    const [lastMovedFrom, setLastMovedFrom] = useState<{ row: number; col: number } | null>(null);
    const [lastMovedTo, setLastMovedTo] = useState<{ row: number; col: number } | null>(null);


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
        if (!isPieceColor(piece, isWhiteTurn)) {
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
  
     // Calculate the position for the promotion popup based on the pawn's row and column
  const getPromotionPopupStyle = () => {
    if (!promotedPawnPosition) return {};
    const { row, col } = promotedPawnPosition;
    const top = row * 100; // Assuming each square is 100px high
    const left = col * 100; // Assuming each square is 100px wide
    return {
      top: `${top}px`,
      left: `${left}px`,
    };
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
        const piece = board[row][col];
        debugger
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
                setValidMoves(getValidMoves(row, col)); // Get valid moves for the newly selected piece
            } else {
                // Deselect if not a valid move and not the same color
                setSelectedPiece(null);
                setValidMoves([]); // Clear valid moves
            }
        } else {
            // If no piece is selected and clicked piece is valid
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
    
        // Move the piece normally
        newBoard[endRow][endCol] = movedPiece;
        newBoard[startRow][startCol] = "";
    
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
    
        return (
            <div
                className={`square ${isHighlightFrom || isHighlightTo ? 'highlight' : ''}`}
                onClick={(e) => handleSquareClick(row, col, e.currentTarget)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(row, col)}
            >
                {renderPiece(piece, row, col)}
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
