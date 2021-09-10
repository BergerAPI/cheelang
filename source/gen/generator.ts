import { AstTree, CodeBlockNode, ExpressionNode } from "../parser";
import * as funcs from "./func";
import fs from "fs"

export enum VariableTypes {
    INT = "int",
    STRING = "std::string",
    CHAR = "char",
    AUTO = "auto"
}

/**
 * A basic c++ function argument.
 */
export class FunctionArgument {
    name: string;
    type: VariableTypes;

    /**
     * Some informations, that are good to know
     * @example int main(int argc, char *argv[])
     */
    hasPointer: boolean;
    isArray: boolean;

    constructor(
        name: string,
        type: VariableTypes,
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
 * A basic c++ function.
 */
export class CodeFunction {
    name: string;
    args: FunctionArgument[] = [];
    returnType: VariableTypes;
    codeBlock: CodeBlockNode;

    constructor(name: string, returnType: VariableTypes, args: FunctionArgument[], codeBlock: CodeBlockNode) {
        this.name = name;
        this.returnType = returnType;
        this.codeBlock = codeBlock;
        this.args = args;
    }

    toString() {
        return `${this.returnType} ${this.name}(${this.args.map(a => a.toString()).join(", ")}) {
            ${funcs.codeBlock(this.codeBlock).join("\n")}
        }`
    }
}

/**
 * A basic c++ variable.
 */
export class CodeVariable {
    name: string;
    type: VariableTypes;
    value: ExpressionNode;

    constructor(name: string, type: VariableTypes, value: ExpressionNode) {
        this.name = name;
        this.type = type;
        this.value = value;
    }

    toString() {
        return `${this.type} ${this.name} = ${this.value.toString()};`
    }
}

/**
 * A basic c++ class.
 */
export class CodeClass {
    name: string;
    variables: CodeVariable[] = [];
    functions: CodeFunction[] = [];

    constructor(name: string) {
        this.name = name;
    }

    toString() {
        return `class ${this.name} {
            ${this.variables.map(v => v.toString()).join("\n")}
            ${this.functions.map(f => f.toString()).join("\n")}
        }`
    }
}

class CodeInclude {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    toString() {
        return `#include "${this.name}"`
    }
}

/**
 * .cpp and .h files are generated from this class.
 */
export class File {
    /**
     * The name of the file.
     */
    name: string;

    /**
     * The functions, classes and variables of this class
     */
    sequence: any[] = [];

    constructor(name: string = "main") {
        this.name = name;
    }

    save() {
        const dir = "output/bin"

        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true })

        fs.writeFileSync(dir + "/" + this.name + ".cpp", this.generateMainFile())
    }

    generateMainFile() {
        return `${this.sequence.map(s => {
            return s.toString();
        }).join("\n\n")}`
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
     * Everything to c++ code.
     */
    code: File;

    constructor(ast: AstTree) {
        this.ast = ast;
        this.code = new File("main")
    }

    /**
     * Including something.
     * @param name the name of the thing to include
     */
    include(name: string) {
        this.code.sequence.push(new CodeInclude(name))
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
    addFunction(name: string, type: VariableTypes, rArgs: FunctionArgument[], code: CodeBlockNode) {
        // Adding the generated lines.
        this.code.sequence.push(new CodeFunction(name, type, rArgs, code))
    }

    /**
     * Here happens the magic. pog
     */
    work() {
        // We are in the global scope here.

        this.include("iostream")

        this.addFunction("main", VariableTypes.INT, [
            new FunctionArgument("argc", VariableTypes.INT, false, false),
            new FunctionArgument("argv", VariableTypes.CHAR, true, true)
        ], this.ast.block)

        this.code.save()
    }
}