import { R3transDockerOptions } from "./R3transDockerOptions"

export type R3transOptions = {
    r3transDirPath?: string,
    tempDirPath?: string,
    useDocker?: boolean,
    dockerOptions?: R3transDockerOptions
}