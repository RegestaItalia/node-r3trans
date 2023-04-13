const fs = require('fs');
const readline = require('readline');

const _searchTableRegex = (line) => {
    var currentTable;
    const tableNameRegex = /^\d*\s*ETW000\s*REP(?:C)?\s*(\S*)/gi;
    const tableNameMatch = tableNameRegex.exec(line);
    if (tableNameMatch !== null) {
        currentTable = tableNameMatch[1].trim();
    }
    return currentTable;
}

const _getTableRowRegex = (tableName) => {
    if (tableName === 'TADIR') {
        return /^\d*\s*ETW000\s*(TADIRENTRY)\s*/gi;
    } else {
        return /^\d*\s*ETW000\s*\*\*\s*(\d*)\s*\*\*\s{1}/gi;
    }
}

const _getNumerator = (line, tableName) => {
    const tableRowRegex = _getTableRowRegex(tableName);
    const numeratorMatches = tableRowRegex.exec(line);
    try {
        return numeratorMatches[1];
    } catch (e) {
        return null;
    }
}

const _isTableRow = (tableName, numerator, line) => {
    const tableRowRegex = _getTableRowRegex(tableName);
    const lineNumerator = _getNumerator(line, tableName);
    if (numerator) {
        if (numerator === lineNumerator) {
            return tableRowRegex.test(line);
        } else {
            return false;
        }
    } else {
        return tableRowRegex.test(line);
    }
}

const _getTableRow = (line, tableName, tablesDescriptor) => {
    var record = {};
    if (tablesDescriptor[tableName]) {
        const tableDescriptor = tablesDescriptor[tableName];
        const tableRowRegex = _getTableRowRegex(tableName);
        var sTableRow = line.replace(tableRowRegex, '');
        for (const field of tableDescriptor.keys()) {
            const fieldLength = tableDescriptor.get(field);
            try {
                record[field] = sTableRow.substring(0, fieldLength).trim();
                sTableRow = sTableRow.slice(fieldLength);
            } catch (e) {
                throw new Error(`Reached the end of the line while parsing row of table ${tableName}.`);
            }
        }
        return record;
    } else {
        //throw new Error(`Table descriptor for ${tableName} not found.`);
    }
}

module.exports = (args) => {
    return new Promise((res, rej) => {
        const logFilePath = args.logFilePath;
        const tables = args.tables;
        if(!logFilePath){
            rej('Missing log file path');
        }
        if(!tables){
            rej('Missing table structure');
        }

        const fileStream = fs.createReadStream(logFilePath);
        var returnObject = {};
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        var currentTable = null;
        var currentNumerator = null;
        rl.on('line', (line) => {
            var tableRow;
            if (!currentTable) {
                if (line.includes('TADIRENTRY')) {
                    currentTable = 'TADIR';
                    tableRow = _getTableRow(line, currentTable, tables);
                } else {
                    currentTable = _searchTableRegex(line);
                }
            } else {
                if (_isTableRow(currentTable, currentNumerator, line)) {
                    if (!currentNumerator) {
                        currentNumerator = _getNumerator(line, currentTable);
                    }
                    tableRow = _getTableRow(line, currentTable, tables);
                } else {
                    currentTable = null;
                    currentNumerator = null;
                }
            }

            if (tableRow && currentTable) {
                if (!returnObject[currentTable]) {
                    returnObject[currentTable] = [];
                }
                returnObject[currentTable].push(tableRow);
            }
        });

        rl.on('close', () => {
            res(returnObject);
        });
    });
}