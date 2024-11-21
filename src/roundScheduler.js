const { loadRounds, saveRound } = require('./db');

// loop
// lastUpdated

const INTERVAL_MS = 1000 * 60


const init = () => {
    loop()
}

const loop = async () => {
    // check balance first

    setTimeout(loop, INTERVAL_MS)
}

module.exports = {
    init
}