import fs from "fs"

export default class CodeFile {
    name: string

    constructor(name: string) {
        this.name = name
    }

    save(content: string, headerContent: string) {
        const dir = "output/bin"

        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true })

        fs.writeFileSync(dir + "/" + this.name + ".cpp", content)
        fs.writeFileSync(dir + "/" + this.name + ".h", headerContent)
    }
}