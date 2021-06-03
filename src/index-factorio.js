import { ProcessChain, RateChain, Stack } from './structures.js';
import * as fs from 'fs'
import yargs from 'yargs';

const argv = yargs(process.argv)
    .option('config', {
        alias: 'c',
        type: 'string'
    })
    .help().alias('h', 'help')
    .demandOption(['config'])
    .argv;

let config = JSON.parse(fs.readFileSync(argv.config, 'utf8'));
let data = (await import('./' + config.data +'/data.js')).data;

const array_disambiguate = function(requirement, options) {
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

let p = new ProcessChain(Object.values(data.processes))
    .filter_for_output(
        new Stack(data.items[config.requirement.id], 1),
        array_disambiguate,
        [].concat(config.imported).concat(config.exported)
    );

p = new RateChain(p, f => quickest_factory_for_factory_type(data, f));

p.update(new Stack(data.items[config.requirement.id], config.requirement.rate), config.imported, config.exported);

console.log(p.to_graphviz());
