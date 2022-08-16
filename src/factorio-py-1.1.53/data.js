import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { create_data } from './data_base.js';

let data = create_data(require);

export { data };
