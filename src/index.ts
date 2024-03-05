import { ProcessChain, RateChain, Stack } from './structures.js';
import * as fs from 'fs';
import yargs from 'yargs';
import { Factory } from './factory.js';

import { StandardGraphRenderer } from './visit/standard_graph_renderer.js';
import { FilterForOutput } from './visit/filter_for_output_visitor.js';
import { EnableDisable } from './visit/enable_disable_visitor.js';
import { RateCalculator } from './visit/rate_calculator.js';
import { RateGraphRenderer } from './visit/rate_graph_renderer.js';
import { RateVisitor } from './visit/rate_visitor.js';
import { LinearAlgebra } from './visit/linear_algebra_visitor.js';
import { ProcessCountVisitor } from './visit/process_count_visitor.js';

import type Matrix from 'node-matrices';
export type { Matrix };

const array_disambiguate = function (data, config) {
    return function (requirement, options) {
        const arr = Object.entries(config.get_process_choices())
            .map((e: [string, any]) => {
                return [data.items[e[0]].id, data.processes[e[1]]];
            })
            .reduce((acc, cur) => {
                acc[cur[0]] = cur[1];
                return acc;
            }, {});

        if (!arr[requirement] === true) {
            throw new Error(
                'No enabled priority for ' +
                    requirement +
                    ' (available: ' +
                    options.map((i) => i.id).join(', ') +
                    ')\n\n' +
                    'Import Selection:' +
                    '\n' +
                    '"' +
                    requirement +
                    '",' +
                    '\n\n' +
                    options
                        .map((p) => {
                            return (
                                p.id +
                                ' => \n' +
                                '  inputs:\n' +
                                p.inputs
                                    .map((i) => '    ' + i.toString())
                                    .join('\n') +
                                '\n' +
                                '  outputs:\n' +
                                p.outputs
                                    .map((i) => '    ' + i.toString())
                                    .join('\n') +
                                '\n' +
                                'Process Selection: ' +
                                '\n' +
                                '"' +
                                requirement +
                                '": "' +
                                p.id +
                                '",' +
                                '\n'
                            );
                        })
                        .join('\n'),
            );
        }
        return arr[requirement];
    };
};

const quickest_factory_for_factory_type = function (data, factory_type) {
    return Object.values(data.factories)
        .filter((f: any) => {
            const g = f.groups.filter((ft) => {
                return ft.id == factory_type.id;
            });
            return g.length != 0; // When `g` is not empty, the factory can handle the process.
        })
        .sort((a: any, b: any) => a.duration_modifier - b.duration_modifier)[0]; // after sorting, return the first in the list, which will be the quickest.
};

const command_all = function (argv) {
    import('./' + argv.data + '/data.ts').then((module) => {
        const data = module.data;
        const p = new ProcessChain(Object.values(data.processes));
        console.log(p.to_graphviz());
    });
};

const optional = function (value, def) {
    if (typeof def === typeof value) {
        return value;
    }
    return def;
};

const decorate_config = function (config) {
    config.get_process_choices = function () {
        return optional(config.process_choices, []);
    };
    config.get_requirement = function (data) {
        if (config.requirement) {
            return new Stack(
                data.items[config.requirement.id],
                config.requirement.rate,
            );
        } else if (config.requirements) {
            return new Stack(
                data.items[config.requirements[0].id],
                config.requirements[0].rate,
            );
        }
    };
    config.get_requirements = function (data) {
        if (config.requirement) {
            return [
                new Stack(
                    data.items[config.requirement.id],
                    config.requirement.rate,
                ),
            ];
        } else if (config.requirements) {
            return config.requirements.map(
                (r) => new Stack(data.items[r.id], r.rate),
            );
        }
    };
    config.get_factory_type = function (
        data,
        process_id,
        process_factory_group_id,
        fallback_cb,
    ) {
        const per_process = optional(config.factory_types, {})[process_id];
        if (per_process) return data.factories[per_process];
        const per_group = optional(config.factory_type_defaults, {})[
            process_factory_group_id
        ];
        if (per_group) return data.factories[per_group];
        return fallback_cb();
    };
    config.get_enabled = function () {
        return optional(config.enable, []);
    };
    config.get_disabled = function () {
        return optional(config.disable, []);
    };
    config.get_imported = function () {
        return optional(config.imported, []);
    };
    config.get_exported = function () {
        return optional(config.exported, []);
    };
    config.get_modifier_output = function (process_id) {
        if (
            config.modifiers &&
            config.modifiers[process_id] &&
            config.modifiers[process_id].output
        ) {
            return config.modifiers[process_id].output;
        }
        return 1;
    };
    config.get_modifier_speed = function (process_id) {
        if (
            config.modifiers &&
            config.modifiers[process_id] &&
            config.modifiers[process_id].speed
        ) {
            return config.modifiers[process_id].speed;
        }
        return 1;
    };

    return config;
};

const command_linear_algebra = function (argv) {
    fs.readFile(argv.config, 'utf8', (_err, str) => {
        const config = decorate_config(JSON.parse(str));
        import('./' + config.data + '/data.ts')
            .catch((e) => console.log('failed to import', config.data, e))
            .then((module) => module.default)
            .then((data) => {
                const g = new ProcessChain(Object.values(data.processes))
                    .filter_for_output(
                        config.get_requirement(data),
                        array_disambiguate(data, config),
                        []
                            .concat(config.get_imported())
                            .concat(config.get_exported()),
                    )
                    .enable(
                        ...config.get_enabled().map((s) => data.processes[s]),
                    )
                    .accept(
                        new RateVisitor((process) => {
                            let f = config.get_factory_type(
                                data,
                                process.id,
                                process.factory_group.id,
                                () =>
                                    quickest_factory_for_factory_type(
                                        data,
                                        process.factory_group,
                                    ),
                            );
                            if (typeof f === 'undefined') {
                                console.warn(
                                    'No factory found for ',
                                    process.factory_group,
                                );
                                f = new Factory(
                                    '__default__',
                                    '__default__',
                                    null,
                                    1,
                                    1,
                                );
                            }
                            return f.modify(
                                config.get_modifier_speed(process.id),
                                config.get_modifier_output(process.id),
                            );
                        }),
                    )
                    .accept(new ProcessCountVisitor())
                    .accept(
                        new LinearAlgebra(
                            config.get_requirements(data),
                            config.get_imported(),
                            config.get_exported(),
                        ),
                    )
                    .accept(new RateGraphRenderer())
                    .join('\n');
                console.log(g);
            });
    });
};

const process_to_pretty_string = function (p, data) {
    return (
        p.id +
        ' => \n' +
        '  factory group: ' +
        p.factory_group.name +
        '\n' +
        '  duration: ' +
        p.duration +
        '\n' +
        '  inputs:\n' +
        p.inputs
            .map((i) => '    ' + i.item.id + ' (' + i.quantity + ')')
            .join('\n') +
        '\n' +
        '  outputs:\n' +
        p.outputs
            .map((i) => '    ' + i.item.id + ' (' + i.quantity + ')')
            .join('\n') +
        '\n' +
        '  made in:\n' +
        Object.values(data.factories)
            .filter((f: any) =>
                f.groups.map((fg) => fg.name).includes(p.factory_group.name),
            )
            .map(
                (f: any) =>
                    f.id +
                    ' (duration modifier: ' +
                    f.duration_modifier +
                    ', output modifier: ' +
                    f.output_modifier +
                    ')',
            )
            .map((s) => '    ' + s)
            .join('\n')
    );
};

const command_what_produces = function (argv) {
    import('./' + argv.data + '/data.ts').then((module) => {
        const data = module.data;
        const p = new ProcessChain(Object.values(data.processes));
        const options = p.processes_by_output[argv.produces];
        console.log(
            options.map((p) => process_to_pretty_string(p, data)).join('\n'),
        );
    });
};

const command_what_uses = function (argv) {
    import('./' + argv.data + '/data.ts').then((module) => {
        const data = module.data;
        const p = new ProcessChain(Object.values(data.processes));
        const options = p.processes_by_input[argv.uses];
        console.log(
            options.map((p) => process_to_pretty_string(p, data)).join('\n'),
        );
    });
};

const argv = yargs(process.argv.slice(2))
    .command(
        'all',
        'generate a graph of all the processes',
        (yargs) => {
            yargs
                .option('data', {
                    alias: 'd',
                    type: 'string',
                })
                .demandOption(['data']);
        },
        command_all,
    )
    .command(
        'linear',
        'linear-algebra based calculations',
        (yargs) => {
            yargs
                .option('config', {
                    alias: 'c',
                    type: 'string',
                })
                .demandOption(['config']);
        },
        command_linear_algebra,
    )
    .command(
        'what-produces',
        '',
        (yargs) => {
            yargs
                .option('data', {
                    alias: 'd',
                    type: 'string',
                })
                .option('produces', {
                    alias: 'p',
                    type: 'string',
                })
                .demandOption(['data', 'produces']);
        },
        command_what_produces,
    )
    .command(
        'what-uses',
        '',
        (yargs) => {
            yargs
                .option('data', {
                    alias: 'd',
                    type: 'string',
                })
                .option('uses', {
                    alias: 'p',
                    type: 'string',
                })
                .demandOption(['data', 'uses']);
        },
        command_what_uses,
    )
    .demandCommand()
    .help()
    .alias('h', 'help').argv;
