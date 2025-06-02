import { converse, _converse } from "@converse/headless";

console.log(_converse, converse);

// these are actually 100% optional,
// you can import converse from this file so no global scope pollution will occur
window.converse = converse;
window._converse = _converse;

export { _converse, converse };
