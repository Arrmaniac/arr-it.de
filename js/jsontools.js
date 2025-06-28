import {Helper} from '/js/arr-it-basic.js';

const $JsonExtractForExcelUseContainer = document.querySelector('[data-sectioncontainer="json-extract-for-excel-use"]');
const $JsonStringSource = $JsonExtractForExcelUseContainer.querySelector('[data-json-string-source]');
const $ConvertFromArrayButton = $JsonExtractForExcelUseContainer.querySelector('button[data-convert-from-array-button]');
const $ResulttableContainer = $JsonExtractForExcelUseContainer.querySelector('[data-resulttable-container]');

$JsonExtractForExcelUseContainer.addEventListener('click', event => {
    if(event.target === $ConvertFromArrayButton) return processExtractForExcelUse(event);
});

function processExtractForExcelUse(event) {
    event.preventDefault();
    let jsonString = $JsonStringSource.value;
    let parsedJson = JSON.parse(jsonString);
    console.log(parsedJson);
    
    if(Array.isArray(parsedJson)) {
        console.log('Is an Array.');
        return processArrayForExcelUse(parsedJson);
    }
    
    console.log('Is NOT an Array.');
}

function processArrayForExcelUse(jsonArray = []) {
    let Columns = jsonArray.reduce((carry, item) => {
        if(typeof item === 'object') {
            Object.keys(item).forEach(key => carry.add(key));
        }
        return carry;
    }, new Set());
    let Headers = [Columns];
    
    let $table = Helper.getElement('table', [], $ResulttableContainer);
    let $thead = Helper.getElement('thead', [], $table);
    let $tbody = Helper.getElement('tbody', [], $table);
    
    Headers.forEach(header => {
        let $th = Helper.getElement('th', [], $thead);
        $th.innerText = header;
    });
    
    jsonArray.forEach(element => {
        let $tr = Helper.getElement('tr', [], $tbody);
        
        if(typeof element === 'object') {
            Headers.forEach(header => {
                let $td = Helper.getElement('td', [], $tr);
                $td.innerText = element[header];
            });
        } else {
            let $td = Helper.getElement('td', [], $tr);
            $td.innerText = element;
        }
    });
}