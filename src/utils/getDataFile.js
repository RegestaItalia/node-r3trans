const fs = require('fs');

module.exports = (dataFilePath, tmpFolderPath, dataFileBuffer) => {
    var path;
    if(dataFilePath){
        path = dataFilePath;
    }else{
        const filePath = `${tmpFolderPath}/${Date.now()}`;
        fs.writeFileSync(filePath, dataFileBuffer);
        path = filePath;
    }
    return {
        getPath: () => {
            return path;
        },
        dispose: () => {
            if(!dataFilePath){
                fs.unlinkSync(path);
            }
        }
    }
}