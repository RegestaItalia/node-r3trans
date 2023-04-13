# node-r3trans

Node.js wrapper for [SAP R3Trans](https://help.sap.com/docs/SOFTWARE_LOGISTICS_TOOLSET_CTS_PLUG-IN/05c12df5b54849c49940a14bc089d8b4/3dad5c974ebc11d182bf0000e829fbfe.html?locale=en-US).

## Installation
- Download the R3Trans program from [SAP Software Download Center](https://support.sap.com/en/my-support/software-downloads.html)
- Create a directory and extract its content
- Create a new PATH enviroment variable named R3TRANS_HOME, pointing at the directory that was created earlier
- Install node-r3trans

```shell
npm install node-r3trans
```
## Getting started
Start by importing the library and instantiating an object.
If your transport is in a folder, you can pass the path as a string, like this:
```javascript
const R3Trans = require('./index');
const transport = new R3Trans('C:\\R3Trans\\R904009.RST');
```
If your transport is a buffer:
```javascript
const R3Trans = require('./index');
const trBuffer = fs.readFileSync('C:\\R3Trans\\R904009.RST');
const transport = new R3Trans(trBuffer);
```
Optionally, you can also pass an object containing these values:
```javascript
const R3Trans = require('./index');
const transport = new R3Trans('C:\\R3Trans\\R904009.RST', {
    r3transHome: 'C:\\R3Trans' //Folder where R3Trans is placed, defaults to enviroment variable R3TRANS_HOME
    tmpFolderPath: 'C:\\R3Trans' //Folder where all temporary files are generated before being deleted, defaults to r3trans home. must have write access
});
```
## Examples
### Validate transport request
```javascript
const R3Trans = require('./index');
const transport = new R3Trans('C:\\R3Trans\\R904009.RST');
transport.isValid().then(valid => {
    if(valid){
        console.log('OK');
    }else{
        console.log('NOT VALID');
    }
}).catch(e => {
    console.error(e);
});
```
### List objects of a transport request
```javascript
const R3Trans = require('./index');
const transport = new R3Trans('C:\\R3Trans\\R904009.RST');
transport.getTableEntries('TADIR').then(objects => {
    console.log(JSON.stringify(objects.map(o => `${o.R3TR} ${o.OBJECT} ${o.OBJ_NAME}`)));
}).catch(e => {
    console.error(e);
});
```
### List all table entries of a transport request
```javascript
const R3Trans = require('./index');
const transport = new R3Trans('C:\\R3Trans\\R904009.RST');
transport.getTableEntries().then(objects => {
    console.log(JSON.stringify(objects.map(o => `${o.R3TR} ${o.OBJECT} ${o.OBJ_NAME}`)));
}).catch(e => {
    console.error(e);
});
```