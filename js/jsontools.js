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
        let $button = Helper.getElement('button');
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
        console.log(parsedJson);

        if(Array.isArray(parsedJson)) {
            console.log('Is an Array.');
            return this.processArrayForExcelUse(parsedJson);
        }

        console.log('Is NOT an Array.');
    },
    processArrayForExcelUse: function(jsonArray = []) {
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

        let $table = Helper.getElement('table', ['table'], this.$ResulttableContainer, 'prepend');
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
    }
};

$JsonExtractForExcelUseContainer.addEventListener('click', event => {
    if(event.target === $ConvertFromArrayButton) return JsonTools.processExtractForExcelUse(event);
});

export {JsonTools, Column};
