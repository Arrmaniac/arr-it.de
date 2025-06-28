export const Helper = {
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
