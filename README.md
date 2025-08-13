# node-r3trans
![npm](https://img.shields.io/npm/l/node-r3trans)
![npm](https://img.shields.io/npm/v/node-r3trans)

NodeJs wrapper for [SAP R3trans](https://help.sap.com/docs/SOFTWARE_LOGISTICS_TOOLSET_CTS_PLUG-IN/05c12df5b54849c49940a14bc089d8b4/3dad5c974ebc11d182bf0000e829fbfe.html?locale=en-US).

## Installation
- Download the R3trans program from [SAP Software Download Center](https://support.sap.com/en/my-support/software-downloads.html)
- Create a directory and extract its content
- Create a new PATH enviroment variable named R3TRANS_HOME, pointing at the directory that was created earlier
- Install node-r3trans

```shell
npm install node-r3trans
```

## Docker support
For operating systems (e.g. MacOS) that don't support R3trans, support for dockerized R3trans program is now available (since version 2.0.0).

### Docker Image build
- Download the R3trans program from [SAP Software Download Center](https://support.sap.com/en/my-support/software-downloads.html)
- Create a directory and extract its content in a folder named "r3trans"
- Create a Dockerfile inside the root folder (you should now have Dockerfile and the r3trans folder created earlier)
- Paste this inside the Dockerfile
```dockerfile
FROM --platform=linux/amd64 debian:bookworm-slim AS collector

COPY r3trans /r3trans
RUN chmod +x /r3trans/R3trans

RUN set -eux; \
    mkdir -p /deps; \
    echo "Deps for R3trans:"; ldd /r3trans/R3trans; \
    ldd /r3trans/R3trans \
      | awk '($2 == "=>") {print $3} ($1 ~ /^\//) {print $1}' \
      | sort -u \
      | xargs -I '{}' cp -v --parents '{}' /deps

FROM --platform=linux/amd64 gcr.io/distroless/base-debian12

COPY --from=collector /r3trans /r3trans
COPY --from=collector /deps/ /

ENV LD_LIBRARY_PATH=/r3trans:/usr/lib/x86_64-linux-gnu:/lib/x86_64-linux-gnu

ENTRYPOINT ["/r3trans/R3trans"]
```
- Go in the root folder and run this command to build the docker image
```shell
docker buildx build --platform=linux/amd64 -t local/r3trans:latest .
```

### Usage with dockerized R3trans
Make sure to flag the docker usage in the R3trans constructor:
```javascript
import { R3trans } from "node-r3trans";
const r3trans = new R3trans({
    useDocker: true
});
r3trans.getVersion().then(version => {
    console.log(version);
}).catch(err => {
    console.error(err);
});
```

## Getting started

Start by testing if the R3trans program is installed correctly and print out its version.
```javascript
import { R3trans } from "node-r3trans";
const r3trans = new R3trans({
    r3transDirPath: "", //Optional, can be used instead of the R3TRANS_HOME enviroment variable
    tempDirPath: "", //Optional, the R3trans program will generate temporary files, and this folder indicates where they shall be generated. If left blank, defaults to the R3trans program dir path
});
r3trans.getVersion().then(version => {
    console.log(version);
}).catch(err => {
    console.error(err);
});
```
### Transports

A transport data file can always be passed to the instance object methods as a buffer or a string file path.

#### To verify a transport data file is valid:
```javascript
r3trans.isTransportValid(buffer).then(valid => {
    console.log("valid", valid);
}).catch(err => {
    console.error(err);
});
```
#### Get the R3trans log as a buffer
```javascript
r3trans.getLogBuffer(buffer, 2).then(log => {
    console.log(log.toString());
}).catch(err => {
    console.error(err);
});
```
#### Get transport number
```javascript
r3trans.getTransportTrkorr(buffer).then(trkorr => {
    console.log("trkorr", trkorr);
}).catch(err => {
    console.error(err);
});
```
#### Get table entries
```javascript
r3trans.getTableEntries(buffer, "TADIR").then(tadir => {
    console.log("tadir", tadir);
}).catch(err => {
    console.error(err);
});
```