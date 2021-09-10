import { AstNode, BooleanLiteralNode, CallExpressionNode, CodeBlockNode, ExpressionNode, IfStatementNode, IntegerLiteralNode, StringLiteralNode, UnaryNode, VariableAssignmentNode, VariableDeclarationNode, VariableReferenceNode, WhileStatementNode } from "../parser";
import { VariableTypes } from "./generator";

/**
 * The pre-defined functions.
 */
let integratedFunctions = {
    "println": { requiredArguments: 1, value: "std::cout << $1 << std::endl" },
    "input": { requiredArguments: 1, value: "std::cin >> $1" },
}

/**
 * Pog! If something = true, then do something
 */
export function ifStatement(node: IfStatementNode) {
    return "if (" + expression(node.condition) + ") \n" + "{ \n" + codeBlock(node.block).join("\n") + "\n}";
}

/**
 * A basic while statement (pog)
 * @param node the node
 */
export function whileStatement(node: WhileStatementNode) {
    return "while (" + expression(node.condition) + ") \n" + "{ \n" + codeBlock(node.block).join("\n") + "\n}";
}

/**
 * A Ast-Code-Block-Node to code :sunglasses:
 */
export function codeBlock(item: CodeBlockNode): string[] {
    let result: string[] = []

    // Running everything. pog
    item.nodes.forEach(node => {
        switch (node.name) {
            case "VariableDeclarationNode":
                result.push(variableDeclaration(node as VariableDeclarationNode))
                break;

            case "ExpressionNode":
                result.push(expression(node))
                break;

            case "IfStatementNode":
                result.push(ifStatement(node as IfStatementNode))
                break;

            case "WhileStatementNode":
                result.push(whileStatement(node as WhileStatementNode))
                break;

            case "BreakStatementNode":
                result.push("break")
                break;

            case "VariableAssignmentNode":
                result.push(variableAssignment(node as VariableAssignmentNode))
                break;

            case "CallExpressionNode":
                result.push(callExpression(node as CallExpressionNode))
                break;
        }
    })

    return result.map(item => item + ";")
}

/**
 * From AST-Variable-Declaration-Node to c++ code.
 */
export function variableDeclaration(node: VariableDeclarationNode) {
    let type = VariableTypes[Object.keys(VariableTypes).filter(e => e == node.variableType.toUpperCase())[0] as keyof typeof VariableTypes]

    return type + " " + node.variableName + " = " + expression(node.variableValue)
}

/**
 * From AST-Variable-Declaration-Node to c++ code.
 */
export function variableAssignment(node: VariableAssignmentNode) {
    return node.variableName + " = " + expression(node.variableValue)
}

/**
 * Calling a function (pog)
 * @param node the node
 * @returns the c++ code
 */
export function callExpression(node: CallExpressionNode) {
    if (node.integrated) {
        const integratedFunction = integratedFunctions[node.functionName as keyof typeof integratedFunctions]
        let value = "" + integratedFunction.value;

        node.args.forEach((item, index) => value = integratedFunction.value.replace("$" + (index + 1), expression(item)))

        if (node.args.length != integratedFunction.requiredArguments)
            throw new Error("functions " + node.functionName + " requires " + integratedFunction.requiredArguments + " arguments")

        return value
    }

    return node.functionName + "(" + node.args.map(arg => expression(arg)).join(", ") + ")"
}

/**
 * From code to expression (ast) and then to code again.
 */
export function expression(node: AstNode): string {
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