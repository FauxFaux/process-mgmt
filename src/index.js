import { data } from "./dsp/data.js"
//import { data } from "./factorio-ab/data.js"
import { ProcessChain, Stack } from "./structures.js"
// import { inspect } from 'util'


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

let names = [
"iron_plate",
"magnet",
"gear",
"magnetic_coil",
"elctric_motor",
"electromagnetic_turbine",
"copper_plate",
"particle_container",
];
// let p = new ProcessChain(names.map(n => data.processes[n]));
// let p = new ProcessChain([data.processes['diamond']])
let p = new ProcessChain(Object.values(data.processes))
    .filter_for_output(new Stack(data.items.graviton_lens, 1))
    ;
// let p = new ProcessChain(Object.entries(data.processes).flatMap(
    //  ([id, proc]) => proc
// ));

// let processes_from_exported_data = [
    // 'angelsore-crushed-mix1-processing', // iron ore from 2x crushed + catalyst.
// ]

//console.log(p.processes_by_output)
// console.log("circuit production rate", data.processes[3].production_rate(data.items.circuit, 1))

// console.log(p.require_output(new Stack(data.items.circuit, 10)));
// console.log(p.all_items());
console.log(p.to_graphviz());
