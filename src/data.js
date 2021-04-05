import { check } from './structures_base.js';


class Data {
    constructor(game, version) {
        check("game", game, "version", version);
        this.game = game;
        this.version = version;
        this.items = {};
        this.factory_groups = {};
        this.factories = {};
        this.processes = {};
    }

    _check_add(type, thing) {
        if (!(typeof this[type][thing.id] === "undefined")) {
            throw new Error("duplicate " + type + " id created: " + thing)
        }
        this[type][thing.id] = thing;
    }

    add_item(item) { this._check_add("items", item); }
    add_factory_group(factory_group) { this._check_add("factory_groups", factory_group); }
    add_factory(factory) { this._check_add("factories", factory); }
    add_process(process) { this._check_add("processes", process); }

    add_items(items) { items.forEach(i => this.add_item(i)); }
    add_factory_groups(factory_groups) { factory_groups.forEach(f => this.add_factory_group(f)); }
    add_factories(factories) { factories.forEach(f => this.add_factory(f)); }
    add_processes(processes) { processes.forEach(p => this.add_process(p)); }

}

export { Data }
