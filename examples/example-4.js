const logger = require("../lib/index.js");

const LOG = new logger.Logger({
    output: {
        file: {
            enabled: true,
            maxFileAge: 1000
        }
    }
});

LOG.log("Test 1");

setTimeout(() => {
    LOG.log("Test 2");
}, 20000)

setTimeout(() => {
    LOG.log("Test 3");
}, 40000)
