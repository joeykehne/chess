import { Component, OnInit } from '@angular/core';

type Position = [number, number];

@Component({
  selector: 'app-chessboard',
  templateUrl: './chessboard.component.html',
  styleUrls: ['./chessboard.component.css'],
})
export class ChessboardComponent implements OnInit {

  currentFen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

  currentBoard: any[][] = [];

  whiteToPlay: boolean = true;

  selectedSquare: Position | undefined;

  selectedPiece: string | undefined;

  suggestedSquares: Position[] = [];

  canBeCaptured: Position[] = [];

  previousMoveFrom: Position | undefined
  previousMoveTo: Position | undefined

  ngOnInit(): void {
    this.currentBoard = [];
    
    this.whiteToPlay = true;
    
    this.selectedSquare = undefined;
    
    this.selectedPiece = undefined;
    
    this.suggestedSquares = [];
    
    this.canBeCaptured = [];

    this.previousMoveFrom = undefined
    this.previousMoveTo =  undefined


    this.currentBoard = this.fenToArray(this.currentFen);
  }

  squareClicked(rowNr: number, spotNr: number) {
    if (this.containsPosition([rowNr, spotNr], this.getClickableSquares())) {
      this.toggleSelect([rowNr, spotNr]);
      this.suggestedSquares = this.getValidMoves();
    } else {
      let desiredSquare: Position = [rowNr, spotNr];
      if (
        this.selectedSquare &&
        this.validateMove(this.selectedSquare, desiredSquare)
      )
        this.movePiece(desiredSquare);
      this.toggleSelect();
      this.suggestedSquares = [];
    }
  }

  toggleSelect(pos: Position | undefined = undefined) {
    this.selectedSquare = pos;

    this.selectedPiece = pos ? this.currentBoard[pos[0]][pos[1]] : '';

    this.canBeCaptured = [];
    this.suggestedSquares = this.getValidMoves();
  }

  getClickableSquares(): Position[] {
    let clickableSquares = [];

    for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
      for (let colIndex = 0; colIndex < 8; colIndex++) {
        let piece = this.currentBoard[rowIndex][colIndex];
        if (!piece) continue;
        if (this.whiteToPlay && piece == piece.toUpperCase()) {
          clickableSquares.push([rowIndex, colIndex] as Position);
        }
        if (!this.whiteToPlay && piece == piece.toLowerCase()) {
          clickableSquares.push([rowIndex, colIndex] as Position);
        }
      }
    }

    return clickableSquares;
  }

  getValidMoves(): Position[] {
    let legalMoves: Position[] = [];

    if (this.selectedPiece?.toLowerCase() == 'b') {
      let directions = [-9, -7, 7, 9];
      legalMoves = [...legalMoves, ...this.getDirectionalMoves(directions)];
    }

    if (this.selectedPiece?.toLowerCase() == 'r') {
      let directions = [-8, -1, 1, 8];
      legalMoves = [...legalMoves, ...this.getDirectionalMoves(directions)];
    }

    if (this.selectedPiece?.toLowerCase() == 'q') {
      let directions = [-9, -7, 7, 9, -8, -1, 1, 8];
      legalMoves = [...legalMoves, ...this.getDirectionalMoves(directions)];
    }

    if (this.selectedPiece?.toLowerCase() == 'n') {
      legalMoves = [...legalMoves, ...this.getKnightMoves()];
    }

    if (this.selectedPiece?.toLowerCase() == 'k') {
      legalMoves = [...legalMoves, ...this.getKingMoves()];
    }

    legalMoves = legalMoves.filter(move => !this.arrayEqual(move, this.selectedSquare))

    return legalMoves;
  }

  getKingMoves(): Position[] {
    if (!this.selectedSquare) return [];
    let kingMoves: Position[] = [];

    let directions = [-9, -7, 7, 9, -8, -1, 1, 8];

    directions.forEach((dir) => {
      let currentPosition = this.selectedSquare!;
      if (this.isLastAvailableSquare(currentPosition, dir)) {
        return
      }
      currentPosition = this.peekPiece(currentPosition, dir);
      
      if (this.isOwnPiece(currentPosition)) {
        return 
      }

      if (this.canItBeCaptured(currentPosition)) {
        this.canBeCaptured.push(currentPosition);
        kingMoves.push(currentPosition);
        return
      }


      kingMoves.push(currentPosition);
    });

    return kingMoves;
  }

  getKnightMoves(): Position[] {
    if (!this.selectedSquare) return [];
    let knightMoves: Position[] = [];
    let currentPosition = this.selectedSquare;

    let directions = [6, 10, 15, 17, -6, -10, -15, -17];

    // Top
    if (currentPosition[0] == 0 || currentPosition[0] == 1) {
      directions = directions.filter((pos) => pos != -10);
      directions = directions.filter((pos) => pos != 6);

      if (currentPosition[0] == 0) {
        directions = directions.filter((pos) => pos != -17);
        directions = directions.filter((pos) => pos != 15);
      }
    }

    // Bottom
    if (currentPosition[0] == 6 || currentPosition[0] == 7) {
      directions = directions.filter((pos) => pos != 10);
      directions = directions.filter((pos) => pos != -6);

      if (currentPosition[0] == 7) {
        directions = directions.filter((pos) => pos != 17);
        directions = directions.filter((pos) => pos != -15);
      }
    }

    // Left
    if (currentPosition[1] == 0 || currentPosition[1] == 1) {
      directions = directions.filter((pos) => pos != -17);
      directions = directions.filter((pos) => pos != -15);

      if (currentPosition[1] == 0) {
        directions = directions.filter((pos) => pos != -10);
        directions = directions.filter((pos) => pos != -6);
      }
    }

    // Right
    if (currentPosition[1] == 6 || currentPosition[1] == 7) {
      directions = directions.filter((pos) => pos != 17);
      directions = directions.filter((pos) => pos != 15);

      if (currentPosition[1] == 7) {
        directions = directions.filter((pos) => pos != 10);
        directions = directions.filter((pos) => pos != 6);
      }
    }

    directions.forEach((dir) => {
      knightMoves.push(this.peekPiece(currentPosition, dir));
    });

    let copyKnightMoves = knightMoves;

    copyKnightMoves.forEach((pos) => {
      knightMoves = knightMoves.filter((move) => !this.isOwnPiece(move));
      if (
        this.containsPosition(pos, knightMoves) &&
        this.canItBeCaptured(pos)
      ) {
        this.canBeCaptured.push(pos);
      }
    });

    return knightMoves;
  }

  getDirectionalMoves(directions: number[]): Position[] {
    if (!this.selectedSquare) return [];
    let straightMoves: Position[] = [];

    directions.forEach((dir) => {
      let currentPosition = this.selectedSquare!;
      while (true) {
        if (this.isOwnPiece(currentPosition)) {
          break;
        }

        if (this.canItBeCaptured(currentPosition)) {
          this.canBeCaptured.push(currentPosition);
          straightMoves.push(currentPosition);
          break;
        }

        if (this.isLastAvailableSquare(currentPosition, dir)) {
          straightMoves.push(currentPosition);
          break;
        }

        straightMoves.push(currentPosition);
        currentPosition = this.peekPiece(currentPosition, dir);
      }
    });

    return straightMoves;
  }

  isOwnPiece(pos: Position) {
    if (!this.currentBoard[pos[0]][pos[1]]) return false;
    if (this.arrayEqual(this.selectedSquare, pos)) return false;

    if (
      this.whiteToPlay &&
      this.currentBoard[pos[0]][pos[1]] ==
        this.currentBoard[pos[0]][pos[1]].toUpperCase()
    ) {
      return true;
    }
    if (
      !this.whiteToPlay &&
      this.currentBoard[pos[0]][pos[1]] ==
        this.currentBoard[pos[0]][pos[1]].toLowerCase()
    ) {
      return true;
    }

    return false;
  }

  canItBeCaptured(pos: Position): Boolean {
    if (this.arrayEqual(this.selectedSquare, pos)) return false;
    if (this.currentBoard[pos[0]][pos[1]]) {
      return true;
    }
    return false;
  }

  peekPiece(pos: Position, dir: number): Position {
    return this.numberToPosition(this.positionToNumber(pos) + dir);
  }

  isLastAvailableSquare(pos: Position, dir: number): Boolean {
    // check left and right border

    if (
      (pos[0] == 0 && [-9, -1, 7].includes(dir)) ||
      (pos[0] == 7 && [9, 1, -7].includes(dir))
    )
      return true;

    // check top and bottom border

    if (
      (pos[1] == 0 && [-9, -8, -7].includes(dir)) ||
      (pos[1] == 7 && [9, 8, 7].includes(dir))
    )
      return true;

    return false;
  }

  movePiece(desiredSquare: Position) {
    if (!this.selectedSquare) return;
    this.previousMoveFrom = this.selectedSquare
    this.previousMoveTo = desiredSquare
    this.currentBoard[desiredSquare[0]][desiredSquare[1]] =
      this.currentBoard[this.selectedSquare[0]][this.selectedSquare[1]];
    this.currentBoard[this.selectedSquare[0]][this.selectedSquare[1]] = null;
    this.currentFen = this.getFenString();
    this.whiteToPlay = !this.whiteToPlay;
  }

  validateMove(pos1: Position, pos2: Position) {
    if (this.arrayEqual(pos1, pos2)) return false;

    if (!this.containsPosition(pos2, this.suggestedSquares)) return false;

    return true;
  }

  containsPosition(pos: Position, arrays: Position[]) {
    return arrays.filter((arr) => this.arrayEqual(pos, arr)).length;
  }

  arrayEqual(arr1: Position | undefined, arr2: Position | undefined) {
    if (!arr1 || !arr2) return;
    return arr1.every((element, index) => element === arr2[index]);
  }

  positionToNumber(pos: Position): number {
    return pos[1] * 8 + pos[0];
  }

  numberToPosition(num: number): Position {
    return [num % 8, (num - (num % 8)) / 8] as Position;
  }

  fenToArray(fen: any): any[][] {
    const rows = fen.split(' ')[0].split('/');
    const board = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].split('');
      const boardRow = [];

      for (let j = 0; j < row.length; j++) {
        if (!isNaN(row[j])) {
          for (let k = 0; k < parseInt(row[j]); k++) {
            boardRow.push(null);
          }
        } else {
          boardRow.push(row[j]);
        }
      }

      board.push(boardRow);
    }

    return board;
  }

  getFenString(): string {
    let fenString = '';
    for (let row = 0; row < 8; row++) {
      let emptySquares = 0;
      for (let col = 0; col < 8; col++) {
        const piece = this.currentBoard[row][col];
        if (piece === null) {
          emptySquares++;
        } else {
          if (emptySquares > 0) {
            fenString += emptySquares;
            emptySquares = 0;
          }
          fenString += piece;
        }
      }
      if (emptySquares > 0) {
        fenString += emptySquares;
      }
      if (row < 7) {
        fenString += '/';
      }
    }
    return fenString;
  }

  resetBoard(){
    this.currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
    this.ngOnInit()
  }

  fenToClipboard(){
    navigator.clipboard.writeText(this.getFenString())
  }

  loadFen(fen: string, element: HTMLInputElement){
    element.value = ''
    if(!fen) return
    this.currentFen = fen
    this.ngOnInit()
  }
}
