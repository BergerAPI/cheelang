import { AstNode, AstTree, BooleanLiteralNode, CallExpressionNode, CodeBlockNode, ExpressionNode, IfStatementNode, IntegerLiteralNode, StringLiteralNode, UnaryNode, VariableAssignmentNode, VariableDeclarationNode, VariableReferenceNode } from "../parser";
import CodeFile from "./file";

enum VariableTypes {
    INT = "int",
    STRING = "std::string",
    CHAR = "char",
    AUTO = "auto"
}

enum IncludeType {
    SYSTEM,
    DEFAULT
}

let integratedFunctions = {
    "println": { requiredArguments: 1, value: "std::cout << $1 << std::endl" },
    "input": { requiredArguments: 1, value: "std::cin >> $1" },
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
    addLines(...lines: string[]) {
        for (let lineContent of lines) {
            this.content.push(lineContent)
            this.line++;
        }

        this.content.push("")
    }

    /**
     * Pog! If something = true, then do something
     */
    ifStatement(node: IfStatementNode) {
        return "if (" + this.expression(node.condition) + ") \n" + "{ \n" + this.codeBlock(node.block).join("\n") + "\n}";
    }

    /**
     * A Ast-Code-Block-Node to code :sunglasses:
     */
    codeBlock(item: CodeBlockNode): string[] {
        let result: string[] = []

        // Running everything. pog
        item.nodes.forEach(node => {
            switch (node.name) {
                case "VariableDeclarationNode":
                    result.push(this.variableDeclaration(node as VariableDeclarationNode))
                    break;

                case "ExpressionNode":
                    result.push(this.expression(node))
                    break;

                case "IfStatementNode":
                    result.push(this.ifStatement(node as IfStatementNode))
                    break;

                case "VariableAssignmentNode":
                    result.push(this.variableAssignment(node as VariableAssignmentNode))
                    break;

                case "CallExpressionNode":
                    result.push(this.callExpression(node as CallExpressionNode))
                    break;
            }
        })

        return result.map(item => item + ";")
    }

    /**
     * From AST-Variable-Declaration-Node to c++ code.
     */
    variableDeclaration(node: VariableDeclarationNode) {
        let type = VariableTypes[Object.keys(VariableTypes).filter(e => e == node.variableType.toUpperCase())[0] as keyof typeof VariableTypes]

        return type + " " + node.variableName + " = " + this.expression(node.variableValue)
    }

    /**
     * From AST-Variable-Declaration-Node to c++ code.
     */
    variableAssignment(node: VariableAssignmentNode) {
        return node.variableName + " = " + this.expression(node.variableValue)
    }

    /**
     * Calling a function (pog)
     * @param node the node
     * @returns the c++ code
     */
    callExpression(node: CallExpressionNode) {
        if (node.integrated) {
            const integratedFunction = integratedFunctions[node.functionName as keyof typeof integratedFunctions]
            let value = integratedFunction.value.toString();

            node.args.forEach((item, index) => value = integratedFunction.value.replace("$" + (index + 1), this.expression(item)))

            if (node.args.length != integratedFunction.requiredArguments)
                throw new Error("functions " + node.functionName + " requires " + integratedFunction.requiredArguments + " arguments")

            return value
        }

        return node.functionName + "(" + node.args.map(arg => this.expression(arg)).join(", ") + ")"
    }

    /**
     * From code to expression (ast) and then to code again.
     */
    expression(node: AstNode): string {
        switch (node.name) {
            case "ExpressionNode": {
                let typeNode = node as ExpressionNode

                return "(" + this.expression(typeNode.left) + " " + typeNode.operator + " " + this.expression(typeNode.right) + ")"
            }

            case "UnaryNode": {
                let typeNode = node as UnaryNode

                return typeNode.operator + this.expression(typeNode.operand)
            }

            case "BooleanLiteralNode":
                return (node as BooleanLiteralNode).value.toString();

            case "IntegerLiteralNode":
                return (node as IntegerLiteralNode).value.toString();

            case "StringLiteralNode":
                return (node as StringLiteralNode).value.toString();

            case "VariableReferenceNode":
                return (node as VariableReferenceNode).variableName;
        }

        return ""
    }

    /**
     * Including something.
     * @param name the name of the thing to include
     * @param type
     */
    include(name: string, type: IncludeType) {
        this.addLines('#include ' + (type == IncludeType.DEFAULT ? '"' : "<") + name + (type == IncludeType.DEFAULT ? '"' : ">"))
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
    addFunction(name: string, type: VariableTypes, rArgs: FunctionArgument[], content: string[], docs: string[] = []) {
        // Building the arguments
        let args = rArgs.map(item => item.toString()).join(", ")

        // Adding the generated lines.
        this.addLines(...docs.map(item => "// " + item), type + " " + name + "(" + args + ")", "{", ...content, "}")
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
        // We are in the global scope here.

        this.include("iostream", IncludeType.SYSTEM)

        this.addFunction("main", VariableTypes.INT, [
            new FunctionArgument("argc", VariableTypes.INT, false, false),
            new FunctionArgument("argv", VariableTypes.CHAR, true, true)
        ], this.codeBlock(this.ast.block), ["Simple main function. I mean, what did you expect?"])

        this.currentFile.save(this.content.join("\n"), "")
    }
}