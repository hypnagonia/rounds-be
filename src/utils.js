const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function isZeroAddress(address) {
    return address.toLowerCase() === ZERO_ADDRESS.toLowerCase();
}

module.exports = {
    isZeroAddress
}