import { ProcessChain, RateChain, Stack } from './structures.js';
import * as fs from 'fs'
import yargs from 'yargs';
import { Factory } from './factory.js';

import { StandardGraphRenderer } from './visit/standard_graph_renderer.js';
import { FilterForOutput } from './visit/filter_for_output_visitor.js';
import { EnableDisable } from './visit/enable_disable_visitor.js';
import { RateCalculator } from './visit/rate_calculator.js';
import { RateGraphRenderer } from './visit/rate_graph_renderer.js';
import { RateVisitor } from './visit/rate_visitor.js';
import { LinearAlgebra } from './visit/linear_algebra_visitor.js';
import { CycleRemover } from './visit/cycle_remover.js';
import { CycleExpander } from './visit/cycle_expander.js';
import { ProcessCountVisitor } from './visit/process_count_visitor.js';

const array_disambiguate = function(data, config) {
    return function(requirement, options) {
        let arr = Object.entries(config.get_process_choices()).map(e => {
            return [
                data.items[e[0]].id,
                data.processes[e[1]]
            ];
        }).reduce((acc, cur) => {acc[cur[0]] = cur[1]; return acc;}, {});

        if (!(arr[requirement]) === true) {
            throw new Error('No enabled priority for ' + requirement + ' (available: ' + options.map(i => i.id).join(', ') + ')\n\n'
                + "Import Selection:"
                + '\n'
                + "\"" + requirement + "\","
                + '\n\n'
                + options.map(p => {
                    return p.id + ' => \n'
                        + '  inputs:\n'
                        + p.inputs.map(i => '    ' + i.toString()).join('\n')
                        + '\n'
                        + '  outputs:\n'
                        + p.outputs.map(i => '    ' + i.toString()).join('\n')
                        + '\n'
                        + 'Process Selection: '
                        + '\n'
                        + '"' + requirement + '": "' + p.id + '",'
                        + '\n'
                    }).join('\n')
            );
        }
        return arr[requirement];
    };
};

const quickest_factory_for_factory_type = function(data, factory_type) {
    return Object.values(data.factories)
            .filter(f => {
                let g = f.groups.filter(ft => {
                    return ft.id == factory_type.id
                });
                return g.length != 0; // When `g` is not empty, the factory can handle the process.
            })
            .sort((a, b) => a.duration_modifier - b.duration_modifier)
            [0]; // after sorting, return the first in the list, which will be the quickest.
}

const command_all = function(argv) {
    import('./' + argv.data +'/data.js').then(module => {
        let data = module.data;
        let p = new ProcessChain(Object.values(data.processes));
        console.log(p.to_graphviz());
    });
};

const optional = function(value, def) {
    if ((typeof def) === (typeof value)) {
        return value;
    }
    return def;
}

const decorate_config = function(config) {
    config.get_process_choices = function() {
        return optional(config.process_choices, []);
    }
    config.get_requirement = function(data) {
        if (config.requirement) {
            return new Stack(data.items[config.requirement.id], config.requirement.rate);
        } else if (config.requirements) {
            return new Stack(data.items[config.requirements[0].id], config.requirements[0].rate);
        }
    };
    config.get_requirements = function(data) {
        if (config.requirement) {
            return [new Stack(data.items[config.requirement.id], config.requirement.rate)];
        } else if (config.requirements) {
            return config.requirements.map(r => new Stack(data.items[r.id], r.rate));
        }
    };
    config.get_factory_type = function(data, process_id, fallback_cb) {
        if (optional(config.factory_types, {})[process_id]) {
            return data.factories[optional(config.factory_types, {})[process_id]];
        } else {
            return fallback_cb();
        };
    }
    config.get_enabled = function() {
        return optional(config.enable, []);
    };
    config.get_disabled = function() {
        return optional(config.disable, []);
    };
    config.get_imported = function() {
        return optional(config.imported, []);
    };
    config.get_exported = function() {
        return optional(config.exported, []);
    };
    config.get_modifier_output = function(process_id) {
        if (config.modifiers && config.modifiers[process_id] && config.modifiers[process_id].output) {
            return config.modifiers[process_id].output;
        }
        return 1;
    };
    config.get_modifier_speed = function(process_id) {
        if (config.modifiers && config.modifiers[process_id] && config.modifiers[process_id].speed) {
            return config.modifiers[process_id].speed;
        }
        return 1;
    }

    return config;
}

const command_graph = function(argv) {
    fs.readFile(argv.config, 'utf8', (_err, str) => {
        let config = decorate_config(JSON.parse(str));
        import('./' + config.data +'/data.js').then(module => {
            let data = module.data;
            let g = new ProcessChain(Object.values(data.processes))
                .accept(new FilterForOutput(
                    data.items[config.requirement.id],
                    array_disambiguate(data, config),
                    [].concat(config.get_imported()).concat(config.get_exported()),
                )).accept(new EnableDisable(
                    data,
                    config.get_enabled(),
                    config.get_disabled()
                )).accept(new StandardGraphRenderer()).join('\n');
            console.log(g);
        });
    });
};

const command_linear_algebra = function(argv) {
    fs.readFile(argv.config, 'utf8', (_err, str) => {
        let config = decorate_config(JSON.parse(str));
        import('./' + config.data +'/data.js').then(module => {
            let data = module.data;
            let g = new ProcessChain(Object.values(data.processes))
                .filter_for_output(
                    config.get_requirement(data),
                    array_disambiguate(data, config),
                    [].concat(config.get_imported()).concat(config.get_exported())
                    )
                .enable(...config.get_enabled().map(s => data.processes[s]))
                .accept(new RateVisitor(process => {
                    let f = config.get_factory_type(data, process.id, () => quickest_factory_for_factory_type(data, process.factory_group));
                    if ((typeof f) === "undefined") {
                        console.warn("No factory found for ", process.factory_group);
                        f = new Factory('__default__', '__default__', null, 1, 1);
                    }
                    return f.modify(
                        config.get_modifier_speed(process.id),
                        config.get_modifier_output(process.id),
                        );
                    })
                )
                .accept(new ProcessCountVisitor())
                .accept(new LinearAlgebra(config.get_requirements(data), config.get_imported(), config.get_exported()))
                .accept(new RateGraphRenderer()).join('\n');
            console.log(g);
        });
    });
};

const command_rate_with_manual = function(argv) {
    fs.readFile(argv.config, 'utf8', (_err, str) => {
        let config = decorate_config(JSON.parse(str));
        import('./' + config.data +'/data.js').then(module => {
            let data = module.data;
            let p = new ProcessChain(Object.values(data.processes))
                .accept(new FilterForOutput(
                    data.items[config.requirement.id],
                    array_disambiguate(data, config),
                    [].concat(config.get_imported()).concat(config.get_exported())
                    ))
                .accept(new RateVisitor(process => {
                    let f = quickest_factory_for_factory_type(data, process.factory_group);
                    if ((typeof f) === "undefined") {
                        console.warn("No factory found for ", process.factory_group);
                        f = new Factory('__default__', '__default__', null, 1, 1);
                    }
                    return f.modify(
                        config.get_modifier_speed(process.id),
                        config.get_modifier_output(process.id),
                        );
                }))
                .accept(new RateCalculator(
                    config.get_requirement(data),
                    config.get_imported(),
                    array_disambiguate(data, config)
                    ));
            let r = {};
            Object.entries(p.process_counts).forEach(kv => {
                r[kv[0]] = kv[1]
            });
            Object.entries(config.process_counts).forEach(kv => {
                if (r[kv[0]]) {
                    r[kv[0]] = r[kv[0]] + kv[1];
                } else {
                    r[kv[0]] = kv[1]
                }
            });
            let to_enable = optional(Object.keys(config.process_counts), [])
                .filter(pr => !p.processes.map(pp => pp.id).includes(pr))
                .map(s => data.processes[s])
            p = p.enable(...to_enable);
            let pr = new RateChain(p, (process) => {
                let output = 1;
                let speed = 1;
                if (config.modifiers && config.modifiers[process.id] && config.modifiers[process.id].output) {
                    output = config.modifiers[process.id].output;
                }
                if (config.modifiers && config.modifiers[process.id] && config.modifiers[process.id].speed) {
                    speed = config.modifiers[process.id].speed;
                }
                return quickest_factory_for_factory_type(data, process.factory_group).modify(speed, output);
            })
            pr.process_counts = r;
            pr.rebuild_materials();
            let g = pr.accept(new RateGraphRenderer()).join('\n');
            console.log(g);
        });
    });
}


const command_rate = function(argv) {
    fs.readFile(argv.config, 'utf8', (_err, str) => {
        let config = decorate_config(JSON.parse(str));
        import('./' + config.data +'/data.js').then(module => {
            let data = module.data;
            let g = new ProcessChain(Object.values(data.processes))
                .accept(new FilterForOutput(
                    config.get_requirement(data).item,
                    array_disambiguate(data, config),
                    [].concat(config.get_imported()).concat(config.get_exported())
                    ))
                .accept(new RateVisitor(process => {
                    let f = config.get_factory_type(data,
                        process.id,
                        () => quickest_factory_for_factory_type(data, process.factory_group));
                    if ((typeof f) === "undefined") {
                        console.warn("No factory found for ", process.factory_group);
                        f = new Factory('__default__', '__default__', null, 1, 1);
                    }
                    return f.modify(
                        config.get_modifier_speed(process.id),
                        config.get_modifier_output(process.id),
                        );
                }))
                .accept(new RateCalculator(
                    config.get_requirement(data),
                    config.get_imported(),
                    array_disambiguate(data, config)
                    ))
                .accept(new RateGraphRenderer()).join('\n');
            console.log(g);
        });
    });
}

const command_rate_loop = function(argv) {
    fs.readFile(argv.config, 'utf8', (_err, str) => {
        let config = decorate_config(JSON.parse(str));
        import('./' + config.data +'/data.js').then(module => {
            let data = module.data;
            let g = new ProcessChain(Object.values(data.processes))
                .accept(new FilterForOutput(
                    data.items[config.requirement.id],
                    array_disambiguate(data, config),
                    [].concat(config.get_imported()).concat(config.get_exported())
                    ))
                .accept(new RateVisitor(process => {
                    let f = quickest_factory_for_factory_type(data, process.factory_group);
                    if ((typeof f) === "undefined") {
                        console.warn("No factory found for ", process.factory_group);
                        f = new Factory('__default__', '__default__', null, 1, 1);
                    }
                    return f.modify(
                        config.get_modifier_speed(process.id),
                        config.get_modifier_output(process.id),
                        );
                }))
                .accept(new CycleRemover(data))
                .accept(new RateCalculator(
                    config.get_requirement(data),
                    config.get_imported(),
                    array_disambiguate(data, config)
                    ))
                .accept(new CycleExpander(data))
                .accept(new RateGraphRenderer()).join('\n');
            console.log(g);
        });
    });
}

const command_manual_rate = function(argv) {
    let config = decorate_config(JSON.parse(fs.readFileSync(argv.config, 'utf8'))); // TODO enter callback hell.
    import('./' + config.data +'/data.js').then(module => {
        let data = module.data;
        let p = new ProcessChain(Object.values(data.processes))
            .filter_for_output(
                config.get_requirement(data),
                array_disambiguate(data, config),
                [].concat(config.imported).concat(config.exported)
            ).enable(...optional(config.enable, []).map(s => data.processes[s]));
        p = new RateChain(p, (process) => {
            let output = 1;
            let speed = 1;
            if (config.modifiers && config.modifiers[process.id] && config.modifiers[process.id].output) {
                output = config.modifiers[process.id].output;
            }
            if (config.modifiers && config.modifiers[process.id] && config.modifiers[process.id].speed) {
                speed = config.modifiers[process.id].speed;
            }
            return config.get_factory_type(data, process.id, () => quickest_factory_for_factory_type(data, process.factory_group).modify(speed, output));
        });
        p.process_counts = config.process_counts;
        p.rebuild_materials();
        let material_output = p.materials.items().map(item => {
            let produce = Math.abs(p.materials.total_positive(item).quantity);
            let consume = Math.abs(p.materials.total_negative(item).quantity);
            return [item.id,
                "produce", produce,
                "consume", consume,
                "producer count multiplier", (consume / produce),
                "consumer count multiplier", (produce / consume)];
        }).sort((a, b) => a[0].localeCompare(b[0]));
        material_output.forEach(arr => console.error(...arr));
        console.log(p.accept(new RateGraphRenderer()).join('\n'));
    });
}

const command_update4 = function(argv) {
    let config = decorate_config(JSON.parse(fs.readFileSync(argv.config, 'utf8'))); // TODO enter callback hell.
    import('./' + config.data +'/data.js').then(module => {
        let data = module.data;
        let p = new ProcessChain(Object.values(data.processes))
            .filter_for_output(
                new Stack(data.items[config.requirement.id], 1),
                array_disambiguate(data, config),
                [].concat(config.imported).concat(config.exported)
            ).enable(...optional(config.enable, []).map(s => data.processes[s]));
        p = new RateChain(p, (process) => {
            let output = 1;
            let speed = 1;
            if (config.modifiers && config.modifiers[process.id] && config.modifiers[process.id].output) {
                output = config.modifiers[process.id].output;
            }
            if (config.modifiers && config.modifiers[process.id] && config.modifiers[process.id].speed) {
                speed = config.modifiers[process.id].speed;
            }
            return quickest_factory_for_factory_type(data, process.factory_group).modify(speed, output);
        }).update4(null, config.imported, config.exported)

        let produced_quantity = p.materials.total(config.get_requirement(data).item).quantity;
        let required_quantity = config.get_requirement(data).quantity;
        let multiplier = required_quantity / produced_quantity;
        p.process_counts = Object.entries(p.process_counts).map(pair => {
            return [pair[0], pair[1] * multiplier];
        }).reduce((prev, pair) => {
            prev[pair[0]] = pair[1];
            return prev;
        }, {})
        p.rebuild_materials()

        console.log(p.to_graphviz());
    });
}

const command_manual_visitor = function(argv) {
    fs.readFile(argv.config, 'utf8', (_err, str) => {
        let config = JSON.parse(str);
        import('./' + config.data +'/data.js').then(module => {
            let data = module.data;
            let g = new ProcessChain(Object.values(data.processes))
                .accept(new FilterForOutput(
                    data.items[config.requirement.id],
                    array_disambiguate(data, config),
                    [].concat(config.imported).concat(config.exported)
                    ))
                .accept(new RateVisitor(
                    factory_type => quickest_factory_for_factory_type(data, factory_type)
                    ))
                .accept(new RateCalculator(
                    new Stack(data.items[config.requirement.id], config.requirement.rate),
                    config.imported,
                    array_disambiguate
                    ))
                .accept(new RateGraphRenderer()).join('\n');
            console.log(g);
        });
    });
}

const process_to_pretty_string = function(p, data) {
    return p.id + ' => \n'
        + '  factory group: ' + p.factory_group.name + '\n'
        + '  duration: ' + p.duration + '\n'
        + '  inputs:\n'
        + p.inputs.map(i => '    ' + i.item.id + ' (' + i.quantity + ')').join('\n') + '\n'
        + '  outputs:\n'
        + p.outputs.map(i => '    ' + i.item.id + ' (' + i.quantity + ')').join('\n') + '\n'
        + '  made in:\n'
        + Object.values(data.factories).filter(f => f.groups.map(fg => fg.name).includes(p.factory_group.name)).map(f => f.id + ' (duration modifier: ' + f.duration_modifier + ', output modifier: ' + f.output_modifier + ')').map(s => '    ' + s).join('\n')
}

const command_what_produces = function(argv) {
    import('./' + argv.data + '/data.js').then(module => {
        let data = module.data;
        let p = new ProcessChain(Object.values(data.processes));
        let options = p.processes_by_output[argv.produces];
        console.log(
            options.map(p => process_to_pretty_string(p, data)).join('\n')
        );
    });
}

const command_what_uses = function(argv) {
    import('./' + argv.data + '/data.js').then(module => {
        let data = module.data;
        let p = new ProcessChain(Object.values(data.processes));
        let options = p.processes_by_input[argv.uses];
        console.log(
            options.map(p => process_to_pretty_string(p, data)).join('\n')
        );
    });
}

const argv = yargs(process.argv.slice(2))
    .command('all', 'generate a graph of all the processes', (yargs) => {
        yargs.option('data', {
            alias: 'd',
            type: 'string'
        })
        .demandOption(['data'])
    }, command_all)
    .command('factory-graph', 'generate a graph filtered to producing a particular item', (yargs) => {
        yargs.option('config', {
            alias: 'c',
            type: 'string'
        })
        .demandOption(['config'])
    }, command_graph)
    .command('factory-rate', 'generate a graph filtered to producing a particular item; with factory counts.', (yargs) => {
        yargs.option('config', {
            alias: 'c',
            type: 'string'
        })
        .demandOption(['config'])
    }, command_rate)
    .command('factory-rate-loop', 'generate a graph filtered to producing a particular item; with factory counts. Finding and removing loops', (yargs) => {
        yargs.option('config', {
            alias: 'c',
            type: 'string'
        })
        .demandOption(['config'])
    }, command_rate_loop)
    .command('manual-rate', 'generate a graph filtered to producing a particular item; with factory counts provided by the configuration', (yargs) => {
        yargs.option('config', {
            alias: 'c',
            type: 'string'
        })
        .demandOption(['config'])
    }, command_manual_rate)
    .command('update4', 'experimental', (yargs) => {
        yargs.option('config', {
            alias: 'c',
            type: 'string'
        })
        .demandOption(['config'])
    }, command_update4)
    .command('linear', 'experimental, linear-algebra', (yargs) => {
        yargs.option('config', {
            alias: 'c',
            type: 'string'
        })
        .demandOption(['config'])
    }, command_linear_algebra)
    .command('manual-visitor', '', (yargs) => {
        yargs.option('config', {
            alias: 'c',
            type: 'string'
        })
        .demandOption(['config'])
    }, command_manual_visitor)
    .command('what-produces', '', (yargs) => {
        yargs.option('data', {
            alias: 'd',
            type: 'string'
        }).option('produces', {
            alias: 'p',
            type: 'string'
        })
        .demandOption(['data', 'produces'])
    }, command_what_produces)
    .command('what-uses', '', (yargs) => {
        yargs.option('data', {
            alias: 'd',
            type: 'string'
        }).option('uses', {
            alias: 'p',
            type: 'string'
        })
        .demandOption(['data', 'uses'])
    }, command_what_uses)
    .demandCommand()
    .help().alias('h', 'help')
    .argv;
