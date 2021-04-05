
function check() {
    for (let i = 0; i < arguments.length; i += 2) {
        let n = arguments[i];
        let v = arguments[i+1];
        if (typeof v === 'undefined') {
            throw new Error(n + ' must not be undefined');
        }
    }
}


export { check };
