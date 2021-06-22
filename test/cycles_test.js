
import { describe, it } from 'mocha';
import * as assert from 'assert';
import { Factory, FactoryGroup } from '../src/factory.js';
import { Process, ProcessChain } from '../src/process.js';

import {Data} from '../src/data.js'
import {Item} from '../src/item.js'
import {Stack} from '../src/stack.js'



const setup_data = function() {
    let data = new Data('cycles_test', '0.0.1');

    data.add_factory_group(new FactoryGroup('basic_group'));
    data.add_factory(new Factory("basic", "basic", data.factory_groups.basic_group, 1));
    return data;
}

const add_items_to_data = function(data, items) {
    items.forEach(e => data.add_item(new Item(e, e)));
}

/**
 * processes: hash<process_id, pair<inputs, outputs>> e.g. 'C': [['a', 'b'], ['c']]
 */
const add_processes_to_data = function(data, processes) {
    Object.entries(processes).forEach(e => {
            data.add_process(new Process(
                e[0], // id
                e[1][0].map(i => new Stack(data.items[i], 1)),
                e[1][1].map(i => new Stack(data.items[i], 1)),
                1,
                data.factory_groups.basic_group
            ))
    });
};

describe('Cycle discovery', function() {
    describe("discovers cycles in process charts", function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            'C': [['a', 'b'], ['c']],
            'D': [['c'], ['b', 'd']],
            'E': [['d'], ['b', 'e']],
            'F': [['e'], ['f']],
        });
        it('Finds all cycles', function() {
            let proc = new ProcessChain(Object.values(data.processes));
            let result = proc.find_cycles();
            assert.strictEqual(2, result.length);
            result.sort((a,b) => a.length - b.length)
            assert.deepStrictEqual(['C', 'D'], result[0]);
            assert.deepStrictEqual(['C', 'D', 'E'], result[1]);
        });
    });
    describe('discovers self cycles in process charts', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            'C': [['a', 'b'], ['c']],
            'D': [['c'], ['c', 'd']],
            'E': [['d'], ['c', 'e']],
            'F': [['e'], ['f']],
        });
        it('Finds self cycles', function() {
            let proc = new ProcessChain(Object.values(data.processes));
            let result = proc.find_cycles();
            assert.strictEqual(2, result.length);
            result.sort((a,b) => a.length - b.length)
            assert.deepStrictEqual(['D'], result[0]);
            assert.deepStrictEqual(['D', 'E'], result[1]);
        });

    });
});
