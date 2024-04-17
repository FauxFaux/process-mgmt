import { data_from_standard_json } from '../data_basic.js';

const data_p = data_from_standard_json(
    'planbterraform',
    '0.0.1',
    import('./planbterraform.json', { assert: { type: 'json' } }),
);

export default await data_p;
