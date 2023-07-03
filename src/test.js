const R3Trans = require('./index');
const fs = require('fs');
const { Readable } = require('stream');
const { getTableStructure, getTableEntries } = require('./table');

const main = async() => {
    const transport1 = new R3Trans('C:\\R3Trans\\R904215.RST');
    const logBuffer = await transport1.getLogBuffer();
    const fileStream1 = Readable.from(logBuffer);
    const fileStream2 = Readable.from(logBuffer);
    const tables = await getTableStructure({
        fileStream: fileStream1
    });
    const tableEntries = await getTableEntries({
        fileStream: fileStream2,
        tables
    });
    debugger
}

main().then(() => {
    debugger
}).catch(e => {
    debugger
});