import { Factory, FactoryGroup } from '../../src/factory.js';
import { Process } from '../../src/process.js';
import { Stack } from '../../src/stack.js';
import { Data } from '../../src/data.js';
import { Item } from '../../src/item.js';

/*
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            'C': {"in": ['a', 'b'], "out": ['c']},
            'D': {"in": ['c'], "out": [{"item": 'c', "quantity": 2}, 'd']}, // two 'c' produced
            'E': {"in": ['d'], "out": ['c', 'e']},
            'F': {"in": ['e'], "out": ['f']},
        });
*/

const setup_data = function () {
    const data = new Data('cycles_test', '0.0.1');

    data.add_factory_group(new FactoryGroup('basic_group'));
    data.add_factory(
        new Factory('basic', 'basic', data.factory_groups.basic_group, 1),
    );
    return data;
};

const add_items_to_data = function (data, items) {
    for (const e of items) data.add_item(new Item(e, e));
};

/**
 * processes: object with entries like 'C': {"in": ['a', 'b'], "out": ['c']}
 */
const add_processes_to_data = function (data, processes) {
    for (const e of Object.entries(processes) as [string, any][]) {
        data.add_process(
            new Process(
                e[0], // id
                e[1]['in'].map((i) => item_to_stack(data, i)),
                e[1]['out'].map((i) => item_to_stack(data, i)),
                1,
                data.factory_groups.basic_group,
            ),
        );
    }
};

const item_to_stack = function (data, item) {
    if (typeof item == 'object') {
        return new Stack(data.items[item['item']], item['quantity']);
    } else {
        return new Stack(data.items[item], 1);
    }
};

export { setup_data, add_items_to_data, add_processes_to_data };
