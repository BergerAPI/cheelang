#! /usr/bin/env node
import { exit } from "process";
import winston from "winston"

// Basic logger
export const logger = winston.createLogger({
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
    }
};

// All files that will be compiled soon.
export const files: string[] = []

// Our cli arguments but without the default nodejs shit
const args = process.argv.slice(2);

// Checking for the input file and some options
args.forEach((it) => {

    if (it.startsWith("-"))
        Object.keys(options).forEach((option, index) => {
            let value = options[option as keyof typeof options];

            if (it === `-${value.short}` || (it === `--${option}` && value.short !== "")) {

                if (typeof value.value === "boolean")
                    value.value = !value.value;

                else if (typeof value.value === "string" && (args[index + 1] && !args[index + 1].startsWith("-")))
                    value.value == args[index + 1]

                else {
                    logger.error(`Invalid value for ${option}`);
                    process.exit()
                }
            }
        })
    else files.push(it)

})

if (files.length > 0) {
    logger.info(files)
} else {
    logger.error("You need to provide files to compile.")
    exit(1)
}