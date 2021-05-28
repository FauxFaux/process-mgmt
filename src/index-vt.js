import { data } from './vt/data.js'
import { ProcessChain, RateChain, Stack } from './structures.js';


let p = new ProcessChain(Object.values(data.processes))
    .filter_for_output(
        new Stack(data.items.tv, 1),
        function(requirement, options) { },
        []
    );

p = new RateChain(p, {})
p.update(
    new Stack(data.items.tv, 1.25),
        [ // imported
        ],
        [ // exported
        ]
    );

console.log(p.to_graphviz());
