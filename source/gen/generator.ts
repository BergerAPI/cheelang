import { AstTree } from "../parser";

enum CodeTypes {
    INT = "int",
    STRING = "string",
    CHAR = "char"
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

    constructor(ast: AstTree) {
        this.ast = ast;
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
                " ",
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
        this.addFunction("main", CodeTypes.INT, [
            new FunctionArgument("argc", CodeTypes.INT, false, false),
            new FunctionArgument("argv", CodeTypes.CHAR, true, true)
        ])
    }
}