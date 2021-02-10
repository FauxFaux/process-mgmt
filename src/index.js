// import { data } from "./dsp/data.js"
import { data } from "./factorio-ab/data.js"
import { ProcessChain, Stack } from "./structures.js"
import { inspect } from 'util'


// console.log(inspect(data, false, null, true));

// console.log(data);

let p = new ProcessChain([
    data.processes.iron_ore_by_sorting,
    data.processes.mineral_catalyst,
    data.processes.mineral_sludge_from_slag_slurry,
    data.processes.slag_slurry_from_crushed_stone,
    data.processes.ore_jivolite_crushing,
    data.processes.ore_saphirite_crushing,
]);

//console.log(p.processes_by_output)
// console.log("circuit production rate", data.processes[3].production_rate(data.items.circuit, 1))

// console.log(p.require_output(new Stack(data.items.circuit, 10)));
// console.log(p.all_items());
console.log(p.to_graphviz());
