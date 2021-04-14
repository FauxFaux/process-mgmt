import { Data, Item, Stack, FactoryGroup, Factory, Process } from '../structures.js';

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'dsp.json'), 'utf8'));

const check_add = function(item, fn) {
    try {
        return fn();
    } catch (error) {
        console.log("error processing item:", item);
        throw error;
    }
}

let data = new Data('dsp', '0.0.1');

raw.items.forEach(i => check_add(i, () => data.add_item(new Item(i.id, i.i18n.en, i.group))));

raw.processes.forEach(p => {
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

export { data };
