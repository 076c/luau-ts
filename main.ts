/// <reference types="node" />
import * as fs from "fs";
import { tokenize } from "./Rust/tokenizer.js";
import { parse } from "./Rust/parser.js";
import { transpile } from "./Rust/transpiler.js";
import { write } from "./Luau/writer.js";

function usage(): void {
    console.log("Usage: node main.js [-i inputfile] [-o outputfile] [-n]");
    console.log("  -i <file>    : read input from file");
    console.log("  -o <file>    : write output to file");
    console.log("  -n           : interactive: read from stdin and write to stdout");
}

function processSource(source: string): string {
    try {
        const tokens = tokenize(source);
        const parsed = parse(tokens);
        const luau = transpile(parsed);
        return write(luau);
    } catch (e: any) {
        console.error("Error during processing:", e?.stack ?? e);
        process.exit(1);
    }
}

// parse simple flags
const argv = process.argv.slice(2);
let inputFile: string | undefined;
let outputFile: string | undefined;
let interactive = false;

for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-i" || a === "--input") {
        inputFile = argv[++i];
    } else if (a === "-o" || a === "--output") {
        outputFile = argv[++i];
    } else if (a === "-n" || a === "--interactive") {
        interactive = true;
    } else if (a === "-h" || a === "--help") {
        usage();
        process.exit(0);
    } else {
        console.error("Unknown flag", a);
        usage();
        process.exit(1);
    }
}

if (interactive) {
    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { stdin += chunk; });
    process.stdin.on("end", () => {
        if (!stdin.trim()) {
            console.error("No input provided on stdin.");
            process.exit(1);
        }
        process.stdout.write(processSource(stdin));
    });
    process.stdin.resume();
} else if (inputFile) {
    if (!fs.existsSync(inputFile)) {
        console.error("Input file not found:", inputFile);
        process.exit(1);
    }

    const source = fs.readFileSync(inputFile, "utf8");
    const out = processSource(source);

    if (outputFile) {
        fs.writeFileSync(outputFile, out, "utf8");
    } else {
        process.stdout.write(out);
    }
} else {
    usage();
    process.exit(1);
}
