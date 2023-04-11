const fs = require('fs');
module.exports = (logFilePath) => {
    if(!logFilePath){
        throw new Error('Missing parameter logFilePath');
    }
    fs.unlinkSync(logFilePath);
}