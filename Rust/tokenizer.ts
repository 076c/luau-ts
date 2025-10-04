export enum TokenType {
	Unknown, // [?]
	Identifier, // [[!0..9]^s|Aa..Zz[0..9]]
	Keyword,
	Number, // [0..9:0x:.f]
	String, // "[%s..%s|%q].."
	OpeningParens, // (
	ClosingParens, // )
	Semicolon, // ;
	OpeningBracket, // [
	ClosingBracket, // ]
	OpeningAngledBracket, // <
	ClosingAngledBracket, // >
	Exclamation, // !
	Colon, // :
	Equal, // =
	Ampersand, // &
	Slash, // /
	Backslash, // \
	Pipe, // |
	Add, // +
	Sub, // -
	Mul, // *
	Modulo, // %
}

export const Keywords = ["let", "mut", "fn", "struct", "impl", "for", "where"]

export class LocRange {
	line!: number
	startingColumn!: number
	endingColumn!: number
	constructor(line: number, startingColumn: number, endingColumn: number) {
		this.line = line
		this.startingColumn = startingColumn
		this.endingColumn = endingColumn
	}
}

export class Token {
	tokenType!: TokenType
	token!: string
	loc!: LocRange | undefined
	constructor(tokenType: TokenType, token: string, loc: LocRange | undefined) {
		this.loc = loc
		this.tokenType = tokenType
		this.token = token
	}

	typeOf() {
		return this.tokenType
	}

	value() {
		return this.value
	}

	toString() {
		return `TOKEN ${this.typeOf()} VALUE ${this.token}`
	}
}

function tokenizerError(error: string, loc: LocRange | undefined): void {
	console.error(`tokenizer: ${error}${loc !== undefined && `line #${loc.line} column ${loc.startingColumn}-${loc.endingColumn}` || ""}`)
}

export function tokenize(source: string): Array<Token> {
	let tokens: Array<Token> = new Array<Token>()
	let position: number = 0
	let line: number = 1

	function readChar(): string {
		let char = source.charAt(position)

		if (char == '\n') {
			line++
		}

		position++
		return char
	}

	function isAlnum(c: string): boolean {
		return /^[a-z0-9]+$/i.test(c)
	}

	// TODO: remove this
	function isNumber(c: string): boolean {
		return /^[0-9]+$/i.test(c)
	}

	function isSpace(c: string): boolean {
		return /^\s$/.test(c)
	}

	function peekChar(): string {
		return source.charAt(position)
	}

	function readIdentifier(): string {
		let identifier = ""

		while (isAlnum(peekChar())) {
			identifier += readChar()
		}

		return identifier
	}

	function readNumber(): string {
		let startingColumn = position
		let number = ""

		while (isAlnum(peekChar()) || peekChar() == '.') {
			number += readChar()
		}

		// TODO: weak way of parsing numbers :(
		let decimal = 0
		try {
			decimal = Number(number)
		} catch (error) {
			tokenizerError("malformed number", new LocRange(line, startingColumn, position))
		}

		return number
	}

	while (position < source.length) {
		if (isAlnum(peekChar())) {
			let identifier = readIdentifier()
			let loc = new LocRange(line, position - identifier.length, position)
			let type = TokenType.Identifier
			if (Keywords.find((val) => val == identifier) != undefined) type = TokenType.Keyword
			let token = new Token(type, identifier, loc)

			tokens.push(token)
		} else if (isNumber(peekChar())) {
			let number = readNumber()
			let loc = new LocRange(line, position - number.length, position)
			let token = new Token(TokenType.Number, number, loc)

			tokens.push(token)
		} else if (isSpace(peekChar())) {
			readChar()
		} else {
			let type = TokenType.Unknown
			switch (peekChar()) {
				case '!':
					type = TokenType.Exclamation
					break
				case '(':
					type = TokenType.OpeningParens
					break
				case ')':
					type = TokenType.ClosingParens
					break
				case '[':
					type = TokenType.OpeningBracket
					break
				case ']':
					type = TokenType.ClosingBracket
					break
				case '<':
					type = TokenType.OpeningAngledBracket
					break
				case '>':
					type = TokenType.ClosingAngledBracket
					break
				case ';':
					type = TokenType.Semicolon
					break
				case ':':
					type = TokenType.Colon
					break
				case '=':
					type = TokenType.Equal
					break
				case '&':
					type = TokenType.Ampersand
					break
				default:
					type = TokenType.Unknown
					break
			}
			let loc = new LocRange(line, position - 1, position)
			let token = new Token(type, readChar(), loc)
			tokens.push(token)
		}
	}

	return tokens
}

export function test(): void {
	let samples = [
		"let mut a = b"
	]

	let index = 0

	for (let val of samples) {
		console.log(`SAMPLE ${index}\n`)
		let tokens: Array<Token> = tokenize(val)
		tokens.forEach(function (val) {
			console.log(`${val.toString()}\n`)
		})
		index++
	}
}

test()