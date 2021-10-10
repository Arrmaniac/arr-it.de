let score = 0;
let Gameboard = document.querySelector('#gameboard')
let boardFields = [
    [],
    [],
    [],
    []
];
let ongoingTouches = [];

boardFields.forEach((item, index) => {
    let boardRow = Gameboard.querySelector('div.board-row:nth-child(' + (1 + index) + ')'); 
    boardRow.querySelectorAll('div.board-field').forEach(boardField => boardFields[index].push(boardField));
});

function removeTile(boardField) {
	boardField.innerHTML = '';
	boardField.style.cssText = '';
}

function resetGameBoard() {
	boardFields.forEach(row => {
		row.forEach(boardField => removeTile(boardField));
	});
}

function isBoardFieldEmpty(boardField) {
	return boardField.innerHTML === '';
}

function getBoardFieldTileValue(boardField) {
	if(isBoardFieldEmpty(boardField)) {
		return 0;
	}
	
	return parseInt(boardField.innerText);
}

function castTileValue() {
	return (Math.random() < 0.8) ? 2 : 4;
}

function getColorForValue(value) {
	let stage = Math.floor(Math.log2(value)) - 1;
	let red = 255 - stage * 5;
	let green = 240 - stage * 10;
	let blue = 200 - stage * 20;
	
	return {
		red: (red < 0) ? 0 : red,
		green: (green < 0) ? 0 : green,
		blue: (blue < 0) ? 0 : blue
	};
}

function getTextColorForBackgoundColor({red, green, blue}) {
	let setList = [red, green, blue].sort((a,b) => (a<b) ? -1 : 1);
	let darkestValue = setList.shift();
	
	return darkestValue < 150 ? 'white' : 'black';
}

function getFontSizeForValue(value) {
	let smallFactor = Math.floor(Math.log10(value) - 1);
	
	return 50 - 10 * smallFactor;
}

function selectRandomEmptyBoardfield() {
	let candidates = Array.from(Gameboard.querySelectorAll('div.board-field')).filter(boardField => boardField.innerHTML === '');
	
	if(candidates.length < 1) {
		return null;
	}
	
	let targetIndex = Math.floor(candidates.length * Math.random());
	
	return candidates[targetIndex];
}

function createTile(value = null, boardField = null) {
	let tileValue = (value === null) ? castTileValue() : value;
	boardField = (boardField === null) ? selectRandomEmptyBoardfield() : boardField;
	
	if(boardField === null) {
		throw 'Cannot create a new tile!';
	}
	
	let bgColor = getColorForValue(tileValue);
	let textColor = getTextColorForBackgoundColor(bgColor);
	let fontSize = getFontSizeForValue(tileValue);
	boardField.innerText = tileValue;
	boardField.style.backgroundColor = 'rgb('+bgColor.red+','+bgColor.green+','+bgColor.blue+')';
	boardField.style.color = textColor;
	boardField.style.fontSize = '' + fontSize + 'px';
}

function findTouchByID(touchID) {
	return ongoingTouches.find(touch => touch.identifier === touchID);
}

function seekXDirection(boardField, row, column, endColumn, step) {
	if(column === endColumn) {
		return;
	}
	
	let neighbour = boardFields[row][column + step];
	let value = getBoardFieldTileValue(boardField);
	
	if(isBoardFieldEmpty(neighbour)) {
		removeTile(boardField);
		createTile(value, neighbour);
		seekXDirection(neighbour, row, column + step, endColumn, step);
	} else if(value === getBoardFieldTileValue(neighbour)) {
		let newValue = 2 * value;
		score += newValue;
		document.querySelector('#displayScore').innerText = score;
		removeTile(boardField);
		createTile(newValue, neighbour);
	}
}

function seekYDirection(boardField, row, column, endRow, step) {
	if(row === endRow) {
		return;
	}
	
	let neighbour = boardFields[row + step][column];
	let value = getBoardFieldTileValue(boardField);
	
	if(isBoardFieldEmpty(neighbour)) {
		removeTile(boardField);
		createTile(value, neighbour);
		seekYDirection(neighbour, row + step, column, endRow, step);
	} else if(value === getBoardFieldTileValue(neighbour)) {
		let newValue = 2 * value;
		score += newValue;
		document.querySelector('#displayScore').innerText = score;
		removeTile(boardField);
		createTile(newValue, neighbour);
	}
}

function moveTilesLeft() {
	for(let column = 1;column <= 3;column++) {
		for(let row = 0;row < 4;row++) {
			let boardField = boardFields[row][column];
			
			if(!isBoardFieldEmpty(boardField)) {
				seekXDirection(boardField, row, column, 0, -1);
			}
		}
	}
}

function moveTilesRight() {
	for(let column = 2;column >= 0;column--) {
		for(let row = 0;row < 4;row++) {
			let boardField = boardFields[row][column];
			
			if(!isBoardFieldEmpty(boardField)) {
				seekXDirection(boardField, row, column, 3, 1);
			}
		}
	}
}

function moveTilesDown() {
	for(let row = 2;row >= 0;row--) {
		for(let column = 0;column < 4;column++) {
			let boardField = boardFields[row][column];
			
			if(!isBoardFieldEmpty(boardField)) {
				seekYDirection(boardField, row, column, 3, 1);
			}
		}
	}
}

function moveTilesUp() {
	for(let row = 1;row <= 3;row++) {
		for(let column = 0;column < 4;column++) {
			let boardField = boardFields[row][column];
			
			if(!isBoardFieldEmpty(boardField)) {
				seekYDirection(boardField, row, column, 0, -1);
			}
		}
	}
}

function moveTiles(direction) {
	switch(direction) {
		case 'left':
			return moveTilesLeft();
		case 'up':
			return moveTilesUp();
		case 'right':
			return moveTilesRight();
		case 'down':
			return moveTilesDown();
	}
}

function handleTouchStart(event) {
	event.preventDefault();
	ongoingTouches = [];
	Array.from(event.touches).forEach(touch => {
		ongoingTouches.push(touch);
	});
}

function handleTouchEnd(event) {
	event.preventDefault();
	let endedTouches = Array.from(event.changedTouches).filter(touch => findTouchByID(touch.identifier) !== undefined);
	let movementVectors = endedTouches.map(touchEnd => {
		let touchStart = findTouchByID(touchEnd.identifier);
		return {
			x: touchEnd.clientX - touchStart.clientX,
			y: touchEnd.clientY - touchStart.clientY
		};
	});
	let largestMovement = movementVectors.reduce((carry, vector) => {
		vector.distance = Math.sqrt(Math.exp(vector.x, 2) + Math.exp(vector.y, 2));
		return (carry.distance > vector.distance) ? carry : vector;
	}, {x: 0, y: 0, distance: 0});
	let isUpDown = Math.abs(largestMovement.x) < Math.abs(largestMovement.y);
	let direction = '';
	
	if(isUpDown) {
		direction = (largestMovement.y < 0) ? 'up' : 'down';
	} else {
		direction = (largestMovement.x < 0) ? 'left' : 'right';
	}
	
	console.log(direction);
	moveTiles(direction);
	createTile();
}

function handleKeyboardKeyUp(event) {
	let keyPressed = event.key;
	
	if(keyPressed.match(/^Arrow(.+)$/)) {
		let methodName = 'moveTiles' + RegExp.$1;
		window[methodName]();
		createTile();
	}
}

Gameboard.addEventListener('touchstart', handleTouchStart, false);
Gameboard.addEventListener('touchend', handleTouchEnd, false);
document.body.addEventListener('keyup', handleKeyboardKeyUp, false);

createTile();
createTile();
