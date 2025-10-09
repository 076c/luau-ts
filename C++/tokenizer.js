"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = exports.LocRange = exports.Keywords = exports.TokenType = void 0;
exports.tokenize = tokenize;
exports.test = test;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["Unknown"] = 0] = "Unknown";
    TokenType[TokenType["Identifier"] = 1] = "Identifier";
    TokenType[TokenType["Keyword"] = 2] = "Keyword";
    TokenType[TokenType["Number"] = 3] = "Number";
    TokenType[TokenType["String"] = 4] = "String";
    TokenType[TokenType["OpeningParens"] = 5] = "OpeningParens";
    TokenType[TokenType["ClosingParens"] = 6] = "ClosingParens";
    TokenType[TokenType["Semicolon"] = 7] = "Semicolon";
    TokenType[TokenType["OpeningBracket"] = 8] = "OpeningBracket";
    TokenType[TokenType["ClosingBracket"] = 9] = "ClosingBracket";
    TokenType[TokenType["OpeningAngledBracket"] = 10] = "OpeningAngledBracket";
    TokenType[TokenType["ClosingAngledBracket"] = 11] = "ClosingAngledBracket";
    TokenType[TokenType["Exclamation"] = 12] = "Exclamation";
    TokenType[TokenType["Colon"] = 13] = "Colon";
    TokenType[TokenType["Equal"] = 14] = "Equal";
    TokenType[TokenType["Ampersand"] = 15] = "Ampersand";
    TokenType[TokenType["Slash"] = 16] = "Slash";
    TokenType[TokenType["Backslash"] = 17] = "Backslash";
    TokenType[TokenType["Pipe"] = 18] = "Pipe";
    TokenType[TokenType["Add"] = 19] = "Add";
    TokenType[TokenType["Sub"] = 20] = "Sub";
    TokenType[TokenType["Mul"] = 21] = "Mul";
    TokenType[TokenType["Modulo"] = 22] = "Modulo";
    TokenType[TokenType["OpeningCurlyBracket"] = 23] = "OpeningCurlyBracket";
    TokenType[TokenType["ClosingCurlyBracket"] = 24] = "ClosingCurlyBracket";
    TokenType[TokenType["Sqrt"] = 25] = "Sqrt";
})(TokenType || (exports.TokenType = TokenType = {}));
// TODO: not all keywords are listed
exports.Keywords = ["const", "void", "static", "char", "int", "double", "class", "private", "public",
    "for", "do", "while", "break", "new", "delete", "struct", "enum", "union",
    "short", "long", "float", "false", "true", "extern", "try", "catch", "using",
    "inline", "case", "catch", "bool", "and", "switch", "reinterpret_cast", "throw",
    "typedef", "continue", "protected", "namespace", "if", "else", "return", "signed",
    "virtual", "wchar_t", "unsigned"];
class LocRange {
    line;
    startingColumn;
    endingColumn;
    constructor(line, startingColumn, endingColumn) {
        this.line = line;
        this.startingColumn = startingColumn;
        this.endingColumn = endingColumn;
    }
}
exports.LocRange = LocRange;
class Token {
    tokenType;
    token;
    loc;
    constructor(tokenType, token, loc) {
        this.loc = loc;
        this.tokenType = tokenType;
        this.token = token;
    }
    typeOf() {
        return this.tokenType;
    }
    value() {
        return this.token;
    }
    toString() {
        return `TOKEN ${this.typeOf()} VALUE ${this.token}`;
    }
}
exports.Token = Token;
function tokenizerError(error, loc) {
    console.error(`tokenizer: ${error}${loc !== undefined && `line #${loc.line} column ${loc.startingColumn}-${loc.endingColumn}` || ""}`);
}
function tokenize(source) {
    let tokens = new Array();
    let position = 0;
    let line = 1;
    function readChar() {
        let char = source.charAt(position);
        if (char == '\n') {
            line++;
        }
        position++;
        return char;
    }
    function isAlnum(c) {
        return /^[a-z0-9]$/i.test(c);
    }
    // TODO: remove this
    function isNumber(c) {
        return /^[0-9]$/i.test(c);
    }
    function isSpace(c) {
        return /^\s$/.test(c);
    }
    function peekChar() {
        return source.charAt(position);
    }
    function readIdentifier() {
        let identifier = "";
        while (isAlnum(peekChar())) {
            identifier += readChar();
        }
        return identifier;
    }
    function readString() {
        let quote = readChar(); // consume opening quote
        let s = "";
        while (position < source.length && peekChar() != quote) {
            // TODO: handle escapes
            s += readChar();
        }
        // consume closing quote if present
        if (peekChar() == quote)
            readChar();
        return s;
    }
    function readNumber() {
        let startingColumn = position;
        let number = "";
        while (isAlnum(peekChar()) || peekChar() == '.') {
            number += readChar();
        }
        // TODO: weak way of parsing numbers :(
        let decimal = 0;
        try {
            decimal = Number(number);
        }
        catch (error) {
            tokenizerError("malformed number", new LocRange(line, startingColumn, position));
        }
        return number;
    }
    while (position < source.length) {
        // prefer numbers first so digits are not treated as identifiers
        if (isNumber(peekChar())) {
            let number = readNumber();
            let loc = new LocRange(line, position - number.length, position);
            let token = new Token(TokenType.Number, number, loc);
            tokens.push(token);
        }
        else if (isAlnum(peekChar())) {
            let identifier = readIdentifier();
            let loc = new LocRange(line, position - identifier.length, position);
            let type = TokenType.Identifier;
            if (exports.Keywords.find((val) => val == identifier) != undefined)
                type = TokenType.Keyword;
            let token = new Token(type, identifier, loc);
            tokens.push(token);
        }
        else if (isSpace(peekChar())) {
            readChar();
        }
        else {
            let type = TokenType.Unknown;
            switch (peekChar()) {
                case '"':
                    let str = readString();
                    let locStr = new LocRange(line, position - str.length - 2, position);
                    tokens.push(new Token(TokenType.String, str, locStr));
                    continue;
                case '\'':
                    let s2 = readString();
                    let locStr2 = new LocRange(line, position - s2.length - 2, position);
                    tokens.push(new Token(TokenType.String, s2, locStr2));
                    continue;
                case '+':
                    type = TokenType.Add;
                    break;
                case '-':
                    type = TokenType.Sub;
                    break;
                case '*':
                    type = TokenType.Mul;
                    break;
                case '/':
                    type = TokenType.Slash;
                    break;
                case '%':
                    type = TokenType.Modulo;
                    break;
                case '|':
                    type = TokenType.Pipe;
                    break;
                case '\\':
                    type = TokenType.Backslash;
                    break;
                case '!':
                    type = TokenType.Exclamation;
                    break;
                case '(':
                    type = TokenType.OpeningParens;
                    break;
                case ')':
                    type = TokenType.ClosingParens;
                    break;
                case '[':
                    type = TokenType.OpeningBracket;
                    break;
                case ']':
                    type = TokenType.ClosingBracket;
                    break;
                case '<':
                    type = TokenType.OpeningAngledBracket;
                    break;
                case '>':
                    type = TokenType.ClosingAngledBracket;
                    break;
                case ';':
                    type = TokenType.Semicolon;
                    break;
                case ':':
                    type = TokenType.Colon;
                    break;
                case '=':
                    type = TokenType.Equal;
                    break;
                case '&':
                    type = TokenType.Ampersand;
                    break;
                case '{':
                    type = TokenType.OpeningCurlyBracket;
                    break;
                case '}':
                    type = TokenType.ClosingCurlyBracket;
                    break;
                case '^':
                    type = TokenType.Sqrt;
                    break;
                default:
                    type = TokenType.Unknown;
                    break;
            }
            let loc = new LocRange(line, position - 1, position);
            let token = new Token(type, readChar(), loc);
            tokens.push(token);
        }
    }
    return tokens;
}
function test() {
    let samples = [
        "let mut a = b"
    ];
    let index = 0;
    for (let val of samples) {
        console.log(`SAMPLE ${index}\n`);
        let tokens = tokenize(val);
        tokens.forEach(function (val) {
            console.log(`${val.toString()}\n`);
        });
        index++;
    }
}
test();
