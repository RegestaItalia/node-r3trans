const fs = require('fs');
const readline = require('readline');

const _searchTableRegex = (line, tableName) => {
    var currentTable;
    if(!tableName){
        tableName = '.{30}';
    }else{
        tableName = tableName.toUpperCase();
    }
    const tableNameRegex = new RegExp(`^\\d*\\s*ETW000\\s*table\\s*description\\s*(${tableName})`, 'gi');
    const tableNameMatch = tableNameRegex.exec(line);
    if(tableNameMatch !== null){
        currentTable = tableNameMatch[1].trim();
    }
    return currentTable;
}

module.exports = (args) => {
    return new Promise((res, rej) => {
        const tableName = args.tableName;
        
        var fileStream;
        if(args.fileStream){
            fileStream = args.fileStream;
        }else{
            const logFilePath = args.logFilePath;
            if(!logFilePath){
                rej('Missing log file path');
            }
            fileStream = fs.createReadStream(logFilePath);
        }

        var tables = {};
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        var currentTable;
        rl.on('line', (line) => {
            if(!currentTable){
                currentTable = _searchTableRegex(line, tableName);
            }else{
                if(!line.includes('comment')){ //skip comments -> SG they might have column order
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
            }
        });

        rl.on('close', () => {
            res(tables);
        });
    });
}