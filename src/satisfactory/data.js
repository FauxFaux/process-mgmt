import { data_from_standard_json } from '../data_basic.ts';

const data_p = data_from_standard_json(
    'Satisfactory',
    '0.0.1',
    import('./satisfactory.json', { assert: { type: 'json' } }),
);

export default await data_p;
