import { check } from './structures_base.js';
import { Item, ItemId } from './item.js';
import { Factory, FactoryGroup } from './factory.js';
import { Process } from './process.js';

class Data {
    game: string;
    version: string;
    items: Record<ItemId, Item>;
    factory_groups: Record<string, FactoryGroup>;
    factories: Record<string, Factory>;
    processes: Record<string, Process>;

    constructor(game: string, version: string) {
        check('game', game, 'version', version);
        this.game = game;
        this.version = version;
        this.items = {};
        this.factory_groups = {};
        this.factories = {};
        this.processes = {};
    }

    _check_add(type, thing) {
        if (!(typeof this[type][thing.id] === 'undefined')) {
            throw new Error('duplicate ' + type + ' id created: ' + thing);
        }
        this[type][thing.id] = thing;
    }

    add_item(item) {
        this._check_add('items', item);
    }
    add_factory_group(factory_group) {
        this._check_add('factory_groups', factory_group);
    }
    add_factory(factory) {
        this._check_add('factories', factory);
    }
    add_process(process) {
        this._check_add('processes', process);
    }

    add_items(items) {
        for (const i of items) this.add_item(i);
    }
    add_factory_groups(factory_groups) {
        for (const f of factory_groups) this.add_factory_group(f);
    }
    add_factories(factories) {
        for (const f of factories) this.add_factory(f);
    }
    add_processes(processes) {
        for (const p of processes) this.add_process(p);
    }
}

export { Data };
