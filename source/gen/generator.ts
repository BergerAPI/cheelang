import { AstNode, AstTree, BooleanLiteralNode, CallExpressionNode, CodeBlockNode, ExpressionNode, FunctionDeclarationNode, IfStatementNode, IntegerLiteralNode, StringLiteralNode, UnaryNode, VariableAssignmentNode, VariableDeclarationNode, VariableReferenceNode, WhileStatementNode } from "../parser";
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
            return (node as IntegerLiteralNode).value.toString();

        case "StringLiteralNode":
            return (node as StringLiteralNode).value.toString();

        case "VariableReferenceNode":
            return (node as VariableReferenceNode).variableName;
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

class CodeVariableAssignment implements CodePart {
    name: string = "VariableAssignment"
    requiresEnd: boolean = true

    constructor(public variableName: string, public variableValue: AstNode) { }

    toString(): string {
        return `${this.variableName} = ${expression(this.variableValue)};`
    }
}

/**
 * Generating a c++ function.
 */
class CodeFunctionDeclaration implements CodePart {
    name: string = "FunctionDeclaration"
    requiresEnd: boolean = false

    constructor(public functionName: string, public functionArgs: AstNode[], public functionCode: CodeBlock, public returnType: string) { }

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

    /**
     * Generates a scope.
     */
    generateScope(block: CodeBlockNode): CodeBlock {
        const generatedScope = new CodeBlock();

        block.nodes.forEach(node => {
            if (node instanceof FunctionDeclarationNode)
                generatedScope.sequence.push(new CodeFunctionDeclaration(node.functionName, node.args, this.generateScope(node.block), node.returnType))

            if (node instanceof VariableDeclarationNode)
                generatedScope.sequence.push(new CodeVariableDeclaration(VariableTypes[Object.keys(VariableTypes).filter(e => e == node.variableType.toUpperCase())[0] as keyof typeof VariableTypes], node.variableName, node.variableValue))

            if (node instanceof VariableAssignmentNode)
                generatedScope.sequence.push(new CodeVariableAssignment(node.variableName, node.variableValue))

            if (node instanceof CallExpressionNode)
                generatedScope.sequence.push(new CodeCallExpression(node.functionName, node.args, node.integrated))
        })

        return generatedScope
    }

    /**
     * Here happens the magic.
     */
    work() {
        const generatedCode = this.generateScope(this.tree.block);

        // Global scope!
        generatedCode.sequence.unshift(new CodeInclude("iostream"))

        // Generating the file. (pog we finished this shit)
        const dir = "output/bin"

        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true })

        fs.writeFileSync(dir + "/main.cpp", generatedCode.toString())
    }
}