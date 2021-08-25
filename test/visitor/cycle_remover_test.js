
import { describe, it } from 'mocha';
import * as assert from 'assert';

import { ProcessChain } from '../../src/process.js';
import { RateCalculator } from '../../src/visit/rate_calculator.js';

import { add_items_to_data, add_processes_to_data, setup_data } from "./test_data.js";
import { Stack } from '../../src/stack.js';
import { RateGraphRenderer } from '../../src/visit/rate_graph_renderer.js';
import { StandardGraphRenderer } from '../../src/visit/standard_graph_renderer.js';


describe('removal of cycles', function() {
    describe('single process loop, net producer', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            'C': {"in": ['a', 'b'], "out": ['c']},
            'D': {"in": ['c', 'd'], "out": [{"item": 'd', "quantity": 2}]},
            'E': {"in": ['d'], "out": ['e']},
        });
        it('', function() {
            let pc = new ProcessChain(Object.values(data.processes));
        });
        it('', function() {
            let pc = new ProcessChain(Object.values(data.processes));
        });
    });
});
