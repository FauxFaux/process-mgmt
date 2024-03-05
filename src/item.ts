import { check } from './structures_base.js';

class Item {
    constructor(id, name, group) {
        check('id', id, 'name', name);
        this.id = id;
        this.name = name;
        this.group = group;
    }
    toString() {
        return 'Item: [name: ' + this.name + ', group: ' + this.group + ']';
    }
}

export { Item };
