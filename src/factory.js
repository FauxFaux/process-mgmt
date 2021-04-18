import { Process } from './process.js';
import { check } from './structures_base.js';


class FactoryGroup {
    constructor(name) {
        check('name', name);
        this.id = name;
        this.name = name;
    }

    toString() {
        return 'FactoryGroup: [name: ' + this.name + ']';
    }
}

class Factory {
    constructor(id, name, groups, duration_modifier = 1) {
        check('id', id, 'name', name, 'group', groups, 'duration_modifier', duration_modifier);
        this.id = id;
        this.name = name;
        this.groups = groups;
        this.duration_modifier = duration_modifier;
    }

    toString() {
        return 'Factory: [id: ' + this.id + ', name: ' + this.name + ', group: ' + this.groups + ']';
    }

    update_process(p) {
        return new Process(p.id, p.inputs, p.outputs, p.duration * this.duration_modifier, p.factory_group);
    }
}

export { FactoryGroup, Factory };
