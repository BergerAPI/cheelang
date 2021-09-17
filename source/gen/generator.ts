import { AstNode, AstTree, BooleanLiteralNode, CallExpressionNode, ClassDeclarationNode, CodeBlockNode, ExpressionNode, FunctionDeclarationNode, FunctionParameterNode, FunctionReturnNode, IfStatementNode, NamespaceDeclarationNode, NamespaceReferenceNode, NewStatementNode, NumberLiteralNode, PropertyAccessNode, StringLiteralNode, UnaryNode, UseStatementNode, VariableAssignmentNode, VariableDeclarationNode, VariableReferenceNode, WhileStatementNode } from "../parser";
import fs from "fs"

export enum VariableTypes {
    INT = "int",
    FLOAT = "float",
    STRING = "std::string",
    CHAR = "char",
    AUTO = "auto",
    VOID = "void"
}

/**
 * The pre-defined functions.
 */
let integratedFunctions = {
    "println": { requiredArguments: 1, value: "std::cout << $1 << std::endl" },
    "input": { requiredArguments: 1, value: "std::cin >> $1" },
    "system": { requiredArguments: 1, value: "std::system($1)" }
}

function generateCodePart(node: AstNode): CodePart {
    if (node instanceof FunctionDeclarationNode)
        return new CodeFunctionDeclaration(node.functionName, node.args.map(item => {
            const casted = item as FunctionParameterNode

            return new CodeFunctionParameter(toCodeType(casted.variableType), casted.variableName)
        }), generateScope(node.block), toCodeType(node.returnType));

    if (node instanceof VariableDeclarationNode)
        return new CodeVariableDeclaration(VariableTypes[Object.keys(VariableTypes).filter(e => e == node.variableType.toUpperCase())[0] as keyof typeof VariableTypes], node.variableName, node.variableValue);

    if (node instanceof ExpressionNode)
        return new CodeNone("(" + generateCodePart(node.left) + " " + node.operator + " " + generateCodePart(node.right) + ")")

    if (node instanceof UnaryNode)
        return new CodeNone("(" + node.operator + generateCodePart(node.operand) + ")")

    if (node instanceof BooleanLiteralNode)
        return new CodeNone(node.value.toString())

    if (node instanceof StringLiteralNode)
        return new CodeNone(node.value.toString())

    if (node instanceof NumberLiteralNode)
        return new CodeNone(node.value.toString())

    if (node instanceof VariableReferenceNode)
        return new CodeNone(node.variableName)

    if (node instanceof PropertyAccessNode)
        return new CodeNone(node.property + "->" + generateCodePart((node as PropertyAccessNode).object))

    if (node instanceof VariableAssignmentNode)
        return new CodeVariableAssignment(node.variableName, node.variableValue);

    if (node instanceof WhileStatementNode)
        return new CodeWhileStatement(node.condition, generateScope(node.block));

    if (node instanceof IfStatementNode)
        return new CodeIfStatement(node.condition, generateScope(node.block));

    if (node instanceof CallExpressionNode)
        return new CodeCallExpression(node.functionName, node.args, node.integrated);

    if (node instanceof FunctionReturnNode)
        return new CodeReturnStatement(node.value)

    if (node instanceof NamespaceDeclarationNode)
        return new CodeNamespaceDeclaration(node.namespaceName, generateScope(node.block));

    if (node instanceof NamespaceReferenceNode)
        return new CodeNamespaceReference(node.namespaceName, generateCodePart(node.block));

    if (node instanceof ClassDeclarationNode)
        return new CodeClassDeclaration(node.className, generateScope(node.block));

    if (node instanceof NewStatementNode)
        return new CodeNewStatement(node.className, node.args)

    return new CodeNone()
}

/**
 * Generates a scope.
 */
function generateScope(block: CodeBlockNode): CodeBlock {
    const generatedScope = new CodeBlock();

    block.nodes.forEach(node => generatedScope.sequence.push(generateCodePart(node)))

    return generatedScope
}

function toCodeType(type: string): VariableTypes {
    return VariableTypes[Object.keys(VariableTypes).filter(e => e == type.toUpperCase())[0] as keyof typeof VariableTypes]
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
        return `${this.variableType} ${this.variableName} = ${generateCodePart(this.variableValue)}`
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
        return `${this.variableName} = ${generateCodePart(this.variableValue)}`
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
            return `${this.functionName}(${this.args.map(arg => generateCodePart(arg)).join(", ")})`
        else {
            const integratedFunction = integratedFunctions[this.functionName as keyof typeof integratedFunctions]
            let value = integratedFunction.value.toString();

            this.args.forEach((item, index) => value = integratedFunction.value.replace("$" + (index + 1), generateCodePart(item).toString()))

            return value
        }
    }
}

class CodeWhileStatement implements CodePart {
    name: string = "WhileStatement"
    requiresEnd: boolean = false

    constructor(public condition: AstNode, public code: CodeBlock) { }

    toString(): string {
        return `while (${generateCodePart(this.condition)}) {
                    ${this.code.toString()}
                }`
    }
}

class CodeIfStatement implements CodePart {
    name: string = "IfStatement"
    requiresEnd: boolean = false

    constructor(public condition: AstNode, public code: CodeBlock) { }

    toString(): string {
        return `if (${generateCodePart(this.condition)}) {
                    ${this.code.toString()}
                }`
    }
}

class CodeReturnStatement implements CodePart {
    name: string = "ReturnStatement"
    requiresEnd: boolean = true

    constructor(public value: AstNode) { }

    toString(): string {
        return `return ${this.value.name != "NoneNode" ? generateCodePart(this.value) : ""}`
    }
}

class CodeNamespaceDeclaration implements CodePart {
    name: string = "NamespaceDeclaration"
    requiresEnd: boolean = false

    constructor(public namespaceName: string, public code: CodeBlock) { }

    toString(): string {
        return `namespace ${this.namespaceName.replaceAll('"', "")} {
                    ${this.code.toString()}
                }`
    }
}

class CodeNamespaceReference implements CodePart {
    name: string = "NamespaceReference"
    requiresEnd: boolean = true

    constructor(public namespaceName: string, public content: CodePart) { }

    toString(): string {
        return `${this.namespaceName}::${this.content.toString()}`
    }
}

class CodeClassDeclaration implements CodePart {
    name: string = "ClassDeclaration"
    requiresEnd: boolean = true

    constructor(public className: string, public code: CodeBlock) { }

    toString(): string {
        return `class ${this.className} {
                    public:
                        ${this.code.toString()}
                }`
    }
}

class CodeNewStatement implements CodePart {
    name: string = "NewStatement"
    requiresEnd: boolean = false

    constructor(public className: string, public args: AstNode[]) { }

    toString(): string {
        return `new ${this.className}(${this.args.map(arg => generateCodePart(arg)).join(", ")})`
    }
}

class CodeNone implements CodePart {
    name: string = "None"
    requiresEnd: boolean = false

    constructor(public input: string = "") { }

    toString(): string {
        return this.input
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
     * Generates the type of the header
     */
    generateHeaderType(node: AstNode): any {
        if (node instanceof FunctionDeclarationNode)
            return new HeaderFunctiondDeclaration(node.functionName, node.args.map(item => {
                const casted = item as FunctionParameterNode

                return new CodeFunctionParameter(toCodeType(casted.variableType), casted.variableName)
            }), toCodeType(node.returnType))

        if (node instanceof UseStatementNode)
            return new CodeInclude(node.packageName.replaceAll('"', "").trim() + ".h")

        if (node instanceof CodeBlockNode) {
            let codeBlock = new CodeBlock()

            node.nodes.forEach(item => {
                let result = this.generateHeaderType(item)

                if (result != undefined)
                    codeBlock.sequence.push(result)
            })

            return codeBlock
        }

        if (node instanceof NamespaceDeclarationNode)
            return new CodeNamespaceDeclaration(node.namespaceName, this.generateHeaderType(node.block))

        return undefined
    }

    /**
     * Generates the c++ header codes.
     */
    generateHeader(block: CodeBlockNode): CodeBlock {
        const header = new CodeBlock();

        header.sequence.push(new CodeInclude("iostream"))
        header.sequence.push(new CodeInclude("vector"))
        header.sequence.push(new CodeInclude("string"))
        header.sequence.push(new CodeInclude("cmath"))

        let headerType = this.generateHeaderType(block)

        if (headerType != undefined)
            headerType.sequence.forEach((item: CodePart) => {
                header.sequence.push(item)
            })

        return header
    }

    /**
     * Here happens the magic.
     */
    work(name: string) {
        const generatedCode = generateScope(this.tree.block);
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