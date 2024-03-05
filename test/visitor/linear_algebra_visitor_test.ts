import { describe, it } from 'mocha';
import * as assert from 'assert';
import * as fs from 'fs';

import { ProcessChain } from '../../src/process.js';
import { Factory } from '../../src/structures.js';
import { EnableDisable } from '../../src/visit/enable_disable_visitor.js';
import { RateCalculator } from '../../src/visit/rate_calculator.js';
import { RateGraphRenderer } from '../../src/visit/rate_graph_renderer.js';
import { LinearAlgebra } from '../../src/visit/linear_algebra_visitor.js';

import {
    add_items_to_data,
    add_processes_to_data,
    setup_data,
} from './test_data.js';
import { Stack } from '../../src/stack.js';
import { RateChain } from '../../src/structures.js';
import Matrix from 'node-matrices';
import { RateVisitor } from '../../src/visit/rate_visitor.js';
import { ProcessCountVisitor } from '../../src/visit/process_count_visitor.js';

const floatingPointDeepStrictEqual = function (
    actual,
    expected,
    compare,
    message?,
) {
    const type = typeof actual;
    if (Array.isArray(actual)) {
        assert.strictEqual(actual.length, expected.length, message);
        for (let i = 0; i < actual.length; ++i) {
            floatingPointDeepStrictEqual(
                actual[i],
                expected[i],
                compare,
                message,
            );
        }
    } else if (type === 'object') {
        // check property sets
        compare(Object.keys(actual), Object.keys(expected), message);
        for (const k in actual) {
            floatingPointDeepStrictEqual(
                actual[k],
                expected[k],
                compare,
                message,
            );
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
            'expected ' +
                actual +
                ' to be within ' +
                epsilon +
                ' of ' +
                expected,
        );
    } else {
        return assert.deepStrictEqual(actual, expected, message);
    }
};

describe('Linear Algebra Visitor', function () {
    const data = setup_data();
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
        it('attempts to reduce', function () {
            const la = new LinearAlgebra(
                [new Stack(data.items['g'], 1)],
                ['c', 'w'],
                [],
                true,
            );
            const [x, y, z] = [3, 4, 1];
            const input = new Matrix([
                [1, 2, 3, 1 * x + 2 * y + 3 * z],
                [2, 5, 6, 2 * x + 5 * y + 6 * z],
                [7, 3, 9, 7 * x + 3 * y + 9 * z],
            ]);
            const result = la.reduce_matrix(input);
            floatingPointDeepStrictEqual(
                result,
                new Matrix([1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z]),
                numericCompare,
            );
        });
        it('attempts to reduce 2', function () {
            const la = new LinearAlgebra(
                [new Stack(data.items['g'], 1)],
                ['c', 'w'],
                [],
                true,
            );
            const mtx = [
                [
                    0.625, 0, 0, 0, 0, 0, 0, 0, -0.375, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0.5, -0.8571428571428572, -3.125, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0, -4.2857142857142865, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0, 3.428571428571429, -0.625, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0, 0, 0.625, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 10,
                ],
                [
                    0, 0, 0, 0, 0.5, -0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0, 0, 0, 0.1, 0.5, -0.375, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0, 0, 0, 0, 0.25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, -1, 0, 0, 0,
                ],
                [
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1.5, 0, 0, 0, 0, 1, 0, 0,
                    0, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
                    0, 0, 0, 0, 0,
                ],
                [
                    0, 0, 0, -3.125, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0, -0.8571428571428572, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
                ],
                [
                    0.625, 0, 0, 0, 0, 0, 0.375, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0,
                ],
                [
                    0.18749999999999997, 0, 0, 0, 0, 0, 0.1875, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0,
                ],
                [
                    0, 0, 0, 0, 0, 0, 0, 0, -112.5, -150, 0, -100, 0, 0, 1, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, -1, 0,
                ],
                [
                    0, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
                    0, 0, 0, 0, 0,
                ],
                [
                    0, 0, 0, 0, 0, 0, 0, 50, -18.75, 0, -37.5, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0, 0, 0, 0, 0, 0, 0, 37.5, -50, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 50, -37.5, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 37.5, -50, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                ],
                [
                    0, -50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0, 0, 0, -2.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
                    0, 0, 0, 0, 0, 0,
                ],
                [
                    0, 0, 0, 0, 0, 0, 0, -100, 0, 0, 0, 0, 600, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                ],
            ];
            const input = new Matrix(mtx);
            const result = la.reduce_matrix(input);
            console.log(result);
        });
        it('pivot selection; should pivot on abs(remaining rows)', function () {
            const la = new LinearAlgebra(
                [new Stack(data.items['g'], 1)],
                ['c', 'w'],
                [],
                true,
            );
            const [x, y, z] = [3, 4, 1];
            // first pivot should be the 3rd row as 7 > 2 > 1
            // second pivot should be the 3rd row as abs(-12) > 1 > 0
            const input = new Matrix([
                [1, 2, 3, 1 * x + 2 * y + 3 * z],
                [2, 5, 6, 2 * x + 5 * y + 6 * z],
                [7, 2, 9, 7 * x + 2 * y + 9 * z],
            ]);
            const result = la.reduce_matrix(input);
            floatingPointDeepStrictEqual(
                result,
                new Matrix([1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z]),
                numericCompare,
            );
        });
        it('reduces a matrix to row-echelon form', function () {
            const la = new LinearAlgebra(
                [new Stack(data.items['g'], 1)],
                ['c', 'w'],
                [],
                false,
            );
            const input = new Matrix([
                [1, 2, 3, 1 * 7 + 2 * 9 + 3 * 2],
                [3, 5, 1, 3 * 7 + 5 * 9 + 1 * 2],
                [4, 6, 2, 4 * 7 + 6 * 9 + 2 * 2],
            ]);
            const result = la.reduce_matrix(input);
            floatingPointDeepStrictEqual(
                result,
                new Matrix([1, 0, 0, 7], [0, 1, 0, 9], [0, 0, 1, 2]),
                numericCompare,
            );
        });
        it('reduces a matrix to row-echelon form, avoiding floating point issues', function () {
            const la = new LinearAlgebra(
                [new Stack(data.items['g'], 1)],
                ['c', 'w'],
                [],
                false,
            );
            const [x, y, z] = [7, 9, 13];
            const input = new Matrix([
                [1.1, -0.2, 0, 7.7 + -1.8 + 0],
                [0.1, 0.2, 0, 0.7 + 1.8 + 0],
                [1.000001, 2.000002, 1, 7.000007 + 18.000018 + 13],
            ]);
            const result = la.reduce_matrix(input);
            floatingPointDeepStrictEqual(
                result,
                new Matrix([1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z]),
                numericCompare,
            );
        });
        it('example from kirk', function () {
            const la = new LinearAlgebra(
                [new Stack(data.items['g'], 1)],
                ['c', 'w'],
                [],
                false,
            );
            const input = new Matrix([
                [-40, 0, 30, 10, 0, 0, 10],
                [30, -30, 30, 45, 0, 0, 0],
                [0, 20, 40, 55, 0, 0, 45],
                [-30, -30, 0, -50, 1, 0, 0],
                [0, 0, -100, -100, 0, 1, 0],
            ]);
            const result = la.reduce_matrix(input);
            floatingPointDeepStrictEqual(
                result,
                new Matrix(
                    [1, 0, 0, 0, 0, -13 / 400, -23 / 12],
                    [0, 1, 0, 0, 0, -7 / 400, -1 / 4],
                    [0, 0, 1, 0, 0, -3 / 50, -10 / 3],
                    [0, 0, 0, 1, 0, 1 / 20, 10 / 3],
                    [0, 0, 0, 0, 1, 1, 305 / 3],
                ),
                numericCompare,
            );
        });
        it('reduces, without touching the last column', function () {
            const la = new LinearAlgebra(
                [new Stack(data.items['g'], 1)],
                ['c', 'w'],
                [],
                false,
            );
            const x = 1;
            const y = 2;
            const z = 3;
            const input = new Matrix([
                [2, 1, 3, 2 * x + 1 * y + 3 * z],
                [3, 7, 4, 3 * x + 7 * y + 4 * z],
                [4, 3, 1, 4 * x + 3 * y + 1 * z],
                [5, 2, 6, 5 * x + 2 * y + 6 * z],
                [6, 5, 7, 6 * x + 5 * y + 7 * z],
            ]);
            const result = la.reduce_matrix(input, -1);
            floatingPointDeepStrictEqual(
                result,
                new Matrix([
                    [1, 0, 0, x],
                    [0, 1, 0, y],
                    [0, 0, 1, z],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0],
                ]),
                numericCompare,
            );
        });
    });
    describe('Overall behaviour', function () {
        it('initial matrix is sorted and filled', function () {
            const la = new LinearAlgebra(
                [new Stack(data.items['g'], 100)],
                ['c', 'w'],
                [],
                false,
            );
            const pc = new ProcessChain(Object.values(data.processes))
                .accept(
                    new RateVisitor(
                        (p) =>
                            new Factory(
                                '__default__',
                                '__default__',
                                null,
                                1,
                                1,
                            ),
                    ),
                )
                .accept(new ProcessCountVisitor())
                .accept(la);
            assert.deepStrictEqual(la.initial_matrix!.data, [
                //     AO   HC   LC
                [-20, 0, 0], // c
                [11, 0, 10], // g
                [5, -20, 0], // h
                [9, 15, -15], // l
                [-10, -15, -15], // w
            ]);
        });

        it('augmented matrix is added', function () {
            const la = new LinearAlgebra(
                [new Stack(data.items['g'], 390)],
                ['c', 'w'],
                [],
                false,
            );

            const p = new RateChain(
                new ProcessChain(Object.values(data.processes)),
            );
            p.process_counts = {
                HC: 5,
                LC: 17,
                AO: 20,
            };
            p.rebuild_materials();
            fs.writeFileSync(
                'linear-sample0.gv',
                p.accept(new RateGraphRenderer()).join('\n'),
            );
            const pc = new ProcessChain(Object.values(data.processes))
                .accept(
                    new RateVisitor(
                        (p) =>
                            new Factory(
                                '__default__',
                                '__default__',
                                null,
                                1,
                                1,
                            ),
                    ),
                )
                .accept(new ProcessCountVisitor())
                .accept(la);
            assert.deepStrictEqual(la.augmented_matrix!.data, [
                //     AD   HC   LC    C    W  REQ
                [-20, 0, 0, 1, 0, 0], // c
                [11, 0, 10, 0, 0, 390], // g
                [5, -20, 0, 0, 0, 0], // h
                [9, 15, -15, 0, 0, 0], // l
                [-10, -15, -15, 0, 1, 0], // w
            ]);
        });
        it('augmented matrix is added 2', function () {
            const la = new LinearAlgebra(
                [new Stack(data.items['g'], 360)],
                ['c', 'w'],
                [],
                false,
            );

            const p = new RateChain(
                new ProcessChain(Object.values(data.processes)),
            );
            p.process_counts = {
                HC: 5,
                LC: 17,
                AO: 20,
                BO: 0,
            };
            p.rebuild_materials();
            fs.writeFileSync(
                'linear-sample1.gv',
                p.accept(new RateGraphRenderer()).join('\n'),
            );
            const pc = new ProcessChain(Object.values(data.processes))
                .accept(
                    new RateVisitor(
                        (p) =>
                            new Factory(
                                '__default__',
                                '__default__',
                                null,
                                1,
                                1,
                            ),
                    ),
                )
                .accept(new ProcessCountVisitor())
                .accept(la);
            floatingPointDeepStrictEqual(
                la.augmented_matrix!.data,
                [
                    //     AO   HC   LC    C    W  REQ
                    [-20, 0, 0, 1, 0, 0], // c
                    [11, 0, 10, 0, 0, 360], // g
                    [5, -20, 0, 0, 0, 0], // h
                    [9, 15, -15, 0, 0, 0], // l
                    [-10, -15, -15, 0, 1, 0], // w
                ],
                numericCompare,
            );
        });
        it('augmented matrix is added with exports', function () {
            const la = new LinearAlgebra(
                [new Stack(data.items['g'], 390)],
                ['c', 'w'],
                ['h'],
                false,
            );

            const p = new RateChain(
                new ProcessChain(Object.values(data.processes)),
            );
            p.process_counts = {
                HC: 5,
                LC: 17,
                AO: 20,
            };
            p.rebuild_materials();
            // fs.writeFileSync("linear-sample2.gv", p.accept(new RateGraphRenderer()).join('\n'));
            const pc = new ProcessChain(Object.values(data.processes))
                .accept(
                    new RateVisitor(
                        (p) =>
                            new Factory(
                                '__default__',
                                '__default__',
                                null,
                                1,
                                1,
                            ),
                    ),
                )
                .accept(new ProcessCountVisitor())
                .accept(la);
            assert.deepStrictEqual(la.augmented_matrix!.data, [
                //     AD   HC   LC    C    W    H   REQ
                [-20, 0, 0, 1, 0, 0, 0], // c
                [11, 0, 10, 0, 0, 0, 390], // g
                [5, -20, 0, 0, 0, -1, 0], // h
                [9, 15, -15, 0, 0, 0, 0], // l
                [-10, -15, -15, 0, 1, 0, 0], // w
            ]);
        });
        it('adds process counts', function () {
            const la = new LinearAlgebra(
                [new Stack(data.items['g'], 390)],
                ['c', 'w'],
                [],
                false,
            );
            const pc = new ProcessChain(Object.values(data.processes))
                .accept(
                    new RateVisitor(
                        (p) =>
                            new Factory(
                                '__default__',
                                '__default__',
                                null,
                                1,
                                1,
                            ),
                    ),
                )
                .accept(new ProcessCountVisitor())
                .accept(la);
            fs.writeFileSync(
                'linear-sample3.gv',
                pc.accept(new RateGraphRenderer()).join('\n'),
            );
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
