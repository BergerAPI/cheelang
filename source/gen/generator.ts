import { AstNode, AstTree, BooleanLiteralNode, CallExpressionNode, CodeBlockNode, ExpressionNode, FunctionDeclarationNode, FunctionParameterNode, FunctionReturnNode, IfStatementNode, NumberLiteralNode, StringLiteralNode, UnaryNode, VariableAssignmentNode, VariableDeclarationNode, VariableReferenceNode, WhileStatementNode } from "../parser";
import fs from "fs"

export enum VariableTypes {
    INT = "int",
    FLOAT = "float",
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
    * From code to expression (ast) and then to code again.
    */
function expression(node: AstNode): string {
    switch (node.name) {
        case "ExpressionNode": {
            let typeNode = node as ExpressionNode

            return "(" + expression(typeNode.left) + " " + typeNode.operator + " " + expression(typeNode.right) + ")"
        };

        case "UnaryNode": {
            let typeNode = node as UnaryNode

            return typeNode.operator + expression(typeNode.operand)
        }

        case "BooleanLiteralNode":
            return (node as BooleanLiteralNode).value.toString();

        case "IntegerLiteralNode":
            return (node as NumberLiteralNode).value.toString();

        case "StringLiteralNode":
            return (node as StringLiteralNode).value.toString();

        case "VariableReferenceNode":
            return (node as VariableReferenceNode).variableName;

        case "CallExpressionNode":
            return (node as CallExpressionNode).functionName + "(" + (node as CallExpressionNode).args.map(expression).join(", ") + ")";
    }

    return ""
}

/**
 * General c++ code.
 */
interface CodePart {
    name: string,
    requiresEnd: boolean
}

/**
 * Generating a c++ variable.
 */
class CodeVariableDeclaration implements CodePart {
    name: string = "VariableDeclaration"
    requiresEnd: boolean = true

    constructor(public variableType: VariableTypes, public variableName: string, public variableValue: AstNode) { }

    toString(): string {
        return `${this.variableType} ${this.variableName} = ${expression(this.variableValue)}`
    }
}

/**
 * Editing a c++ variable.
 */
class CodeVariableAssignment implements CodePart {
    name: string = "VariableAssignment"
    requiresEnd: boolean = true

    constructor(public variableName: string, public variableValue: AstNode) { }

    toString(): string {
        return `${this.variableName} = ${expression(this.variableValue)}`
    }
}

class CodeFunctionParameter implements CodePart {
    name: string = "FunctionParameter"
    requiresEnd: boolean = false

    constructor(public variableType: VariableTypes, public variableName: string) { }

    toString(): string {
        return `${this.variableType} ${this.variableName}`
    }
}

/**
 * Generating a c++ function.
 */
class CodeFunctionDeclaration implements CodePart {
    name: string = "FunctionDeclaration"
    requiresEnd: boolean = false

    constructor(public functionName: string, public functionArgs: CodePart[], public functionCode: CodeBlock, public returnType: string) { }

    toString(): string {
        let args = this.functionArgs.map(arg => arg.toString()).join(", ")
        return `${this.returnType} ${this.functionName}(${args}) {
                    ${this.functionCode.toString()}
                }`
    }
}

/**
 * Including some shit in the c++ code.
 */
class CodeInclude implements CodePart {
    name: string = "Include"
    requiresEnd: boolean = false

    constructor(public path: string) { }

    toString(): string {
        return `#include "${this.path}"`
    }
}

class CodeCallExpression implements CodePart {
    name: string = "CallExpression"
    requiresEnd: boolean = true

    constructor(public functionName: string, public args: AstNode[], public integrated: boolean) { }

    toString(): string {
        if (!this.integrated)
            return `${this.functionName}(${this.args.map(arg => expression(arg)).join(", ")})`
        else {
            const integratedFunction = integratedFunctions[this.functionName as keyof typeof integratedFunctions]
            let value = integratedFunction.value.toString();

            this.args.forEach((item, index) => value = integratedFunction.value.replace("$" + (index + 1), expression(item)))

            return value
        }
    }
}

class CodeWhileStatement implements CodePart {
    name: string = "WhileStatement"
    requiresEnd: boolean = false

    constructor(public condition: AstNode, public code: CodeBlock) { }

    toString(): string {
        return `while (${expression(this.condition)}) {
                    ${this.code.toString()}
                }`
    }
}

class CodeIfStatement implements CodePart {
    name: string = "IfStatement"
    requiresEnd: boolean = false

    constructor(public condition: AstNode, public code: CodeBlock) { }

    toString(): string {
        return `if (${expression(this.condition)}) {
                    ${this.code.toString()}
                }`
    }
}

class CodeReturnStatement implements CodePart {
    name: string = "ReturnStatement"
    requiresEnd: boolean = true

    constructor(public value: AstNode) { }

    toString(): string {
        return `return ${this.value.name != "NoneNode" ? expression(this.value) : ""}`
    }
}

class HeaderFunctiondDeclaration implements CodePart {
    name: string = "FunctionDeclaration"
    requiresEnd: boolean = true

    constructor(public functionName: string, public functionArgs: CodePart[], public returnType: string) { }

    toString(): string {
        let args = this.functionArgs.map(arg => arg.toString()).join(", ")
        return `${this.returnType} ${this.functionName}(${args})`
    }
}

/**
 * A bunch of certain parts which turn themselfs to code.
 */
class CodeBlock {
    sequence: CodePart[] = []

    toString(): string {
        return this.sequence.map(code => code.toString() + (code.requiresEnd ? ";" : "")).join("\n\n")
    }
}

/**
 * A basic file (that other files can include due to header files)
 */
class CodeFile {

}

/**
 * Magic!
 */
export class Generator {
    /**
     * The AST tree.
     */
    private tree: AstTree

    constructor(tree: AstTree) {
        this.tree = tree
    }

    toCodeType(type: string): VariableTypes {
        return VariableTypes[Object.keys(VariableTypes).filter(e => e == type.toUpperCase())[0] as keyof typeof VariableTypes]
    }

    /**
     * Generates a scope.
     */
    generateScope(block: CodeBlockNode): CodeBlock {
        const generatedScope = new CodeBlock();

        block.nodes.forEach(node => {
            if (node instanceof FunctionDeclarationNode)
                generatedScope.sequence.push(new CodeFunctionDeclaration(node.functionName, node.args.map(item => {
                    const casted = item as FunctionParameterNode

                    return new CodeFunctionParameter(this.toCodeType(casted.variableType), casted.variableName)
                }), this.generateScope(node.block), this.toCodeType(node.returnType)))

            if (node instanceof VariableDeclarationNode)
                generatedScope.sequence.push(new CodeVariableDeclaration(VariableTypes[Object.keys(VariableTypes).filter(e => e == node.variableType.toUpperCase())[0] as keyof typeof VariableTypes], node.variableName, node.variableValue))

            if (node instanceof VariableAssignmentNode)
                generatedScope.sequence.push(new CodeVariableAssignment(node.variableName, node.variableValue))

            if (node instanceof WhileStatementNode)
                generatedScope.sequence.push(new CodeWhileStatement(node.condition, this.generateScope(node.block)))

            if (node instanceof IfStatementNode)
                generatedScope.sequence.push(new CodeIfStatement(node.condition, this.generateScope(node.block)))

            if (node instanceof CallExpressionNode)
                generatedScope.sequence.push(new CodeCallExpression(node.functionName, node.args, node.integrated))

            if (node instanceof FunctionReturnNode)
                generatedScope.sequence.push(new CodeReturnStatement(node.value))
        })

        return generatedScope
    }

    /**
     * Generates the c++ header codes.
     */
    generateHeader(block: CodeBlockNode): CodeBlock {
        const header = new CodeBlock();

        header.sequence.push(new CodeInclude("iostream"))
        header.sequence.push(new CodeInclude("vector"))
        header.sequence.push(new CodeInclude("string"))

        block.nodes.forEach(node => {
            if (node instanceof FunctionDeclarationNode)
                header.sequence.push(new HeaderFunctiondDeclaration(node.functionName, node.args.map(item => {
                    const casted = item as FunctionParameterNode

                    return new CodeFunctionParameter(this.toCodeType(casted.variableType), casted.variableName)
                }), this.toCodeType(node.returnType)))
        });

        return header
    }

    /**
     * Here happens the magic.
     */
    work(name: string) {
        const generatedCode = this.generateScope(this.tree.block);
        const headerCode = this.generateHeader(this.tree.block);

        // Global scope!
        generatedCode.sequence.unshift(new CodeInclude(name + ".h"))

        // Generating the file. (pog we finished this shit)
        const dir = "output/bin"

        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true })

        fs.writeFileSync(dir + "/" + name + ".cpp", generatedCode.toString())
        fs.writeFileSync(dir + "/" + name + ".h", headerCode.toString())
    }
}