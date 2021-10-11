#! /usr/bin/env node
import { exit } from "process";
import winston from "winston";
import fs from "fs";
import { Lexer } from "./lexer";
import { Parser } from "./parser/parser";
import { exec } from "child_process";
import os from "os";

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

	if (options.debug.value) logger.debug("Getting the input files.");

	const fileContents: string[] = files.map((it) => {
		try {
			return fs.readFileSync(it, "utf8").toString();
		} catch (error) {
			logger.error(`Could not read file ${it}`);
			exit();
		}
	});

	if (options.debug.value) logger.debug(`Input files: ${files.join(", ")}`);
	if (options.debug.value) logger.debug("Initialising lexer.");

	const lexer: Lexer = new Lexer(fileContents);

	if (options.debug.value) logger.debug("Lexer initialised.");
	if (options.debug.value) logger.debug("Starting Parser.");

	const parser: Parser = new Parser(lexer);

	if (options.debug.value) logger.debug("Parser started.");

	// Creating the directory where we put all 
	// the generated object files into
	fs.mkdirSync("build/obj", { recursive: true });
} else {
	logger.error("You need to provide files to compile.");
	exit(1);
}