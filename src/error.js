import chalk from "chalk"

export default (line, from, to, message) => {
    let spaces = "     "
    let movedString = spaces
    let help = spaces

    console.log(spaces + line);

    for (let i = 0; i < to; i++) {
        if (i < from) movedString += " ";
        else movedString += "^";

        help += " ";
    }

    help += "Help: " + message

    console.log(chalk.gray(movedString));
    console.log(help)

    process.exit(1)
}