export default class Interpreter {

    /**
     * We just execute the ast tree in here
     */
    constructor() {
        this.globalScope = {
            variables: { },
            functions: {
                println: {
                    func: (args) => {
                        console.log(args[ 0 ])
                    },
                    requiredArguments: 1
                }
            }
        };
        this.currentScope = this.globalScope;
    }

    /**
     * Simple math expression
     */
    parseBinaryOperator(item) {
        const right = this.parseExpression(item.right)
        const left = this.parseExpression(item.left)
        const operator = item.operator;

        switch (operator) {
            case "+":
                return left + right;
            case "-":
                return left - right;
            case "*":
                return left * right;
            case "/":
                return left / right;
            case "==":
                return left == right;
            case "!=":
                return left != right;
            case "||":
                return left || right;
            case "&&":
                return left && right;
            case "<":
                return left < right;
            case ">":
                return left > right;
            case ">=":
                return left >= right;
            case "<=":
                return left <= right;
        }
    }

    /**
     * Default expression like described in the parser
     */
    parseExpression(item) {
        if (!item)
            return undefined

        switch (item.type) {
            case "BINARY_OPERATOR":
                return this.parseBinaryOperator(item);
            case "STRING_LITERAL":
                return item.value.substring(1, item.value.length - 1);
            case "BOOLEAN_LITERAL":
                return item.value == "true";
            case "INTEGER_LITERAL":
                return parseInt(item.value);
            case "UNARY_OPERATOR":
                // NOTE: "!-" is a unary operator too.

                switch (item.value) {
                    case "!":
                        return !this.parseUnderOperator(item.right);
                    case "-":
                        return -this.parseUnderOperator(item.right);
                    case "+":
                        return +this.parseUnderOperator(item.right);
                    default:
                        throw new Error("Unknown unary operator: " + item.value);
                }
            case "VARIABLE_REFERENCE":
                // eslint-disable-next-line no-case-declarations
                let variable = this.currentScope.variables[ item.id ];

                if (!variable)
                    throw new Error("Variable '" + item.id + "' is not defined.");

                return variable.value;
        }

        throw Error("Something went wrong you dumbass lamo");
    }

    /**
     * Here happens the magic.
     */
    interpret(body, scope = {
        variables: { },
        functions: { }
    }) {
        const lastScope = this.currentScope;

        // Resetting the scope
        this.currentScope = scope;
        this.currentScope.variables = { ...this.currentScope.variables, ...lastScope.variables };
        this.currentScope.functions = { ...this.currentScope.functions, ...lastScope.functions };

        body.forEach((item) => {
            switch (item.type) {
                case "BINARY_OPERATOR":
                    console.log(this.parseBinaryOperator(item));
                    break;
                case "VARIABLE_DECLARATION":
                    this.currentScope.variables[ item.declaration.id ] = {
                        value: this.parseExpression(item.declaration.init),
                        kind: item.kind
                    }

                    break;
                case "IF_STATEMENT":
                    if (this.parseExpression(item.condition))
                        this.interpret(item.body);
                    else this.interpret(item.else)

                    break;
                case "VARIABLE_ASSIGNMENT":
                    if (this.currentScope.variables[ item.id ]) {
                        const variable = this.currentScope.variables[ item.id ];

                        if (variable.kind == "const")
                            throw new Error("Cannot reassign constant variable '" + item.id + "'.");

                        variable.value = this.parseExpression(item.value);
                    } else
                        throw new Error("Variable '" + item.id + "' is not defined. (This is an interpretation error)");
                    break;
                case "CALL_EXPRESSION":
                    if (this.currentScope.functions[ item.callee ]) {
                        const toExecute = this.currentScope.functions[ item.callee ]

                        if (item.arguments.length == toExecute.requiredArguments)
                            toExecute.func(item.arguments.map(i => this.parseExpression(i)))
                        else
                            throw new Error("Function '" + item.callee + "' takes " + toExecute.requiredArguments + " arguements. You provided " + item.arguments.length + ". (This is an interpretation error)");
                    } else
                        throw new Error("Function '" + item.callee + "' is not defined. (This is an interpretation error)");
                    break;
                case "FUNCTION_DECLARATION":
                    this.currentScope.functions[ item.callee ] = {
                        func: (args) => {
                            const variables = { };

                            item.arguments.forEach((param, index) => {
                                variables[ param.id ] = {
                                    value: args[ index ],
                                    kind: "let"
                                }
                            });

                            this.interpret(item.body, {
                                variables: variables,
                                functions: { }
                            });
                        },
                        requiredArguments: item.arguments.length
                    }

                    break;
            }
        })

        // We need the scope before the current one again, so
        // we can't access variables from for example an if statement
        this.currentScope = lastScope;
    }
}