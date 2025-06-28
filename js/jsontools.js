import {Helper} from '/js/arr-it-basic.js';

const $JsonExtractForExcelUseContainer = document.querySelector('[data-sectioncontainer="json-extract-for-excel-use"]');
const $JsonStringSource = $JsonExtractForExcelUseContainer.querySelector('[data-json-string-source]');
const $ConvertFromArrayButton = $JsonExtractForExcelUseContainer.querySelector('button[data-convert-from-array-button]');
const $ResulttableContainer = $JsonExtractForExcelUseContainer.querySelector('[data-resulttable-container]');

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
                Object.keys(item).forEach(key => carry.add(key));
            }
            return carry;
        }, new Set());
        let Headers = [...Columns];

        let $table = Helper.getElement('table', ['table'], this.$ResulttableContainer, 'prepend');
        let $thead = Helper.getElement('thead', [], $table);
        let $theadTr = Helper.getElement('tr', [], $thead);
        let $tbody = Helper.getElement('tbody', [], $table);

        Headers.forEach(header => {
            let $th = Helper.getElement('th', [], $theadTr);
            $th.innerText = header;
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
                $td.innerText = element;
            }
        });
    }
};

$JsonExtractForExcelUseContainer.addEventListener('click', event => {
    if(event.target === $ConvertFromArrayButton) return JsonTools.processExtractForExcelUse(event);
});

export {JsonTools};
