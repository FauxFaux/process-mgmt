
import { describe, it } from 'mocha';
import * as assert from 'assert';
import * as fs from 'fs';

import { ProcessChain } from '../../src/process.js';
import { EnableDisable } from '../../src/visit/enable_disable_visitor.js';
import { RateCalculator } from '../../src/visit/rate_calculator.js';
import { RateGraphRenderer } from '../../src/visit/rate_graph_renderer.js';
import { LinearAlgebra } from '../../src/visit/linear_algebra_visitor.js';

import { add_items_to_data, add_processes_to_data, setup_data } from "./test_data.js";
import { Stack } from '../../src/stack.js';
import { RateChain } from '../../src/structures.js';
import Matrix from 'node-matrices';

/**
 * -0 == 0.
 * @param {Matrix} mtx
 *
 */
const fudge_matrix = function(mtx) {
    for (let i = 0; i < mtx.data.length; ++i) {
        for (let j = 0; j < mtx.data[i].length; ++j) {
            if (-0.00000000001 < mtx.data[i][j] && mtx.data[i][j] < 0.00000000001) {
                mtx.data[i][j] = 0;
            }
        }
    }
    return mtx;
}

describe('Linear Algebra Visitor', function() {
    let data = setup_data();
    add_items_to_data(data, ['h', 'l', 'g', 'w', 'c']);
    add_processes_to_data(data, {
        'HC': {"in": [{"item": 'h', "quantity": 40},  {"item": 'w', "quantity": 30}],
               "out": [{"item": 'l', "quantity": 30}]},
        'LC': {"in": [{"item": 'l', "quantity": 30},  {"item": 'w', "quantity": 30}],
                "out": [{"item": 'g', "quantity": 20}]},
        'AO': {"in": [{"item": 'c', "quantity": 100}, {"item": 'w', "quantity": 50}],
                "out": [{"item": 'h', "quantity": 25}, {"item": 'l', "quantity": 45}, {"item": 'g', "quantity": 55}]},
        // 'BO': {"in": [{"item": 'c', "quantity": 100}],
        //         "out": [{"item": 'h', "quantity": 30}, {"item": 'l', "quantity": 30}, {"item": 'g', "quantity": 40}]}
    });
    describe('Internal algorithms', function() {
        it('reduces a matrix to row-echelon form', function() {
            let la = new LinearAlgebra(new Stack(data.items['g'], 1), ['c', 'w'], ['g']);
            let input = new Matrix([
                [ 1,  2,  3, (1*7 + 2*9 + 3*2)],
                [ 3,  5,  1, (3*7 + 5*9 + 1*2)],
                [ 4,  6,  2, (4*7 + 6*9 + 2*2)],
            ]);
            let result = la.reduce_matrix(input);
            assert.deepStrictEqual(fudge_matrix(result), new Matrix(
                [1, 0, 0, 7],
                [0, 1, 0, 9],
                [0, 0, 1, 2],
            ));
        });
        it('kirk', function() {
            let la = new LinearAlgebra(new Stack(data.items['g'], 1), ['c', 'w'], ['g']);
            let input = new Matrix([
                [ -40,   0,  30,   10, 0, 0, 10],
                [ 30,  -30,  30,   45, 0, 0, 0],
                [ 0,    20,  40,   55, 0, 0, 45],
                [ -30, -30,   0,  -50, 1, 0, 0],
                [ 0,     0,-100, -100, 0, 1, 0],
            ]);
            console.table(input.data);
            let result = la.reduce_matrix(input);
            console.table(result.data);
            assert.deepStrictEqual(fudge_matrix(result), new Matrix(
                [ 1, 0, 0, 0, 0, (-13/400), (-23/12)],
                [ 0, 1, 0, 0, 0, (-7/400),  (-1/4)],
                [ 0, 0, 1, 0, 0, (-3/50),  (-10/3)],
                [ 0, 0, 0, 1, 0, (1/20),  (10/3)],
                [ 0, 0, 0, 0, 1, 1,     (305/3)],
            ));
        });
    });
    describe('Overall behaviour', function() {
        it('initial matrix is sorted and filled', function() {
            let la = new LinearAlgebra(new Stack(data.items['g'], 100), ['c', 'w'], ['g']);
            let pc = new ProcessChain(Object.values(data.processes))
                .accept(la);
            assert.deepStrictEqual(la.initial_matrix.data, [
            //     AO   HC   LC
                [-100,   0,   0], // c
                [  55,   0,  20], // g
                [  25, -40,   0], // h
                [  45,  30, -30], // l
                [ -50, -30, -30]  // w
            ])
        });

        it('augmented matrix is added', function() {
            let la = new LinearAlgebra(new Stack(data.items['g'], 360), ['c', 'w'], ['g'], [data.items['c'], data.items['w']]);

            let p = new ProcessChain(Object.values(data.processes));
            p = new RateChain(p);
            p.process_counts = {
                'HC': 1,
                'LC': 7,
                'AO': 4
            };
            p.rebuild_materials()
            fs.writeFileSync("linear-sample.gv", p.accept(new RateGraphRenderer()).join('\n'));
            let pc = new ProcessChain(Object.values(data.processes))
                .accept(la);
            assert.deepStrictEqual(la.augmented_matrix.data, [
            //     AD   HC   LC    C    W  REQ
                [-100,   0,   0,   1,   0,   0], // c
                [  55,   0,  20,   0,   0, 360], // g
                [  25, -40,   0,   0,   0,   0], // h
                [  45,  30, -30,   0,   0,   0], // l
                [ -50, -30, -30,   0,   1,   0]  // w
            ])
        });
        it('aufgrdnjkisgmented matrix is added 2', function() {
            let la = new LinearAlgebra(new Stack(data.items['g'], 360), ['c', 'w'], ['g'], [data.items['c'], data.items['w']]);

            let p = new ProcessChain(Object.values(data.processes));
            p = new RateChain(p);
            p.process_counts = {
                'HC': 1,
                'LC': 7,
                'AO': 4,
                'BO': 0,
            };
            p.rebuild_materials()
            fs.writeFileSync("linear-sample.gv", p.accept(new RateGraphRenderer()).join('\n'));
            let pc = new ProcessChain(Object.values(data.processes))
                .accept(la);
            assert.deepStrictEqual(la.augmented_matrix.data, [
            //     AD   BO   HC   LC    C    W  REQ
                [-100, -100,   0,   0,   1,   0,   0], // c
                [  55, 40,  0,  20,   0,   0, 360], // g
                [  10, 30, -40,   0,   0,   0,   0], // h
                [  45, 30, 30, -30,   0,   0,   0], // l
                [ -50, 0,-30, -30,   0,   1,   0]  // w
            ])
        });
    });
});
