const R3Trans = require('./index');

const main = async() => {
    const transport = new R3Trans('C:\\R3Trans\\R904009.RST');
    const valid = await transport.isValid();
    const tadirContents = await transport.getTableEntries('TADIR');
    const allTableEntries = await transport.getTableEntries();
    debugger
}

main().then(() => {
    debugger
}).catch(e => {
    debugger
})