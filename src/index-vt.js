import { data } from './vt/data.js'
import { ProcessChain, RateChain, Stack } from './structures.js';


let p = new ProcessChain(Object.values(data.processes));

console.log(p.to_graphviz());
