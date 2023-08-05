import { Data, Item, Stack, FactoryGroup, Factory, Process } from '../structures.js';

const check_add = function (item, fn) {
    try {
        return fn();
    } catch (error) {
        console.log('error processing item:', item);
        throw error;
    }
};

let data_p = import('./planbterraform.json', { assert: { type: 'json' } })
    .then(module => module.default)
    .then(raw => {
        let data = new Data('planbterraform', '0.0.1');

        raw.items.forEach(i => check_add(i, () => data.add_item(new Item(i.id, i.i18n.en, i.group))));

        const parseFraction = function (input) {
            if (input.includes('/')) {
                let parts = input.split('/');
                return parts[0] / parts[1];
            }
            return parseFloat(input);
        };

        raw.processes.forEach(p => {
            if (!data.factory_groups[p.factory_group]) {
                check_add(p, () => data.add_factory_group(new FactoryGroup(p.factory_group)));
            }
            let inputs = Object.entries(p.inputs).map(e => {
                return check_add(p, () => new Stack(data.items[e[0]], e[1]));
            });
            let outputs = Object.entries(p.outputs).map(e => {
                return check_add(p, () => new Stack(data.items[e[0]], e[1]));
            });
            check_add(p, () => {
                data.add_process(
                    new Process(
                        p.name,
                        inputs,
                        outputs,
                        parseFraction(p.duration),
                        check_add(p, () => data.factory_groups[p.factory_group]),
                    ),
                );
            });
        });

        return data;
    });

export default await data_p;
