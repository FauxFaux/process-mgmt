// import { data } from "./dsp/data.js"
import { data } from "./factorio-ab/data.js"
import { ProcessChain, Stack } from "./structures.js"
import { inspect } from 'util'


// console.log(inspect(data, false, null, true));

// data.processes.forEach((p, i) => {
//     console.log(i, p.factory_group, p.outputs)
// });

let p = new ProcessChain([
    data.processes[9],
    data.processes[8],
    data.processes[7],
    data.processes[6],
    data.processes[0],
    data.processes[5],
]);

//console.log(p.processes_by_output)
// console.log("circuit production rate", data.processes[3].production_rate(data.items.circuit, 1))

// console.log(p.require_output(new Stack(data.items.circuit, 10)));
// console.log(p.all_items());
console.log(p.to_graphviz());
