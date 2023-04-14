const R3Trans = require('./index');
const fs = require('fs');

const main = async() => {
    const transport1 = new R3Trans('C:\\R3Trans\\R916141.PRS');
    const valid1 = await transport1.isValid();
    const tadirContents1 = await transport1.getTableEntries('TADIR');
    debugger
    const trBinary = fs.readFileSync('C:\\R3Trans\\R916141.PRS');
    const transport2 = new R3Trans(trBinary);
    const valid2 = await transport2.isValid();
    const tadirContents2 = await transport2.getTableEntries('TADIR');
    debugger
}

main().then(() => {
    debugger
}).catch(e => {
    debugger
})