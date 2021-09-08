import fs from "fs"

export default class CodeFile {
    name: string

    constructor(name: string) {
        this.name = name
    }

    save(content: string, headerContent: string){
        fs.writeFileSync(this.name + ".cpp", content)
        fs.writeFileSync(this.name + ".h", headerContent)
    }
}