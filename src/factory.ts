import { Process } from './process.js';
import { Stack } from './stack.js';
import { check } from './structures_base.js';

class FactoryGroup {
    id: string;
    name: string;

    constructor(name: string) {
        check('name', name);
        this.id = name;
        this.name = name;
    }

    toString() {
        return 'FactoryGroup: [name: ' + this.name + ']';
    }
}

class Factory {
    id: string;
    name: string;
    groups: FactoryGroup[] | null;
    duration_modifier: number;
    output_modifier: number;

    constructor(
        id: string,
        name: string,
        groups: FactoryGroup[] | FactoryGroup | null,
        duration_modifier = 1,
        output_modifier = 1,
    ) {
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
        this.groups = groups
            ? Array.isArray(groups)
                ? groups
                : [groups]
            : null;
        this.duration_modifier = duration_modifier;
        this.output_modifier = output_modifier;
    }

    toString() {
        return (
            'Factory: [id: ' +
            this.id +
            ', name: ' +
            this.name +
            ', group: ' +
            this.groups +
            ']'
        );
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

    update_process(p: Process) {
        return new Process(
            p.id,
            p.inputs,
            p.outputs.map(
                (s) => new Stack(s.item, s.quantity * this.output_modifier),
            ),
            p.duration * this.duration_modifier,
            p.factory_group,
        );
    }
}

export { FactoryGroup, Factory };
