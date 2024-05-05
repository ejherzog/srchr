export function formatDescription(str: string) {
    const cleanStr = removeTags(str);
    if (cleanStr) return truncateString(cleanStr, 80);
    return str;
}

function truncateString(str: string, max: number): string {
    if (str.length > max) {
        return str.slice(0, max).concat('...')
    }
    return str;
}

function removeTags(str: string) {
    if ((str === null) || (str === ''))
        return false;
    else
        str = str.toString();
 
    // Regular expression to identify HTML tags in
    // the input string. Replacing the identified
    // HTML tag with a null string.
    return str.replace(/(<([^>]+)>)/ig, '');
}