import { AstTree, Parser } from "./parser"
import { Lexer } from "./lexer"
import * as fs from 'fs';

/**
 * Reading the input file
 */
function readFile(path: string) {
    return fs.readFileSync(path, 'utf8');
}

let content = readFile("./tests/basic.lang")

// Here begins the fun
const lexer = new Lexer(content)
const tree = new AstTree("Program", new Parser(lexer))

console.log(tree.toString())