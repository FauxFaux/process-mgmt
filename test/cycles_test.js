

import * as assert from 'assert';
import { Factory, FactoryGroup } from '../src/factory.js';
import { Process } from '../src/process.js';
import { RateProcess } from '../src/rate_process.js';

import {Data} from '../src/data.js'
import {Item} from '../src/item.js'
import {Stack} from '../src/stack.js'


let data = new Data('cycles_test', '0.0.1');
['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach(e => data.add_item(new Item(e, e)));

data.add_factory_group(new FactoryGroup('basic_group'));
data.add_factory(new Factory("basic", "basic", data.factory_groups.basic_group, 1));

let processes = {
    'C': [['a', 'b'], ['c']],
    'D': [['c'], ['b', 'd']],
    'E': [['d'], ['b', 'e']],
    'F': [['e'], ['f']],
}
Object.entries(processes).forEach(e => {
        data.add_process(new Process(
            e[0], // id
            e[1][0].map(i => new Stack(data.items[i], 1)),
            e[1][1].map(i => new Stack(data.items[i], 1)),
            1,
            data.factory_groups.basic_group
        ))
});


describe('cycle discovery', function() {
    describe("discovers cycles in process charts", function() {
        it('finds all cycles', function() {
            let proc = new ProcessChain(Object.values(data.processes));
            let result = proc.find_cycles();
            assert.strictEqual(2, result.length);
            result.sort((a,b) => a.length - b.length)
            assert.strictEqual()
            // cycle 1: C+D
            // cycle 2: C+D+E
        });
    });
});
