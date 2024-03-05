import { data_from_standard_json } from '../data_basic.js';

const data_p = data_from_standard_json(
    'dsp',
    '0.0.1',
    import('./dsp.json', { assert: { type: 'json' } }),
);

export default await data_p;
