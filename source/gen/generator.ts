import { AstNode, AstTree, BooleanLiteralNode, CallExpressionNode, CodeBlockNode, ExpressionNode, IfStatementNode, IntegerLiteralNode, StringLiteralNode, UnaryNode, VariableAssignmentNode, VariableDeclarationNode, VariableReferenceNode, WhileStatementNode } from "../parser";
import fs from "fs"

export enum VariableTypes {
    INT = "int",
    STRING = "std::string",
    CHAR = "char",
    AUTO = "auto"
}

/**
 * The pre-defined functions.
 */
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
}

interface CodePart {
}

/**
 * A basic c++ function.
 */
export class CodeFunction implements CodePart {
    functionName: string;
    args: FunctionArgument[] = [];
    returnType: VariableTypes;
    codeBlock: CodeBlockNode;

    constructor(name: string, returnType: VariableTypes, args: FunctionArgument[], codeBlock: CodeBlockNode) {
        this.functionName = name;
        this.returnType = returnType;
        this.codeBlock = codeBlock;
        this.args = args;
    }
}

/**
 * A basic c++ variable.
 */
export class CodeVariable implements CodePart {
    name: string;
    type: VariableTypes;
    value: ExpressionNode;

    constructor(name: string, type: VariableTypes, value: ExpressionNode) {
        this.name = name;
        this.type = type;
        this.value = value;
    }
}

/**
 * A basic c++ class.
 */
export class CodeClass implements CodePart {
    name: string;
    variables: CodeVariable[] = [];
    functions: CodeFunction[] = [];

    constructor(name: string) {
        this.name = name;
    }
}

/**
 * Including something cool.
 */
class CodeInclude implements CodePart {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    toString() {
        return `#include "${this.name}"`
    }
}

/**
 * A basic c++ file (with a header.).
 */
class CodeFile {

    /**
     * Every include, class, function etc.
     */
    sequence: CodePart[] = [];

    /**
     * The name of the file.
     */
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Pog! If something = true, then do something
     */
    ifStatement(node: IfStatementNode) {
        return "if (" + this.expression(node.condition) + ") \n" + "{ \n" + this.codeBlock(node.block).join("\n") + "\n} else { \n" + this.codeBlock(node.elseBlock).join("\n") + "\n}";
    }

    /**
     * A basic while statement (pog)
     * @param node the node
     */
    whileStatement(node: WhileStatementNode) {
        return "while (" + this.expression(node.condition) + ") \n" + "{ \n" + this.codeBlock(node.block).join("\n") + "\n}";
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

                case "WhileStatementNode":
                    result.push(this.whileStatement(node as WhileStatementNode))
                    break;

                case "BreakStatementNode":
                    result.push("break")
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
            let value = "" + integratedFunction.value;

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
            };

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
     * Transforming the code part into their real type and then to string.
     * 
     * @note I can't put this into the "toString" method, because then 
     *       I would have to pass the sequence for almost every method
     * @returns the CodePart as string.
     */
    transformPart(part: CodePart) {
        if (part instanceof CodeFunction)
            return `${part.returnType} ${part.functionName}(${part.args.map(a => a.toString()).join(", ")}) {
                ${this.codeBlock(part.codeBlock).join("\n")}
            }`

        if (part instanceof CodeVariable)
            return `${part.type} ${part.name} = ${this.expression(part.value)}`

        if (part instanceof CodeInclude)
            return `#include "${part.name}"`

        throw new Error("Unknown part");
    }

    toString() {
        return this.sequence.map(x => this.transformPart(x)).join("\n\n");
    }

    save() {
        const dir = "output/bin"

        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true })

        fs.writeFileSync(dir + "/" + this.name + ".cpp", this.toString())
    }
}

export class Generator {

    /**
     * We need information about this little pog thingy
     */
    ast: AstTree;

    /**
     * Everything to c++ code.
     */
    code: CodeFile;

    constructor(ast: AstTree) {
        this.ast = ast;
        this.code = new CodeFile("main")
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
     * Here happens the magic.
     */
    work() {
        // We are in the global scope here.

        this.include("iostream")

        this.addFunction("main", VariableTypes.INT, [
            new FunctionArgument("argc", VariableTypes.INT, false, false),
            new FunctionArgument("argv", VariableTypes.CHAR, true, true)
        ], this.ast.block)


    }
}