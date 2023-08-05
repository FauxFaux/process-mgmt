import { describe, it } from 'mocha';
import * as assert from 'assert';
import * as fs from 'fs';

import { ProcessChain } from '../../src/process.js';
import { Factory } from '../../src/structures.js';
import { EnableDisable } from '../../src/visit/enable_disable_visitor.js';
import { RateCalculator } from '../../src/visit/rate_calculator.js';
import { RateGraphRenderer } from '../../src/visit/rate_graph_renderer.js';
import { LinearAlgebra } from '../../src/visit/linear_algebra_visitor.js';

import { add_items_to_data, add_processes_to_data, setup_data } from './test_data.js';
import { Stack } from '../../src/stack.js';
import { RateChain } from '../../src/structures.js';
import Matrix from 'node-matrices';
import { RateVisitor } from '../../src/visit/rate_visitor.js';
import { ProcessCountVisitor } from '../../src/visit/process_count_visitor.js';

const floatingPointDeepStrictEqual = function (actual, expected, compare, message) {
    let type = typeof actual;
    if (Array.isArray(actual)) {
        assert.strictEqual(actual.length, expected.length, message);
        for (let i = 0; i < actual.length; ++i) {
            floatingPointDeepStrictEqual(actual[i], expected[i], compare, message);
        }
    } else if (type === 'object') {
        // check property sets
        compare(Object.keys(actual), Object.keys(expected), message);
        for (let k in actual) {
            floatingPointDeepStrictEqual(actual[k], expected[k], compare, message);
        }
    } else {
        compare(actual, expected, message);
        // return assert.strictEqual(typeof actual, "", "unhandled type: " + (typeof actual));
    }
};

const numericCompare = function (actual, expected, message) {
    const epsilon = 0.0000_0000_0000_1;
    if (typeof actual === 'number') {
        return assert.ok(
            Math.abs(actual - expected) < epsilon,
            'expected ' + actual + ' to be within ' + epsilon + ' of ' + expected,
        );
    } else {
        return assert.deepStrictEqual(actual, expected, message);
    }
};

describe('Linear Algebra Visitor', function () {
    let data = setup_data();
    add_items_to_data(data, ['h', 'l', 'g', 'w', 'c']);
    add_processes_to_data(data, {
        HC: {
            in: [
                { item: 'h', quantity: 20 },
                { item: 'w', quantity: 15 },
            ],
            out: [{ item: 'l', quantity: 15 }],
        },
        LC: {
            in: [
                { item: 'l', quantity: 15 },
                { item: 'w', quantity: 15 },
            ],
            out: [{ item: 'g', quantity: 10 }],
        },
        AO: {
            in: [
                { item: 'c', quantity: 20 },
                { item: 'w', quantity: 10 },
            ],
            out: [
                { item: 'h', quantity: 5 },
                { item: 'l', quantity: 9 },
                { item: 'g', quantity: 11 },
            ],
        },
        // 'BO': {"in": [{"item": 'c', "quantity": 100}],
        //         "out": [{"item": 'h', "quantity": 30}, {"item": 'l', "quantity": 30}, {"item": 'g', "quantity": 40}]}
    });
    describe('Internal algorithms', function () {
        it('reduces a matrix to row-echelon form', function () {
            let la = new LinearAlgebra([new Stack(data.items['g'], 1)], ['c', 'w'], []);
            // prettier-ignore
            let input = new Matrix([
                [ 1,  2,  3, (1*7 + 2*9 + 3*2)],
                [ 3,  5,  1, (3*7 + 5*9 + 1*2)],
                [ 4,  6,  2, (4*7 + 6*9 + 2*2)],
            ]);
            let result = la.reduce_matrix(input);
            // prettier-ignore
            floatingPointDeepStrictEqual(result, new Matrix(
                [1, 0, 0, 7],
                [0, 1, 0, 9],
                [0, 0, 1, 2],
            ), numericCompare);
        });
        it('reduces a matrix to row-echelon form, avoiding floating point issues', function () {
            let la = new LinearAlgebra([new Stack(data.items['g'], 1)], ['c', 'w'], []);
            let [x, y, z] = [7, 9, 13];
            // prettier-ignore
            let input = new Matrix([
                [ 1.1,      -0.2,       0.3,      (7.7      + -1.8      +  3.9)],
                [ 0.1,       0.2,       1,        (0.7      +  1.8      + 13  )],
                [ 1.000001,  2.000002,  3.000003, (7.000007 + 18.000018 + 39.000039)],
            ]);
            let result = la.reduce_matrix(input);
            // prettier-ignore
            floatingPointDeepStrictEqual(result, new Matrix(
                [1, 0, 0, x],
                [0, 1, 0, y],
                [0, 0, 1, z],
            ), numericCompare);
        });
        it('example from kirk', function () {
            let la = new LinearAlgebra([new Stack(data.items['g'], 1)], ['c', 'w'], []);
            // prettier-ignore
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
            // prettier-ignore
            floatingPointDeepStrictEqual(result, new Matrix(
                [ 1, 0, 0, 0, 0, (-13/400), (-23/12)],
                [ 0, 1, 0, 0, 0, (-7/400),  (-1/4)],
                [ 0, 0, 1, 0, 0, (-3/50),  (-10/3)],
                [ 0, 0, 0, 1, 0, (1/20),  (10/3)],
                [ 0, 0, 0, 0, 1, 1,     (305/3)],
            ), numericCompare);
        });
        it('reduces, without touching the last column', function () {
            let la = new LinearAlgebra([new Stack(data.items['g'], 1)], ['c', 'w'], [], true);
            let x = 1;
            let y = 2;
            let z = 3;
            // prettier-ignore
            let input = new Matrix([
                [ 2, 1, 3, (2*x + 1*y + 3*z)],
                [ 3, 7, 4, (3*x + 7*y + 4*z)],
                [ 4, 3, 1, (4*x + 3*y + 1*z)],
                [ 5, 2, 6, (5*x + 2*y + 6*z)],
                [ 6, 5, 7, (6*x + 5*y + 7*z)],
            ]);
            console.table(input.data);
            let result = la.reduce_matrix(input, -1);
            console.table(result.data);
            // prettier-ignore
            floatingPointDeepStrictEqual(result, new Matrix([
                [ 1, 0, 0, x],
                [ 0, 1, 0, y],
                [ 0, 0, 1, z],
                [ 0, 0, 0, 0],
                [ 0, 0, 0, 0],
            ]), numericCompare);
        });
    });
    describe('Overall behaviour', function () {
        it('initial matrix is sorted and filled', function () {
            let la = new LinearAlgebra([new Stack(data.items['g'], 100)], ['c', 'w'], []);
            let pc = new ProcessChain(Object.values(data.processes))
                .accept(new RateVisitor(p => new Factory('__default__', '__default__', null, 1, 1)))
                .accept(new ProcessCountVisitor())
                .accept(la);
            // prettier-ignore
            assert.deepStrictEqual(la.initial_matrix.data, [
            //     AO   HC   LC
                [ -20,   0,   0], // c
                [  11,   0,  10], // g
                [   5, -20,   0], // h
                [   9,  15, -15], // l
                [ -10, -15, -15]  // w
            ],
            )
        });

        it('augmented matrix is added', function () {
            let la = new LinearAlgebra(
                [new Stack(data.items['g'], 390)],
                ['c', 'w'],
                [],
                [data.items['c'], data.items['w']],
            );

            let p = new ProcessChain(Object.values(data.processes));
            p = new RateChain(p);
            p.process_counts = {
                HC: 5,
                LC: 17,
                AO: 20,
            };
            p.rebuild_materials();
            fs.writeFileSync('linear-sample0.gv', p.accept(new RateGraphRenderer()).join('\n'));
            let pc = new ProcessChain(Object.values(data.processes))
                .accept(new RateVisitor(p => new Factory('__default__', '__default__', null, 1, 1)))
                .accept(new ProcessCountVisitor())
                .accept(la);
            // prettier-ignore
            assert.deepStrictEqual(la.augmented_matrix.data, [
            //     AD   HC   LC    C    W  REQ
                [ -20,   0,   0,   1,   0,   0], // c
                [  11,   0,  10,   0,   0, 390], // g
                [   5, -20,   0,   0,   0,   0], // h
                [   9,  15, -15,   0,   0,   0], // l
                [ -10, -15, -15,   0,   1,   0]  // w
            ])
        });
        it('augmented matrix is added 2', function () {
            let la = new LinearAlgebra(
                [new Stack(data.items['g'], 360)],
                ['c', 'w'],
                [],
                [data.items['c'], data.items['w']],
            );

            let p = new ProcessChain(Object.values(data.processes));
            p = new RateChain(p);
            p.process_counts = {
                HC: 5,
                LC: 17,
                AO: 20,
                BO: 0,
            };
            p.rebuild_materials();
            fs.writeFileSync('linear-sample1.gv', p.accept(new RateGraphRenderer()).join('\n'));
            let pc = new ProcessChain(Object.values(data.processes))
                .accept(new RateVisitor(p => new Factory('__default__', '__default__', null, 1, 1)))
                .accept(new ProcessCountVisitor())
                .accept(la);
            // prettier-ignore
            floatingPointDeepStrictEqual(la.augmented_matrix.data, [
            //     AO   HC   LC    C    W  REQ
                [ -20,   0,   0,   1,   0,   0], // c
                [  11,   0,  10,   0,   0, 360], // g
                [   5, -20,   0,   0,   0,   0], // h
                [   9,  15, -15,   0,   0,   0], // l
                [ -10, -15, -15,   0,   1,   0]  // w
            ],
            numericCompare)
        });
        it('augmented matrix is added with exports', function () {
            let la = new LinearAlgebra(
                [new Stack(data.items['g'], 390)],
                ['c', 'w'],
                ['h'],
                [data.items['c'], data.items['w']],
            );

            let p = new ProcessChain(Object.values(data.processes));
            p = new RateChain(p);
            p.process_counts = {
                HC: 5,
                LC: 17,
                AO: 20,
            };
            p.rebuild_materials();
            fs.writeFileSync('linear-sample2.gv', p.accept(new RateGraphRenderer()).join('\n'));
            let pc = new ProcessChain(Object.values(data.processes))
                .accept(new RateVisitor(p => new Factory('__default__', '__default__', null, 1, 1)))
                .accept(new ProcessCountVisitor())
                .accept(la);
            // prettier-ignore
            assert.deepStrictEqual(la.augmented_matrix.data, [
            //     AD   HC   LC    C    W    H   REQ
                [ -20,   0,   0,   1,   0,   0,   0], // c
                [  11,   0,  10,   0,   0,   0,   390], // g
                [   5, -20,   0,   0,   0,  -1,   0], // h
                [   9,  15, -15,   0,   0,   0,   0], // l
                [ -10, -15, -15,   0,   1,   0,   0]  // w
            ])
        });
        it('adds process counts', function () {
            let la = new LinearAlgebra(
                [new Stack(data.items['g'], 390)],
                ['c', 'w'],
                [],
                [data.items['c'], data.items['w']],
            );
            let pc = new ProcessChain(Object.values(data.processes))
                .accept(new RateVisitor(p => new Factory('__default__', '__default__', null, 1, 1)))
                .accept(new ProcessCountVisitor())
                .accept(la);
            fs.writeFileSync('linear-sample3.gv', pc.accept(new RateGraphRenderer()).join('\n'));
            floatingPointDeepStrictEqual(
                pc.process_counts,
                {
                    AO: 20,
                    HC: 5,
                    LC: 17,
                },
                numericCompare,
            );
        });
    });
});
