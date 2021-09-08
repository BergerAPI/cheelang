import { AstTree } from "../parser";
import CodeFile from "./file";

enum CodeTypes {
    INT = "int",
    STRING = "string",
    CHAR = "char"
}

enum IncludeType {
    SYSTEM,
    DEFAULT
}

/**
 * A basic c++ function argument.
 */
export class FunctionArgument {
    name: string;
    type: CodeTypes;

    /**
     * Some informations, that are good to know
     * @example int main(int argc, char *argv[])
     */
    hasPointer: boolean;
    isArray: boolean;

    constructor(
        name: string,
        type: CodeTypes,
        pointer: boolean = false,
        array: boolean = false
    ) {
        this.name = name;
        this.type = type;
        this.hasPointer = pointer;
        this.isArray = array;
    }

    toString() {
        return this.type + " " + (this.hasPointer ? "*" : "") + this.name + (this.hasPointer ? "[]" : "")
    }
}

/**
 * This converts json ast to thingy c++ code
 */
export class Generator {

    /**
     * We need information about this little pog thingy
     */
    ast: AstTree;

    /**
     * Here we store the current file.
     */
    content: string[] = [];

    /**
     * Where we currently are.
     */
    line: number = 0;

    /**
     * Where to save everything
     */
    currentFile: CodeFile;

    constructor(ast: AstTree) {
        this.ast = ast;
        this.currentFile = new CodeFile("main")
    }

    /**
     * Adds some lines.
     */
    addLines(lines: string[]) {
        for (let lineContent of lines) {
            this.content.push(lineContent)

            this.line++;
        }
    }

    /**
     * Including something.
     * @param name the name of the thing to include
     */
    include(name: string, type: IncludeType) {
        this.addLines(['#include ' + (type == IncludeType.DEFAULT ? '"' : "<") + name + (type == IncludeType.DEFAULT ? '"' : ">")],)
    }

    /**
     * Adds a function to the current file.
     * 
     * @param name the name of the function
     * @param type the return type of the function
     * 
     * @example name -> main, type -> int
     *          =
     *          int main() {...}
     */
    addFunction(name: string, type: CodeTypes, rArgs: FunctionArgument[]) {
        // Building the arguments
        let args = ""

        rArgs.forEach((item) => {
            args += item.toString() + ", ";
        })

        args = args.slice(0, -2);

        // Adding the generated lines.
        this.addLines(
            [
                type + " " + name + "(" + args + ")",
                "{",
                ' std::cout << "test" << std::endl;',
                "}"
            ],
        )
    }

    /**
     * We want to full c++ code like cool thingys
     */
    toString() {
        return this.content
    }

    /**
     * Here happens the magic. pog
     */
    work() {
        this.include("iostream", IncludeType.SYSTEM)

        this.addFunction("main", CodeTypes.INT, [
            new FunctionArgument("argc", CodeTypes.INT, false, false),
            new FunctionArgument("argv", CodeTypes.CHAR, true, true)
        ])

        this.currentFile.save(this.content.join("\n"), "")
    }
}