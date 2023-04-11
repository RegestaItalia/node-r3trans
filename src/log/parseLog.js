const fs = require('fs');
const readline = require('readline');
const getTableRecords = require('./parser/getTableRecords');

module.exports = async (logFilePath) => {
    const tables = await getTableRecords(logFilePath);
    return tables;
}