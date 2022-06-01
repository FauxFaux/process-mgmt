import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import create_data from './data_base.js';

data = create_data(require);

export { data };
