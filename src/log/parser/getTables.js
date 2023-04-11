const fs = require('fs');
const readline = require('readline');

const _searchTableRegex = (line) => {
    var currentTable;
    const tableNameRegex = /^\d*\s*ETW000\s*table\s*description\s*(.{30})/gi;
    const tableNameMatch = tableNameRegex.exec(line);
    if(tableNameMatch !== null){
        currentTable = tableNameMatch[1].trim();
    }
    return currentTable;
}

module.exports = (logFilePath) => {
    return new Promise((res, rej) => {
        const fileStream = fs.createReadStream(logFilePath);
        var tables = {};
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });


        var currentTable;
        rl.on('line', (line) => {
            if(!currentTable){
                currentTable = _searchTableRegex(line);
            }else{
                const tableDescriptorRegex = /^\d*\s*ETW000\s*\*\*\s*38\s*\*\*\s{1}(X|\s{1})(\w{1})(\d*)(.{30})/gi;
                const tableDescriptorMatch = tableDescriptorRegex.exec(line);
                if(tableDescriptorMatch !== null){
                    if(!tables[currentTable]){
                        tables[currentTable] = new Map();
                    }
                    tables[currentTable].set(tableDescriptorMatch[4].trim(), parseInt(tableDescriptorMatch[3])/2);
                }else{
                    currentTable = _searchTableRegex(line);
                }
            }
        });

        rl.on('close', () => {
            res(tables);
        });
    });
}