const fs = require('fs');
const path = require('path');

module.exports = (dataFilePath, tmpFolderPath, dataFileBuffer) => {
    var filePath;
    if(dataFilePath){
        filePath = dataFilePath;
    }else{
        filePath = path.join(tmpFolderPath, Date.now().toString());
        fs.writeFileSync(filePath, dataFileBuffer);
    }
    return {
        getPath: () => {
            return filePath;
        },
        dispose: () => {
            if(!dataFilePath){
                fs.unlinkSync(filePath);
            }
        }
    }
}