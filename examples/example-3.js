const logger = require("../lib/index.js");

const LOG = new logger.Logger({
    output: {
        file: {
            enabled: true
        }
    }
});

LOG.log("Test 1");

setTimeout(() => {
    LOG.close();
}, 50)

setTimeout(() => {
    LOG.log("Test 2");
}, 150)

setTimeout(() => {
    LOG.open();
}, 250)

setTimeout(() => {
    LOG.log("Test 3");
}, 350)
