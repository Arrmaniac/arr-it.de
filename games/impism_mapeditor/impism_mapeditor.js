const terrain_underlay = {
    "0":	"level grass", //	clearing, cotton, cattle, horse, town
    "1":	"forest", //		forest
    "2":	"hill", //		barren hills, wool
    "3":	"mountain", //	mountain
    "4": 	"swamp", //		swamp
    "5":	"ocean", //		ocean
    "6":	"wasteland", //	desert, tundra
    "7": 	"farmland" //	grain, orchard
};

let terrain_underlay_reversed = Object.fromEntries(Object.entries(terrain_underlay).map(item => item.reverse()));

const terrain_overlay = {
    "0":	"ocean",
	"1":	"clear",
	"2":	"cotton",
	"3":	"cattle",
	"4":	"horse",
	"5":	"grain",
	"6":	"orchard",
	"7":	"wool",
	"8":	"hill",
	"9":	"mountain",
	"10":	"swamp",
	"11":	"desert",
	"12":	"tundra",
	"13":	"forest",
	"14":	"town",		//(may be inactive as byte 30 determines town type)
	"15":	"scrub-forest",
	"16":	"capital"		//(may be inactive as byte 30 determines town type)
};

let terrain_overlay_reversed = Object.fromEntries(Object.entries(terrain_overlay).map(item => item.reverse()));

const resources = {
    "0":	"cotton",
    "1":	"wool",
    "2":	"forest",
    "3":	"coal",
    "4":	"iron",
    "5":	"horses",
    "6":	"oil",
    "17":	"grain",
    "18":	"fruit",
    "19":	"fish", // (not used)
    "20":	"cattle",
    "21":	"gems",
    "22":	"gold",
    "255":	"no resource"
};

const knownMapCapitalIdentifiers = [33,35]; //supposedly only 35
const kownSavegameCapitalIdentifiers = [41,53,61,63];
const knownSavegameTownIdentifiers = [34,38,42,62,54,50,58];

const Helper = {
    getElement: function(elementName, classList = [], parentElement = null, mode = 'append') {
        let element = document.createElement(elementName);

        if(Array.isArray(classList) && classList.length > 0) element.classList.add(...classList);

        if(parentElement instanceof Element) {
            if (mode === 'append') parentElement.append(element);
            else if (mode === 'prepend') parentElement.prepend(element);
            else if (mode === 'before') parentElement.before(element);
            else if (mode === 'after') parentElement.after(element);
        }

        return element;
    }
};



//https://ptsc.markement.com/Pixi/apps/UploadShipcodes
//let picker = document.getElementById('SendungShipcodeFileInput')
let picker = document.getElementById('scenariomapfile');
let canvas = document.getElementById('canvas');
let uintArray;
let processedMap = [];
let fileOffset = 0; // '0' => map-file, >0 => savegame-file
let fileMode = 'map;' //or 'savegame'
let numChangedCells = 0;

const wellknown_europe_northwest = {
    "0": 5,
    "1": 16,
    "2": 0,
    "3": 73,
    "4": 73,
    "5": 255,
    "6": 0,
    "7": 33,
    "8": 0,
    "9": 0,
    "10": 0,
    "11": 24,
    "12": 0,
    "13": 0,
    "14": 243,
    "15": 0,
    "16": 255,
    "17": 255,
    "18": 255,
    "19": 0,
    "20": 255,
    "21": 255,
    "22": 255,
    "23": 0,
    "24": 255,
    "25": 243,
    "26": 255,
    "27": 255,
    "28": 0,
    "29": 0,
    "30": 243,
    "31": 243,
    "32": 0,
    "33": 0,
    "34": 0,
    "35": 0
};

function readFile() {
    //picker.files[0]
    //File {name: 's0.map', lastModified: 864226494000, lastModifiedDate: Wed May 21 1997 16:54:54 GMT+0200 (Mitteleuropäische Sommerzeit), webkitRelativePath: '', size: 309312, …}
    let mapFile = picker.files[0];
    let reader = new FileReader();
    reader.addEventListener('load', event => {
            let readResult = reader.result;
            uintArray = getByteArrayFromScenarioFile(readResult);
            //console.log(`first 36 bytes`, uintArray.slice(0,36));
            fileOffset = seekMapDataStart(readResult);
            fileMode = (fileOffset === 0) ? 'map' : 'savegame';
            numChangedCells = 0;
            //console.log(`fileOffset`, fileOffset);
            processedMap = processMap(uintArray);
            paintProcessedMap();
        });
    //reader.readAsArrayBuffer(mapFile);
    reader.readAsArrayBuffer(mapFile);
}

function matchesWellknownEuropeNorthwest(slice = []) {
    console.log(`wellknown_europe_northwest`, wellknown_europe_northwest);
    console.log(`slice`, slice);
    return true;
    /*
    for(let index  = 0; index < slice.length; index++) {
        if(wellknown_europe_northwest.at(`${index}`) !== slice[index]) return false;
    }

    return true;
    */
}

function seekMapDataStart(readResult) {
    let IntArray = new Int8Array(readResult, 0, readResult.byteLength);

    for(let saughtIndex = 0; saughtIndex < IntArray.length - 36; saughtIndex++) {
        if(
               IntArray[saughtIndex + 22] === -1
            && IntArray[saughtIndex + 23] === 0
            && IntArray[saughtIndex + 24] === -1
            && IntArray[saughtIndex + 26] === -1
            && IntArray[saughtIndex + 27] === -1
            && IntArray[saughtIndex + 28] === 0
            && IntArray[saughtIndex + 32] === 0
            && IntArray[saughtIndex + 33] === 0
            && IntArray[saughtIndex + 34] === 0
            && IntArray[saughtIndex + 35] === 0
            /*
            matchesWellknownEuropeNorthwest(IntArray.slice(saughtIndex, saughtIndex + 35))
            */
        ) {
            console.log(`found special index`, saughtIndex);
            return saughtIndex;
        }
    }

    return 0;
}

function getByteArrayFromScenarioFile(readResult) {
    //ArrayBuffer(309312)byteLength: 309312detached: falsemaxByteLength: 309312resizable: false[[Prototype]]: ArrayBuffer[[Int8Array]]: Int8Array(309312)[[Uint8Array]]: Uint8Array(309312)[[Int16Array]]: Int16Array(154656)[[Int32Array]]: Int32Array(77328)[[ArrayBufferByteLength]]: 309312[[ArrayBufferData]]: 134
    let uintArray = new Uint8Array(readResult, 0, readResult.byteLength);
    //uintArray
    //Uint8Array(309312) [5, 16, 0, 73, 73, 255, 0, 33, 0, 0, 0, 24, 0, 0, 243, 0, 255, 255, 255, 0, 255, 255, 255, 0, 255, 243, 255, 255, 0, 0, 243, 243, 0, 0, 0, 0, 5, 0, 0, 73, 73, 255, 0, 33, 0, 0, 0, 0, 0, 0, 243, 0, 255, 255, 255, 0, 255, 255, 255, 0, 255, 243, 255, 255, 0, 0, 243, 243, 0, 0, 0, 0, 5, 0, 0, 73, 73, 255, 0, 33, 0, 0, 0, 0, 0, 0, 243, 0, 255, 255, 255, 0, 255, 255, 255, 0, 255, 243, 255, 255, …][0 … 9999][10000 … 19999][20000 … 29999][30000 … 39999][40000 … 49999][50000 … 59999][60000 … 69999][70000 … 79999][80000 … 89999][90000 … 99999][100000 … 109999][110000 … 119999][120000 … 129999][130000 … 139999][140000 … 149999][150000 … 159999][160000 … 169999][170000 … 179999][180000 … 189999][190000 … 199999][200000 … 209999][210000 … 219999][220000 … 229999][230000 … 239999][240000 … 249999][250000 … 259999][260000 … 269999][270000 … 279999][280000 … 289999][290000 … 299999][300000 … 309311]buffer: ArrayBuffer(309312)byteLength: 309312byteOffset: 0length: 309312Symbol(Symbol.toStringTag): "Uint8Array"[[Prototype]]: TypedArray

    return uintArray;
}

class Cell {
    payload = [];
    byteIndex = 0;
    x = 0;
    y = 0;
    paintedCell;

    constructor(payload, byteIndex, x, y) {
        this.payload = payload;
        this.byteIndex = byteIndex;
        this.x = x;
        this.y = y;
    }

    #concatBytes(from, toBefore = undefined) {
        return this.payload.slice(from, toBefore).reduce((carry,item) => carry +  `${item} `.padStart(4,'0'), '');
    }

    toString() {
        return JSON.stringify({'byte_index': this.byteIndex,'x': this.x, 'y': this.y,
        'byte00_05': this.#concatBytes(0,6),
        'byte06_11': this.#concatBytes(6,12),
        'byte12_17': this.#concatBytes(12,18),
        'byte18_23': this.#concatBytes(18,24),
        'byte24_29': this.#concatBytes(24,30),
        'byte30_35': this.#concatBytes(30),
        'terrain_underlay': this.TerrainUnderlay,
        'terrain_overlay': this.TerrainOverlay,
        'nation_or_seazone': this.NationOrSeazone,
        'province': this.Province,
        'resource_a': this.ResourceA,
        'resource_b': this.ResourceB,
        'town_type': this.TownType
        }, null, '  ');
    }

    get isDifferentToOriginal() {
        for(let index = 0; index < this.payload.length; index++) {
            let payloadByte = this.payload.at(index);
            let originalByte = uintArray.at(this.byteIndex + index);

            if(payloadByte !== originalByte) return true;
        }

        return false;
    }

    get TerrainUnderlay() {
        return terrain_underlay[`${this.payload.at(0)}`];
    }

    get TerrainOverlay() {
        return terrain_overlay[`${this.payload.at(19)}`];
    }

    get NationOrSeazone() {
        return parseInt(this.payload.at(3));
    }

    get Province() {
        return (parseInt(this.payload.at(20))<<8) + parseInt(this.payload.at(21));
    }

    get ResourceA() {
        return resources[`${this.payload.at(17)}`];
    }

    get ResourceB() {
        return resources[`${this.payload.at(18)}`];
    }

    get TownType() {
        let townType = 'none';
        let identifier;
    
        if(fileMode === 'map') {
            identifier = this.payload.at(29);
    
            if(knownMapCapitalIdentifiers.findIndex(item => item === identifier) > -1) townType = 'capital';
            if(identifier === 34) townType = 'town';
        } else if (fileMode === 'savegame') {
            identifier = this.payload.at(28);
    
            if (kownSavegameCapitalIdentifiers.findIndex(item => item === identifier) > -1) townType = 'capital';
            if (knownSavegameTownIdentifiers.findIndex(item => item === identifier) > -1) townType = 'town';
        }
    
        if(townType !== 'none' && this.NationOrSeazone > 6) townType += '-minor';
    
        return townType;
    }

    isOceanTile() {
        return this.Province === 65535;
    }

    hasDirectionSet(direction, ByteValue) {
        switch(direction) {
            case 'NE':
                return (ByteValue & 1) > 0;
            case 'E':
                return (ByteValue & (1<<1)) > 0;
            case 'SE':
                return (ByteValue & (1<<2)) > 0;
            case 'SW':
                return (ByteValue & (1<<3)) > 0;
            case 'W':
                return (ByteValue & (1<<4)) > 0;
            case 'NW': 
                return (ByteValue & (1<<5)) > 0;
        }

        return false;
    }

    hasNationBorder(direction) {
        let nationBorderByte = parseInt(this.payload.at(7));

        switch(direction) {
            case 'N':
                return this.hasDirectionSet('NW', nationBorderByte) || this.hasDirectionSet('NE', nationBorderByte);
            case 'S':
                return this.hasDirectionSet('SW', nationBorderByte) || this.hasDirectionSet('SE', nationBorderByte);
        }

        return this.hasDirectionSet(direction, nationBorderByte);
    }

    #setUnderlayOverlay(targetUnderlayName = undefined, targetOverlayName = undefined) {
        if(targetUnderlayName !== undefined) {
            let newUnderlayByteValue = terrain_underlay_reversed[targetUnderlayName];

            if(newUnderlayByteValue === undefined) throw `Unknown targetUnderlayName "${targetUnderlayName}"`;

            this.payload[0] = parseInt(newUnderlayByteValue);
        }

        if(targetOverlayName !== undefined) {
            let newOverlayByteValue = terrain_overlay_reversed[targetOverlayName];

            if(newOverlayByteValue === undefined) throw `Unknown targetOverlayName "${targetOverlayName}"`;

            this.payload[19] = parseInt(newOverlayByteValue);
        }
    }

    #changeToOilSoilIfApplicable() {
        if(['swamp', 'wasteland'].find(item => item === this.TerrainUnderlay)) return;

        let defaultSoil = 'swamp';
        this.#setUnderlayOverlay('swamp', 'swamp');
    }

    #changeToHillIfApplicable() {
        if(this.TerrainUnderlay === 'hill' && this.TerrainOverlay === 'hill' || this.TerrainUnderlay === 'mountain') return;

        this.#setUnderlayOverlay('hill', 'hill');
    }

    #changeToTargetUnderlayOverlayIfDifferentOverlay(targetUnderlay, targetOverlay) {
        if(this.TerrainOverlay === targetOverlay) return;

        this.#setUnderlayOverlay(targetUnderlay, targetOverlay);
    }

    #changeResourceAFor(newResourceName, newResourceValue) {
        switch(newResourceName) {
            case 'forest':
                this.#changeToTargetUnderlayOverlayIfDifferentOverlay('forest', 'forest');
                break;
            case 'wool':
                this.#changeToTargetUnderlayOverlayIfDifferentOverlay('hill', 'wool');
                break;
            case 'gems':
                this.#changeToTargetUnderlayOverlayIfDifferentOverlay('mountain', 'mountain');
                break;
            case 'cotton':
                this.#changeToTargetUnderlayOverlayIfDifferentOverlay('level grass', 'cotton');
                break;
            case 'fruit':
                this.#changeToTargetUnderlayOverlayIfDifferentOverlay('farmland', 'orchard');
                break;
            case 'grain':
                this.#changeToTargetUnderlayOverlayIfDifferentOverlay('farmland', 'grain');
                break;
            case 'cattle':
                this.#changeToTargetUnderlayOverlayIfDifferentOverlay('level grass', 'cattle');
                break;
            case 'horses':
                this.#changeToTargetUnderlayOverlayIfDifferentOverlay('level grass', 'horse');
                break;
            case 'coal':
            case 'iron':
            case 'gold':
                this.#changeToHillIfApplicable();
                break;
            case 'oil':
                this.#changeToOilSoilIfApplicable();
                break;
        }

        this.payload[17] = newResourceValue;
    }

    #changeResourceBFor(newResourceName, newResourceValue) {
        this.payload[18] = newResourceValue;
    }
    
    changeResource(resourceType, newResourceName, newResourceValue) {
        console.log(`Changeing resource${resourceType.toUpperCase()} for cell...`, this, newResourceName, newResourceValue);

        if(resourceType === 'a') {
            this.#changeResourceAFor(newResourceName, newResourceValue);
        } else if(resourceType === 'b') {
            this.#changeResourceBFor(newResourceName, newResourceValue);
        }

        repaintCell(this);
        numChangedCells++;
    }

    getNeighbour(direction) {
        let neighbourX = this.x;
        let neighbourY = this.y;

        if(['NE','NW'].find(item => item === direction)) neighbourY--;
        else if(['SE','SW'].find(item => item === direction)) neighbourY++;

        if(direction === 'W') neighbourX--;
        else if(direction === 'E') neighbourX++;
        else if((this.y % 2 === 0) && ['NW','SW'].find(item => item === direction)) neighbourX--;
        else if((this.y % 2 === 1) && ['NE','SE'].find(item => item === direction)) neighbourX++;

        return processedMap.at(neighbourY).at(neighbourX);
    }
}

/*
const kownSavegameCapitalIdentifiers = [41,61,63];
const knownSavegameTownIdentifiers = [34,42,62,54,50,58];

function getNationOrSeazoneFromPayload(payload) {
    return parseInt(payload.at(3));
}

function getTownTypeFromPayload(payload) {
    let townType = 'none';
    let identifier;

    if(fileMode === 'map') {
        identifier = payload.at(29);

        if(identifier === 35) townType = 'capital';
        if(identifier === 34) townType = 'town';
    } else if (fileMode === 'scenario') {
        identifier = payload.at(28);

        if (kownSavegameCapitalIdentifiers.findIndex(item => item === identifier) > -1) townType = 'capital';
        if (knownSavegameTownIdentifiers.findIndex(item => item === identifier) > -1) townType = 'town';
    }

    if(townType !== 'none' && getNationOrSeazoneFromPayload(payload) > 6) townType += '-minor';

    return townType;
}
*/

function processCellsInRow(uintArray, processedMap, currentRow, currentCell = 0) {
    if (currentCell === 108) return;

    let start = fileOffset + (currentRow * 108 + currentCell) * 36;
    let end   = start + 36;
    let payload = uintArray.slice(start, end);
    let cell = new Cell(payload, start, currentCell, currentRow);
    processedMap.at(currentRow).push(cell);

    return processCellsInRow(uintArray, processedMap, currentRow, ++currentCell);
}

function processRows(uintArray, processedMap, currentRow = 0) {
    if (currentRow === 60) return;

    processedMap.push([]);
    processCellsInRow(uintArray, processedMap, currentRow);
    
    return processRows(uintArray, processedMap, ++currentRow);
}

function processMap(uintArray) {
    let processedMap = [];
    processRows(uintArray, processedMap);

    return processedMap;
}

//read 60 rows
//read 108 cells per rows
//read 36 bytes per cell

//find terrain in byte00
//find nation/seazone in byte03
//find nation/seazone in byte04 (repeated)
//find resourceA in byte17
//find resourceB in byte18


//document.body.append(canvas);
//canvas.style.position = 'fixed';
//canvas.style.left = '0px';
//canvas.style.right = '0px';
//canvas.style.top = '0px';
//canvas.style.bottom = '0px';
//canvas.style.backgroundColor = 'white';

function addTownIfApplicable(paintedCell, townType) {
    if(townType === 'none') return;

    let img = Helper.getElement('img', ['town-overlay'], paintedCell);
    let town_file_path = 'assets/city/' + townType + '.png';
    img.src = town_file_path;
}

function getResourceImgNode(resource, a_or_b = 'a') {
    let resource_file_path = 'assets/resources/' + resource + '.png';
    let resourceSubType = 'resource-' + a_or_b;
    let img = Helper.getElement('img', ['resource', resourceSubType]);
    img.src = resource_file_path;

    return img;
}

function addResourceAIfApplicable(paintedCell, cell) {
    if(cell.ResourceA === 'no resource') return;

    let img = getResourceImgNode(cell.ResourceA, 'a');
    paintedCell.append(img);
}

function addResourceBIfApplicable(paintedCell, cell) {
    if(cell.ResourceB === 'no resource') return;

    let img = getResourceImgNode(cell.ResourceB, 'b');
    paintedCell.append(img);
}

function paintNationBorderIfApplicable(paintedCell, cell) {
    if(cell.NationOrSeazone > 22) return;

    let nationClass = 'nation-';
    nationClass += (cell.NationOrSeazone < 7) ? cell.NationOrSeazone : 'minor';

    if(cell.x > 0) {
        let westNeighbourCell = processedMap.at(cell.y).at(cell.x-1);

        if(westNeighbourCell.NationOrSeazone !== cell.NationOrSeazone) {
            paintedCell.classList.add('nation-border-west', nationClass);
        }
    }

    if(cell.x < (processedMap.at(cell.y).length - 1)) {
        let eastNeighbourCell = processedMap.at(cell.y).at(cell.x+1);

        if(eastNeighbourCell.NationOrSeazone !== cell.NationOrSeazone) {
            paintedCell.classList.add('nation-border-east', nationClass);
        }
    }

    if(cell.y > 0) {
        let northNeighbourCell = processedMap.at(cell.y-1).at(cell.x);

        if(northNeighbourCell.NationOrSeazone !== cell.NationOrSeazone) {
            paintedCell.classList.add('nation-border-north', nationClass);
        }
    }

    if(cell.y < (processedMap.length - 1)) {
        let southNeighbourCell = processedMap.at(cell.y+1).at(cell.x);

        if(southNeighbourCell.NationOrSeazone !== cell.NationOrSeazone) {
            paintedCell.classList.add('nation-border-south', nationClass);
        }
    }
}

function paintProvinceBorderIfApplicable(paintedCell, cell) {
    if(cell.isOceanTile()) return;

    if(!cell.hasNationBorder('W') && cell.x > 0) {
        let westNeighbourCell = processedMap.at(cell.y).at(cell.x-1);

        if(!westNeighbourCell.isOceanTile() &&  westNeighbourCell.Province !== cell.Province) {
            paintedCell.classList.add('province-border-west');
        }
    }

    if(!cell.hasNationBorder('E') && cell.x < (processedMap.at(cell.y).length - 1)) {
        let eastNeighbourCell = processedMap.at(cell.y).at(cell.x+1);

        if(!eastNeighbourCell.isOceanTile() && eastNeighbourCell.Province !== cell.Province) {
            paintedCell.classList.add('province-border-east');
        }
    }

    if(!cell.hasNationBorder('N') && cell.y > 0) {
        let northNeighbourCell = processedMap.at(cell.y-1).at(cell.x);

        if(!northNeighbourCell.isOceanTile() && northNeighbourCell.Province !== cell.Province) {
            paintedCell.classList.add('province-border-north');
        }
    }

    if(!cell.hasNationBorder('S') && cell.y < (processedMap.length - 1)) {
        let southNeighbourCell = processedMap.at(cell.y+1).at(cell.x);

        if(!southNeighbourCell.isOceanTile() && southNeighbourCell.Province !== cell.Province) {
            paintedCell.classList.add('province-border-south');
        }
    }
}

function paintCell(cell, currentRow, currentCell) {
    let paintedCell = Helper.getElement('div', ['terrain', cell.TerrainOverlay], canvas);
    let horizontal_offset = (currentRow % 2 === 1) ? 32 : 0;
    paintedCell.style.top = (currentRow * 64) + 'px';
    paintedCell.style.left = (horizontal_offset + currentCell * 64) + 'px';
    paintedCell.dataset.x = currentCell;
    paintedCell.dataset.y = currentRow;

    let bgColor = 'grey';

    if(cell.TerrainUnderlay === 'ocean') bgColor = 'lightblue';
    else if(cell.ResourceA === 'coal') bgColor = 'black';
    else if(cell.ResourceA === 'iron') bgColor = 'brown';
    else if(cell.ResourceA === 'forest') bgColor = 'darkgreen';

    //paintedCell.style.backgroundColor = bgColor;
    addTownIfApplicable(paintedCell, cell.TownType);
    addResourceAIfApplicable(paintedCell, cell);
    addResourceBIfApplicable(paintedCell, cell);
    paintNationBorderIfApplicable(paintedCell, cell);
    paintProvinceBorderIfApplicable(paintedCell, cell);
    cell.paintedCell = paintedCell;
}

function repaintCell(cell) {
    let paintedCell = cell.paintedCell;
    paintedCell.innerHTML = ``;
    paintedCell.classList.value = '';
    paintedCell.classList.add('terrain', cell.TerrainOverlay);
    addTownIfApplicable(paintedCell, cell.TownType);
    addResourceAIfApplicable(paintedCell, cell);
    addResourceBIfApplicable(paintedCell, cell);
    paintNationBorderIfApplicable(paintedCell, cell);
    paintProvinceBorderIfApplicable(paintedCell, cell);
}

function paintProcessedMap() {
    canvas.innerHTML = ``;

    for(let currentRow = 0; currentRow < processedMap.length; currentRow++) {
        let row = processedMap.at(currentRow);
        for(let currentCell = 0; currentCell < row.length; currentCell++) {
            let cell = row.at(currentCell);
            paintCell(cell, currentRow, currentCell);
        }
    }
}

function getResourceRadioList(cellResource, resourceType = 'A') {
    let resourceList = Helper.getElement('ul', ['list-type-radio']);
    let resourceTypeName = 'resource' + resourceType;
    Object.entries(resources).forEach(([index,resource]) => {
        let li = Helper.getElement('li', null, resourceList);
        let resourceImgFilename = `${resource.replaceAll(/\W/g, '_')}.png`;
        li.innerHTML = `<label><input type="radio" value="${index}" name="${resourceTypeName}" data-resource-name="${resource}"> <img src="assets/resources/${resourceImgFilename}"> <span>${resource}</span></label>`;

        if(cellResource === resource) {
            li.querySelector('input').checked = true;
            li.querySelector('input').dataset.wasOriginal = 'yes';
            li.querySelector('span').style.backgroundColor = 'lightgrey';
        }
    });

    return resourceList;
}

function getCleanPaintedCellClone(cell, removeHighlight = true) {
    let clonedPaintedCell = cell.paintedCell.cloneNode(true);
    clonedPaintedCell.style.top = '0px';
    clonedPaintedCell.style.left = '0px';
    clonedPaintedCell.style.position = 'relative';

    if(removeHighlight) clonedPaintedCell.classList.remove('highlighted');

    return clonedPaintedCell;
}

const terrainDialog = Helper.getElement('dialog', null, document.body);

/*
 * Event Listeners:
 */

canvas.addEventListener('click', event => {
    if(!event.target.matches('.terrain')) return;

    let paintedCell = event.target;
    paintedCell.classList.add('highlighted');
    let cell = processedMap.at(paintedCell.dataset.y).at(paintedCell.dataset.x);
    terrainDialog.dataset.x = paintedCell.dataset.x;
    terrainDialog.dataset.y = paintedCell.dataset.y;
    terrainDialog.innerHTML = `<div class="cell-frame" data-cell-frame></div><ul data-action-list><li><details><summary>Payload-Data</summary><code class="code-view"></code></details></li></ul><button data-button-close>close</button>`;
    let cellFrame = terrainDialog.querySelector('[data-cell-frame]');
    let clonedPaintedCell = paintedCell.cloneNode(true);
    clonedPaintedCell.style.top = '0px';
    clonedPaintedCell.style.left = '0px';
    clonedPaintedCell.style.position = 'relative';
    clonedPaintedCell.classList.remove('highlighted');
    cellFrame.append(clonedPaintedCell);
    let infoBox = Helper.getElement('div', null, cellFrame);
    infoBox.innerText = `${cell.isDifferentToOriginal ? 'has been changed' : 'still original'}`;
    terrainDialog.querySelector('code').innerText = `${cell}`;
    let actionList = terrainDialog.querySelector('[data-action-list]');

    let resourceAactionItem = Helper.getElement('li', null, actionList);
    resourceAactionItem.innerHTML = `<details data-resource-type="a"><summary>ResourceA - Actions</summary><button data-resource-confirm-button>Confirm Changes</button></details>`;
    let resourceAdetails = resourceAactionItem.querySelector('details');
    let confirmButtonResourceA = resourceAdetails.querySelector('[data-resource-confirm-button]');
    let resourceAlist = getResourceRadioList(cell.ResourceA, 'A');
    confirmButtonResourceA.before(resourceAlist);

    let resourceBactionItem = Helper.getElement('li', null, actionList);
    resourceBactionItem.innerHTML = `<details data-resource-type="b"><summary>ResourceB - Actions</summary><button data-resource-confirm-button>Confirm Changes</button></details>`;
    let resourceBdetails = resourceBactionItem.querySelector('details');
    let confirmButtonResourceB = resourceBdetails.querySelector('[data-resource-confirm-button]');
    let resourceBlist = getResourceRadioList(cell.ResourceB, 'B');
    confirmButtonResourceB.before(resourceBlist);

    let neighbourCellsActionItem = Helper.getElement('li', null, actionList);
    neighbourCellsActionItem.innerHTML = `<details><summary>Neighbour Cells</summary><ul></ul></details>`;
    let sublist = neighbourCellsActionItem.querySelector('ul');
    ['NW','NE','W','E','SW','SE'].forEach(direction => {
        let li = Helper.getElement('li', null, sublist);
        li.innerHTML = `<details><summary>${direction}-Neighbour</summary><code class="code-view"></code></details`;
        let code = li.querySelector('code');
        code.innerText = `${cell.getNeighbour(direction)}`;
    });
    let mapView = Helper.getElement('div', ['map-view'], neighbourCellsActionItem);
    mapView.innerHTML = `<div data-north-row></div><div data-same-row></div><div data-south-row></div>`;
    let northRow = mapView.querySelector('[data-north-row]');
    let sameRow  = mapView.querySelector('[data-same-row]');
    let southRow = mapView.querySelector('[data-south-row]');
    northRow.append(getCleanPaintedCellClone(cell.getNeighbour('NW')));
    northRow.append(getCleanPaintedCellClone(cell.getNeighbour('NE')));
    sameRow.append(getCleanPaintedCellClone(cell.getNeighbour('W')));
    sameRow.append(getCleanPaintedCellClone(cell, false));
    sameRow.append(getCleanPaintedCellClone(cell.getNeighbour('E')));
    southRow.append(getCleanPaintedCellClone(cell.getNeighbour('SW')));
    southRow.append(getCleanPaintedCellClone(cell.getNeighbour('SE')));


    terrainDialog.showModal();
}, true);

terrainDialog.addEventListener('click', event => {
    if(event.target.matches('[data-button-close]')) {
        let cell = processedMap.at(terrainDialog.dataset.y).at(terrainDialog.dataset.x);
        cell.paintedCell.classList.remove('highlighted');
        terrainDialog.close();
        return;
    }

    if(event.target.matches('[data-resource-confirm-button]')) {
        let confirmButton = event.target;
        let actionItem = confirmButton.closest('details[data-resource-type]');
        let resourceType = actionItem.dataset.resourceType;
        let checkedOption = [...actionItem.querySelectorAll('input')].find(input => input.checked);
        let originalOption = actionItem.querySelector('input[data-was-original]');

        if(checkedOption === originalOption) return;

        let cell = processedMap.at(terrainDialog.dataset.y).at(terrainDialog.dataset.x);
        cell.changeResource(resourceType, checkedOption.dataset.resourceName, checkedOption.value);
        let cellFrame = terrainDialog.querySelector('[data-cell-frame]');
        cellFrame.innerHTML = ``;
        let clonedPaintedCell = cell.paintedCell.cloneNode(true);
        clonedPaintedCell.style.top = '0px';
        clonedPaintedCell.style.left = '0px';
        clonedPaintedCell.style.position = 'relative';
        clonedPaintedCell.classList.remove('highlighted');
        cellFrame.append(clonedPaintedCell);
        let infoBox = Helper.getElement('div', null, cellFrame);
        infoBox.innerText = `${cell.isDifferentToOriginal ? 'has been changed' : 'still original'}`;
        
        return;
    }
});

document.getElementById('readscenario').addEventListener('click', event => {
    readFile();
});

document.getElementById('writescenario').addEventListener('click', event => {
    if(numChangedCells < 1) return console.warn(`No cells have been changed. Stopped.`);

    let newDataArray = Array.from(uintArray);

    for(let currentRow = 0; currentRow < processedMap.length; currentRow++) {
        let row = processedMap.at(currentRow);
        for(let currentCell = 0; currentCell < row.length; currentCell++) {
            let cell = row.at(currentCell);

            if(!cell.isDifferentToOriginal) continue;

            newDataArray.splice(cell.byteIndex, cell.payload.length, ...cell.payload);
        }
    }

    let newUint8Array = Uint8Array.from(newDataArray);
    let blob = new Blob([newUint8Array]);
    let url = window.URL.createObjectURL(blob);
    let a = Helper.getElement('a', null, event.target, 'after');
    a.href = url;
    downloadFilename = 'slot56.imp';

    if(fileMode === 'map') downloadFilename = 's56.map';

    a.download = downloadFilename;
    a.innerText = downloadFilename;
});
