#! /usr/bin/env node
import { exit } from "process";
import winston from "winston";
import fs from "fs";
import { Lexer } from "./lexer";
import { Parser } from "./parser/parser";
import { exec } from "child_process";
import os from "os";
import { AstTree } from "./parser/ast";
import { Generator } from "./generator/generator";
import path from "path";

// Basic logger
export const logger = winston.createLogger({
	level: "debug",
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple()
			)
		}),
	]
});

// These options can be changed by passing cli flags
export const options = {
	"silent": {
		short: "s",
		value: false
	},
	"no-warnings": {
		short: "",
		value: false
	},
	"debug": {
		short: "d",
		value: false
	},
	"tree": {
		short: "t",
		value: false
	}
};

// All files that will be compiled soon.
export const files: string[] = [];

// Our cli arguments but without the default nodejs shit
const args = process.argv.slice(2);

if (os.platform() !== "linux" && os.platform() !== "darwin") {
	logger.error("This tool only works on linux and macos");
	exit(1);
}

// Checking for the input file and some options
args.forEach((it) => {

	if (it.startsWith("-"))
		Object.keys(options).forEach((option, index) => {
			const value = options[option as keyof typeof options];

			if (it === `-${value.short}` || (it === `--${option}` && value.short !== "")) {

				if (typeof value.value === "boolean")
					value.value = !value.value;

				else if (typeof value.value === "string" && (args[index + 1] && !args[index + 1].startsWith("-")))
					value.value == args[index + 1];

				else {
					logger.error(`Invalid value for ${option}`);
					process.exit();
				}
			}
		});
	else files.push(it);

});

if (files.length > 0) {

	if (options.debug.value) logger.debug(`Input files: ${files.join(", ")}`);

	// Deleting the directory, so we can create it again
	if (fs.existsSync("./build"))
		fs.rmSync("./build", { recursive: true });

	// Creating the directory where we put all 
	// the generated object files into
	fs.mkdirSync("./build/obj", { recursive: true });

	// Generating llvm and an ast for every file.
	files.forEach(it => {
		const lexer = new Lexer(fs.readFileSync(it, "utf8").toString());
		const parser = new Parser(lexer);
		const ast = parser.parse();

		const name = path.basename(it);
		const withoutExt = name.substring(0, name.lastIndexOf("."));

		if (options.tree.value) {
			logger.info(`${it}`);
			logger.info(`${ast.toString()}`);
		}

		const generator = new Generator(ast);
		const llvm = generator.generate();

		if (options.debug.value) logger.debug(`Generated llvm for ${it}`);

		if (!options.silent.value) logger.info(`Generated llvm for ${it}`);

		fs.writeFileSync(`build/obj/${withoutExt}.ll`, llvm);
	});

	// Compiling the llvm code
	exec(`${os.platform() === "linux" ? "clang" : "clang++"} -o build/a.out ${files.map(p => {
		const name = path.basename(p);
		const withoutExt = name.substring(0, name.lastIndexOf("."));

		return `build/obj/${withoutExt}.ll`;
	}).join(" ")}`, (error, stdout, stderr) => {
		if (error) {
			logger.error(`Could not compile the code: ${error}`);
			exit();
		}

		if (stderr)
			console.log(`${stderr}`);
	});
} else {
	logger.error("You need to provide files to compile.");
	exit(1);
}