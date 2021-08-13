
import { describe, it } from 'mocha';
import * as assert from 'assert';
import { Factory, FactoryGroup } from '../src/factory.js';
import { Process, ProcessChain } from '../src/process.js';
import { RateProcess, RateChain } from '../src/rate_process.js';
import { ProxyProcess } from '../src/proxy_process.js';

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
                e[1][0].map(i => item_to_stack(data, i)),
                e[1][1].map(i => item_to_stack(data, i)),
                1,
                data.factory_groups.basic_group
            ))
    });
};

const item_to_stack = function(data, item) {
    if ((typeof item) == 'object') {
        return new Stack(data.items[item[0]], item[1]);
    } else {
        return new Stack(data.items[item], 1);
    }
}

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
    describe('generates proxy processes from cycle', function() {
        describe('data with one self cycle; net producer', function() {
            let data = setup_data();
            add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
            add_processes_to_data(data, {
                'C': [['a', 'b'], ['c']],
                'D': [['a', 'c'], [['c', 2]]], // 1 consumed, 2 produced; net 1 produced.
                'E': [['c'], ['e']],
                'F': [['e'], ['f']],
            });
            it('proxies self cycles', function() {
                let cycle = [data.processes['D']];
                let result = new ProxyProcess(cycle);

                assert.strictEqual(result.inputs.length, 1);
                assert.strictEqual(result.inputs[0].item.id, 'a');
                assert.strictEqual(result.inputs[0].quantity, 1);
                assert.strictEqual(result.outputs.length, 1);
                assert.strictEqual(result.outputs[0].item.id, 'c');
                assert.strictEqual(result.outputs[0].quantity, 1);
            });
        });
        describe('data with one self cycle; net consumer', function() {
            let data = setup_data();
            add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
            add_processes_to_data(data, {
                'C': [['a', 'b'], ['c']],
                'D': [['a', ['c', 2]], ['c', 'd']], // 2 consumed, 1 produced; net 1 consumed.
                'E': [['d'], ['e']],
                'F': [['e'], ['f']],
            });
            it('proxies self cycles', function() {
                let cycle = [data.processes['D']];
                let result = new ProxyProcess(cycle);

                assert.strictEqual(result.inputs.length, 2);
                assert.strictEqual(result.inputs[0].item.id, 'a');
                assert.strictEqual(result.inputs[0].quantity, 1);
                assert.strictEqual(result.inputs[1].item.id, 'c');
                assert.strictEqual(result.inputs[1].quantity, 1);
                assert.strictEqual(result.outputs.length, 1);
                assert.strictEqual(result.outputs[0].item.id, 'd');
                assert.strictEqual(result.outputs[0].quantity, 1);
            });
            it('replaces cycle processes with a proxy', function() {
                let chain = new RateChain(new ProcessChain(Object.values(data.processes)));
                chain.replace(['D'], [new ProxyProcess([new RateProcess(data.processes['D'], data.factories['basic'])])]);
                assert.strictEqual(true, chain.processes.every(e => e.id !== 'D'));
                // console.log(chain.update(new Stack(data.items['f'], 10), []).to_graphviz());
            });
            it('expands proxy processes', function() {
                let chain = new RateChain(new ProcessChain(Object.values(data.processes)));
                chain = chain.replace(['D'], [new ProxyProcess([new RateProcess(data.processes['D'], data.factories['basic'])])])
                    .update(new Stack(data.items['f'], 10), [])
                    .expand_proxies()
                    ;
                assert.strictEqual(true, chain.processes.some(e => e.id === 'D'));
                assert.strictEqual(10, chain.process_counts['D']);
                assert.strictEqual(20, chain.materials.total_positive(data.items['c']).quantity);
                assert.strictEqual(10, chain.materials.total_positive(data.items['f']).quantity);
                // console.log(chain.to_graphviz());
            });
        });
        describe('data with two-element cycle; net producer', function() {
            let data = setup_data();
            add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
            add_processes_to_data(data, {
                'C': [['a', 'b'], ['c']],
                'D': [['a', 'c'], ['d']], // 1 'c' consumed.
                'E': [['d'], [['c', 2]]], // 2 'c' produced.
                'F': [['c'], ['f']],
            });
            it('proxies cycles', function() {
                let cycle = [data.processes['D'], data.processes['E']];
                let result = new ProxyProcess(cycle);

                assert.strictEqual(result.inputs.length, 1);
                assert.strictEqual(result.inputs[0].item.id, 'a');
                assert.strictEqual(result.inputs[0].quantity, 1);
                assert.strictEqual(result.outputs.length, 1);
                assert.strictEqual(result.outputs[0].item.id, 'c');
                assert.strictEqual(result.outputs[0].quantity, 1);
            });
            it('replaces cycle processes with a proxy', function() {
                let chain = new RateChain(new ProcessChain(Object.values(data.processes)));
                chain.replace(['D', 'E'], [new ProxyProcess([
                    new RateProcess(data.processes['D'], data.factories['basic']),
                    new RateProcess(data.processes['E'], data.factories['basic'])
                ])]);
                assert.strictEqual(true, chain.processes.every(e => e.id !== 'D'));
                assert.strictEqual(true, chain.processes.every(e => e.id !== 'E'));
                // console.log(chain.update(new Stack(data.items['f'], 10), []).to_graphviz());
            });
            it('expands proxy processes', function() {
                let chain = new RateChain(new ProcessChain(Object.values(data.processes)));
                chain = chain.replace(['D', 'E'], [new ProxyProcess([
                    new RateProcess(data.processes['D'], data.factories['basic']),
                    new RateProcess(data.processes['E'], data.factories['basic'])
                ])])

                chain = chain.filter_for_output(new Stack(data.items['f'], 10), (item_id, options) => {
                        let proxy = options.find(e => e.proxy_process);
                        if (proxy) return proxy;
                        return options[0];
                    }, []);

                chain = new RateChain(chain);

                chain = chain.update(new Stack(data.items['f'], 10), []);

                chain = chain.expand_proxies();
                assert.strictEqual(true, chain.processes.every(e => e.id !== 'C')); // proc 'C' should not be included as the proxy should be used instead.
                assert.strictEqual(true, chain.processes.some(e => e.id === 'D'));
                assert.strictEqual(true, chain.processes.some(e => e.id === 'E'));
                assert.strictEqual(10, chain.process_counts['D']);
                assert.strictEqual(20, chain.materials.total_positive(data.items['c']).quantity);
                assert.strictEqual(10, chain.materials.total_positive(data.items['f']).quantity);
                // console.log(chain.to_graphviz());
            });
        });
    });

});
