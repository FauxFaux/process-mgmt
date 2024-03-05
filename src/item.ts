import { check } from './structures_base.js';

export type ItemId = string;

class Item {
    id: string;
    name: string;
    group?: string;

    constructor(id: string, name: string, group?: string) {
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
