import { data_from_standard_json } from '../data_basic.js';

const data_p = data_from_standard_json(
    'For The Crown',
    '0.0.1',
    import('./for-the-crown.json', { assert: { type: 'json' } }),
);

export default await data_p;
