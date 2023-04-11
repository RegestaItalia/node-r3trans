# node-r3trans

Node.js wrapper for [SAP R3Trans](https://help.sap.com/docs/SOFTWARE_LOGISTICS_TOOLSET_CTS_PLUG-IN/05c12df5b54849c49940a14bc089d8b4/3dad5c974ebc11d182bf0000e829fbfe.html?locale=en-US).

## Installation
- Download the R3Trans program from [SAP Software Download Center](https://support.sap.com/en/my-support/software-downloads.html)
- Create a directory and extract its content
- Create a new PATH enviroment variable named R3TRANS_HOME, pointing at the directory that was created earlier
- Install node-r3trans

## Examples
### List content of a transport request
```javascript
const { getTransportContents } = require('node-r3trans');

getTransportContents({
    dataFilePath: 'C:\\R934291.A4H'
}).then(res => {
    console.log(JSON.stringify(res.tableRecords.TADIR.map(o => o.PGMID + ' ' + o.OBJECT + ' ' + o.OBJ_NAME)));
}).catch(e => {
    console.error(e);
});
```
Outputs:
```javascript
["R3TR DEVC ZSAMPLE_PACKAGE","R3TR CLAS ZTEST_CLAS","R3TR DOMA ZMY_DOMAIN"]
```