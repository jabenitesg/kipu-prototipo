// Values made inside the vm sandbox come from another realm, so strict deep equality
// would reject them for their prototype alone. Copy them into this realm first.
const assert = require('node:assert/strict');
const here = (v) => (v && typeof v === 'object' ? structuredClone(v) : v);
module.exports = Object.assign((v, msg) => assert(v, msg), assert, {
  deepStrictEqual: (a, b, msg) => assert.deepStrictEqual(here(a), here(b), msg),
  deepEqual: (a, b, msg) => assert.deepStrictEqual(here(a), here(b), msg),
});
