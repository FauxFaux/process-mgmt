import { ProcessChain, RateChain, Stack } from './structures.js';
import * as fs from 'fs'
import yargs from 'yargs';
import { StandardGraphRenderer } from './visit/standard_graph_renderer.js';
import { FilterForOutput } from './visit/filter_for_output_visitor.js';
import { EnableDisable } from './visit/enable_disable_visitor.js';

const array_disambiguate = function(data, config) {
    return function(requirement, options) {
        let arr = Object.entries(config.process_choices).map(e => {
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
    if ("undefined" === (typeof value)) {
        return def;
    }
    return value;
}

const command_graph = function(argv) {
    fs.readFile(argv.config, 'utf8', (_err, str) => {
        let config = JSON.parse(str);
        import('./' + config.data +'/data.js').then(module => {
            let data = module.data;
            let p = new ProcessChain(Object.values(data.processes))
                .accept(new FilterForOutput(
                    data.items[config.requirement.id],
                    array_disambiguate(data, config),
                    [].concat(config.imported).concat(config.exported),
                )).accept(new EnableDisable(
                    data,
                    config.enable,
                    config.disable
                ))
            console.log(p.to_graphviz());
        });
    });
};

const command_rate = function(argv) {
    let config = JSON.parse(fs.readFileSync(argv.config, 'utf8')); // TODO enter callback hell.
    import('./' + config.data +'/data.js').then(module => {
        let data = module.data;
        let p = new ProcessChain(Object.values(data.processes))
            .filter_for_output(
                new Stack(data.items[config.requirement.id], 1),
                array_disambiguate(data, config),
                [].concat(config.imported).concat(config.exported)
            );
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
        });
        p.update(new Stack(data.items[config.requirement.id], config.requirement.rate), config.imported, config.exported);
        console.log(p.to_graphviz());
    });
}

const command_manual_rate = function(argv) {
    let config = JSON.parse(fs.readFileSync(argv.config, 'utf8')); // TODO enter callback hell.
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
        });
        p.process_counts = config.process_counts;
        p.rebuild_materials();
        console.log(p.to_graphviz());
    });
}

const command_update4 = function(argv) {
    let config = JSON.parse(fs.readFileSync(argv.config, 'utf8')); // TODO enter callback hell.
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
                    [].concat(config.imported).concat(config.exported),
                    // ...optional(config.enable, []).map(s => data.processes[s])
                    ))
                .accept(new StandardGraphRenderer()).join('\n');
            console.log(g);
        });
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
    .command('manual-visitor', '', (yargs) => {
        yargs.option('config', {
            alias: 'c',
            type: 'string'
        })
        .demandOption(['config'])
    }, command_manual_visitor)
    .demandCommand()
    .help().alias('h', 'help')
    .argv;
