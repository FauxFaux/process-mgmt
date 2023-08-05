import { Process } from './process.js';
import { Stack } from './stack.js';
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
    constructor(id, name, groups, duration_modifier = 1, output_modifier = 1) {
        check(
            'id',
            id,
            'name',
            name,
            'groups',
            groups,
            'duration_modifier',
            duration_modifier,
            'output_modifier',
            output_modifier,
        );
        this.id = id;
        this.name = name;
        this.groups = groups;
        this.duration_modifier = duration_modifier;
        this.output_modifier = output_modifier;
    }

    toString() {
        return 'Factory: [id: ' + this.id + ', name: ' + this.name + ', group: ' + this.groups + ']';
    }

    modify(duration_modifier, output_modifier) {
        return new Factory(
            this.id,
            this.name,
            this.groups,
            this.duration_modifier * duration_modifier,
            this.output_modifier * output_modifier,
        );
    }

    update_process(p) {
        return new Process(
            p.id,
            p.inputs,
            p.outputs.map(s => new Stack(s.item, s.quantity * this.output_modifier)),
            p.duration * this.duration_modifier,
            p.factory_group,
        );
    }
}

export { FactoryGroup, Factory };
