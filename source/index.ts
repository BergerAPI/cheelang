import { AstTree, Parser } from "./parser"
import { Lexer } from "./lexer"
import * as fs from 'fs';
import { Generator } from "./gen/generator";

/**
 * Reading the input file
 */
function readFile(path: string) {
    return fs.readFileSync(path, 'utf8');
}

let content = readFile("./tests/basic.lang")

// Here begins the fun
const lexer = new Lexer(content);
const tree = new AstTree("Program", new Parser(lexer));
const generator = new Generator(tree);

console.log(generator.toString())