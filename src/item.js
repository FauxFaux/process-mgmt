import { check } from './structures_base.js';



class Item {
    constructor(id, name) {
        check('id', id, 'name', name);
        this.id = id;
        this.name = name;
    }
    toString() {
        return 'Item: [name: ' + this.name + ']';
    }
}

export { Item };
