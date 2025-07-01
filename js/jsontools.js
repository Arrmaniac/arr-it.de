import {Helper} from '/js/arr-it-basic.js';

const $JsonExtractForExcelUseContainer = document.querySelector('[data-sectioncontainer="json-extract-for-excel-use"]');
const $JsonStringSource = $JsonExtractForExcelUseContainer.querySelector('[data-json-string-source]');
const $ConvertFromArrayButton = $JsonExtractForExcelUseContainer.querySelector('button[data-convert-from-array-button]');
const $ResulttableContainer = $JsonExtractForExcelUseContainer.querySelector('[data-resulttable-container]');

class Column {
    title;
    seenTypes = new Set();
    
    constructor(columnTitle) {
        this.title = columnTitle;
    }
    
    #calculateButtonSign($button) {
        if(this.seenTypes.size !== 1){ 
            $button.title = 'non-unique type';
            return '<?>';
        }
        
        let firstType = [...this.seenTypes][0];
        $button.title = `type: ${firstType}`;
        
        switch(firstType) {
            case 'object': return '{...}';
            case 'number': return '#';
            case 'string': return '"..."';
            case 'boolean': return '0|1';
            default: return firstType;
        }
    }
    
    getThButton() {
        let $button = Helper.getElement('button', ['user-select-none']);
        $button.innerText = this.#calculateButtonSign($button);
        return $button;
    }
}

const JsonTools = {
    $JsonExtractForExcelUseContainer,
    $JsonStringSource,
    $ConvertFromArrayButton,
    $ResulttableContainer,
    processExtractForExcelUse: function(event) {
        event.preventDefault();
        let jsonString = this.$JsonStringSource.value;
        let parsedJson = JSON.parse(jsonString);
        console.debug(parsedJson);

        if(Array.isArray(parsedJson)) {
            console.log('Is an Array.');
            let jsonObject = {table1: parsedJson};
            return this.processObjectForExcelUse(jsonObject);
        } else if (Object.keys(parsedJson).length > 0) {
            return this.processObjectForExcelUse(parsedJson);
        }

        console.log('Is NOT an Array.');
    },
    processObjectForExcelUse: function(jsonObject) {
        let $ul = Helper.getElement('ul', ['bg-white'], this.$ResulttableContainer, 'prepend');
        let self = this;
        Object.entries(jsonObject).forEach(([key, value]) => {
            let $li = Helper.getElement('li', [], $ul);
            let $details = Helper.getElement('details', [], $li);
            let $summary = Helper.getElement('summary', [], $details);
            $summary.innerText = `Table: "${key}"`;
            if(Array.isArray(value)) {
                $details.setAttribute('open', true);
                console.log(`Table: "${key}":`, value);
                self.processArrayForExcelUse(value, $details);
            } else {
                $summary.innerText += ` (not an array)`;
                let $pre = Helper.getElement('pre', ['code-view'], $details);
                $pre.innerText = JSON.stringify(value, null, "  ");
            }
        });
    },
    processArrayForExcelUse: function(jsonArray = [], $parentNode, appendMode = 'append') {
        let Columns = jsonArray.reduce((carry, item) => {
            if(typeof item === 'object') {
                Object.keys(item).forEach(key => {
                    if(!carry.has(key)) {
                        carry.set(key, new Column(key));
                    }
                    let column = carry.get(key);
                    column.seenTypes.add(typeof item[key]);
                });
            }
            return carry;
        }, new Map());
        let Headers = [...Columns.keys()];
        console.log(`identified columns: `, Columns);

        let $table = Helper.getElement('table', ['table', 'bg-white'], $parentNode, appendMode);
        let $thead = Helper.getElement('thead', [], $table);
        let $theadTr = Helper.getElement('tr', [], $thead);
        let $tbody = Helper.getElement('tbody', [], $table);

        Headers.forEach(header => {
            let column = Columns.get(header);
            let $th = Helper.getElement('th', [], $theadTr);
            $th.innerText = header;
            let $button = column.getThButton();
            $th.append($button);
        });

        jsonArray.forEach(element => {
            let $tr = Helper.getElement('tr', [], $tbody);

            if(typeof element === 'object') {
                Headers.forEach(header => {
                    let $td = Helper.getElement('td', [], $tr);
                    let value = element[header] ?? '';
                    $td.innerText =  (typeof value === 'object') ? JSON.stringify(value) : value;
                });
            } else {
                let $td = Helper.getElement('td', [], $tr);
                $td.setAttribute('colspan', Headers.length);
                $td.innerText = element;
            }
        });
    },
    jsonExtractRecursive: function(targetValue, jsonPathResidual = []) {
        let pathStop = jsonPathResidual.shift();
        console.debug(`pathStop`, pathStop, `jsonPathResidual`, jsonPathResidual, `targetValue`, targetValue);

        if((typeof pathStop === "undefined") || (pathStop === null)) {
            return targetValue;
        } else if (pathStop === '$') {
            return this.jsonExtractRecursive(targetValue, jsonPathResidual);
        }
        
        let asteriskPattern = new RegExp(/^(\[\*\])|\*$/);
        if(asteriskPattern.exec(pathStop)) {
            //console.log(`found asterisk-pattern`);
            //@todo typeof targetValue === 'string' produces funny outcomes here...
            return Object.values(targetValue).map(element => this.jsonExtractRecursive(element, jsonPathResidual));
        }        
        
        let multiTokenBracketPattern = new RegExp(/^\[("|')([^,]+)\1(,\1([^,]+)\1)+\]$/);
        if(multiTokenBracketPattern.exec(pathStop)) {
            console.debug(`found multiTokenBracketPattern`, multiTokenBracketPattern, RegExp);
            let subPaths = pathStop.split(/[\[\],"']+/).filter(item => item.match(/\w/));
            return subPaths.map(key => this.jsonExtractRecursive(targetValue[key], jsonPathResidual));
        }
        
        //let targetIsArray = Array.isArray(targetValue);
        let simpleBracketPattern = new RegExp(/^\[("|')([^,]+)\1\]$/);
        let simpleArrayPattern = new RegExp(/^\[(\d+)\]$/);
        
        if(simpleBracketPattern.exec(pathStop)) {
            pathStop = RegExp.$2;
        } else if (simpleArrayPattern.exec(pathStop)) {
            pathStop = parseInt(RegExp.$1);
        }
        
        return this.jsonExtractRecursive(targetValue[pathStop], jsonPathResidual);
    },
    jsonExtract: function(jsonString, jsonPath = '', returnStringified = false) {
        let parsedJSON = JSON.parse(jsonString);
        let jsonPathList = jsonPath.split(/(\.)|(?=\[)/)
                .filter(pathStop => (typeof pathStop !== "undefined") && (pathStop !== null) && (pathStop !== '$') && (pathStop !== '.'));
        let targetValue = this.jsonExtractRecursive(parsedJSON, jsonPathList);
        
        if(returnStringified) {
            return JSON.stringify(targetValue);
        }

        return targetValue;
    },
    classicalJsonExtract: function(jsonString, jsonPath = '', returnStringified = false) {
        let parsedJSON = JSON.parse(jsonString);
        let targetValue = jsonPath.split(/(\.)|(?=\[)/).reduce((carry,item) => {
            if((typeof item === "undefined") || (item === null) || (item === '$') || (item === '.')) return  carry;

            let normalPattern = new RegExp(/^\['(.+)'\]$/);
            let arrayPattern = new RegExp(/^\[(\d+)\]$/);
            
            if(normalPattern.exec(item)) {
                item = RegExp.$1;
            } else if (arrayPattern.exec(item)) {
                item = parseInt(RegExp.$1);
            }

            return carry[item];
        }, parsedJSON);

        if(returnStringified) {
            return JSON.stringify(targetValue);
        }

        return targetValue;
    }
};

$JsonExtractForExcelUseContainer.addEventListener('click', event => {
    if(event.target === $ConvertFromArrayButton) return JsonTools.processExtractForExcelUse(event);
});

export {JsonTools, Column};
