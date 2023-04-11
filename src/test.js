const getTransportContents = require("./getTransportContents")

const main = async() => {
    const parsedLog = await getTransportContents({
        dataFilePath: 'C:\\R3Trans\\R904009.RST'
    });
    debugger
}

main().then(() => {
    debugger
}).catch(e => {
    debugger
})