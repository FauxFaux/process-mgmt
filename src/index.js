import { data } from './dsp/data.js';
// import { data as factorio_ab } from './factorio-ab-01/data.js'
//import { data } from './factorio-ab/data.js'
import { ProcessChain, RateChain, Stack } from './structures.js';
// import { inspect } from 'util'
const readline = import('readline');

// console.log(inspect(data, false, null, true));

// console.log(data);

// let p = new ProcessChain([
//     data.processes.waste_water_purification_sulfuric,
//     data.processes.acid_sulfuric,
//     data.processes.gas_sulfur_dioxide,
//     data.processes.iron_ore_by_sorting,
//     data.processes.mineral_catalyst,
//     data.processes.mineral_sludge_from_slag_slurry,
//     data.processes.slag_slurry_from_crushed_stone,
//     data.processes.ore_jivolite_crushing,
//     data.processes.ore_saphirite_crushing,
// ]);


// Object.entries(data.processes).forEach(([id, proc]) => console.log(id));

const readline_disambiguate = function(requirement, options) {
    console.log('Multiple potential options for ', requirement, ':', options);

};

const array_disambiguate = function(requirement, options) {
    let arr = {};
    arr[data.items.diamond.id] = data.processes.diamond_rare;
    if (arr[data.items.diamond.id] === false) {
        throw new Error('No enabled priority for ' + requirement + ' (available: ' + options.map(i => i.id).join(', ') + ')');
    }
    return arr[requirement];
};

let names = [
    'iron_plate',
    'magnet',
    'gear',
    'magnetic_coil',
    'elctric_motor',
    'electromagnetic_turbine',
    'copper_plate',
    'particle_container',
];
// let p = new ProcessChain(names.map(n => data.processes[n]));
// let p = new ProcessChain([data.processes['diamond']])
let p1 = new ProcessChain(Object.values(data.processes))
    // .filter_for_output(new Stack(data.items.electric_motor, 1), array_disambiguate)
    .filter_for_output(new Stack(data.items.graviton_lens, 1), array_disambiguate)
    // .filter_for_output(new Stack(data.items.circuit, 1), array_disambiguate)
    ;

let p = new RateChain(p1, {'assembler': data.factories.assembler_III});
// let r = p.update(new Stack(data.items.circuit, 10));
p.update(new Stack(data.items.graviton_lens, 1));
// p.update(new Stack(data.items.electric_motor, 8));
// console.log(r[0], r[1]);
// let p = new ProcessChain(Object.entries(data.processes).flatMap(
//  ([id, proc]) => proc
// ));

// let processes_from_exported_data = [
// 'angelsore-crushed-mix1-processing', // iron ore from 2x crushed + catalyst.
// ]

//console.log(p.processes_by_output)
// console.log('circuit production rate', data.processes[3].production_rate(data.items.circuit, 1))

// console.log(p.require_output(new Stack(data.items.circuit, 10)));
// console.log(p.all_items());
console.log(p.to_graphviz());
