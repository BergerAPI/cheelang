import fs from "fs"

export default class CodeFile {
    name: string

    constructor(name: string) {
        this.name = name
    }

    save(content: string, headerContent: string) {
        const dir = "output"
        fs.mkdirSync(dir)
        fs.writeFileSync(dir + "/" + this.name + ".cpp", content)
        fs.writeFileSync(dir + "/" + this.name + ".h", headerContent)
    }
}