import { Data, Item, Stack, FactoryGroup, Factory, Process } from '../structures.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let raw = require('./vt.json');


const check_add = function(item, fn) {
    try {
        return fn();
    } catch (error) {
        console.log("error processing item:", item);
        throw error;
    }
}

let data = new Data('Voxel Tycoon', '0.0.1');

raw.items.forEach(i => check_add(i, () => {
    if (!i.id) return;
    data.add_item(new Item(i.id, i.i18n.en, i.group))
}));

raw.processes.forEach(p => {
    if (!p.name) return;
    if (!data.factory_groups[p.factory_group]) {
        check_add(p, () => data.add_factory_group(new FactoryGroup(p.factory_group)));
    }
    let inputs = Object.entries(p.inputs).map((e) => {
        return check_add(p, () => new Stack(data.items[e[0]], e[1]));
    });
    let outputs = Object.entries(p.outputs).map((e) => {
        return check_add(p, () => new Stack(data.items[e[0]], e[1]));
    });
    check_add(p, () => {
        data.add_process(new Process(
            p.name,
            inputs,
            outputs,
            p.duration,
            check_add(p, () => data.factory_groups[p.factory_group])
    ))});
})


data.add_factories(
    Object.values(data.factory_groups)
        .map(fg => new Factory(fg.id, fg.id, [fg], 1))
);

export { data };
