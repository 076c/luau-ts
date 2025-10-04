import { LocRange, Token, tokenize, TokenType } from './tokenizer.js'

export enum NodeType {
	Expression,
	Statement
}

export enum StatementType {
	Assignment,
	Expression
}

export enum ExpressionType {
	Unknown,
	Number,
	String,
	Identifier,
	BinaryExpression,
	UnaryExpression,
}

export enum LocalType {
	VarDef,
	FuncDef
}

export class BaseNode {
	nodeType!: NodeType

	getNodeType(): NodeType {
		return this.nodeType
	}

	constructor(nodeType: NodeType) {
		this.nodeType = nodeType
	}
}

export class Statement extends BaseNode {
	statementType!: StatementType

	constructor(statementType: StatementType) {
		super(NodeType.Statement)
		this.statementType = statementType
	}
}

export class Local {
	localType!: LocalType

	constructor(localType: LocalType) {
		this.localType = localType
	}
}

export class TypeDef {
	type!: IdentifierExpression
	additionalParams!: Array<TypeDef>

	constructor(type: IdentifierExpression, additionalParams: Array<TypeDef>) {
		this.type = type
		this.additionalParams = additionalParams
	}
}

export class VarDef extends Local {
	name!: string
	type!: TypeDef | undefined

	constructor(name: string, type: TypeDef) {
		super(LocalType.VarDef)
		this.name = name
		this.type = type
	}
}

export class Expression {
	expressionType!: ExpressionType

	constructor(expressionType: ExpressionType) {
		this.expressionType = expressionType
	}
}

export class NumberExpression extends Expression {
	number!: string
	constructor(number: string) {
		super(ExpressionType.Number)
		this.number = number
	}
}

export class StringExpression extends Expression {
	string!: string
	constructor(string: string) {
		super(ExpressionType.String)
		this.string = string
	}
}

export class IdentifierExpression extends Expression {
	name!: string
	constructor(name: string) {
		super(ExpressionType.Identifier)
		this.name = name
	}
}

export class BinaryExpression extends Expression {
	left!: Expression
	op!: string
	right!: Expression

	constructor(left: Expression, op: string, right: Expression) {
		super(ExpressionType.BinaryExpression)
		this.left = left
		this.op = op
		this.right = right
	}
}

export class UnaryExpression extends Expression {
	op!: string
	expression!: Expression

	constructor(op: string, expression: Expression) {
		super(ExpressionType.UnaryExpression)
		this.op = op
		this.expression = expression
	}
}

export class UnknownExpression extends Expression {
	constructor() {
		super(ExpressionType.Unknown)
	}
}

export class Assignment extends Statement {
	locals!: Array<Local>
	values!: Array<Expression>
	mutable!: boolean

	constructor(locals: Array<Local>, values: Array<Expression>, mutable: boolean) {
		super(StatementType.Assignment)
		this.locals = locals
		this.values = values
		this.mutable = mutable
	}
}

export class Program {
	kind = "Program"
	statements!: Array<Statement>

	constructor(statements: Array<Statement>) {
		this.statements = statements
	}
}

export function parse(tokens: Array<Token>) {
	let statements: Array<Statement> = []
	let tokenIndex = 0

	function parserError(error: string, loc: LocRange | undefined) {
		throw console.error(`parser: ${error}${loc !== undefined && ` line: ${loc.line} column ${loc.startingColumn}-${loc.endingColumn}` || ""}`)
	}

	function eat(): Token {
		let token = tokens.at(tokenIndex)

		// if (token == undefined) {
		// 	parserError("expected token", undefined)
		// }

		tokenIndex++
		return token
	}

	function current(): Token {
		let token = tokens.at(tokenIndex)

		// if (token == undefined) {
		// 	parserError("expected token", undefined)
		// }

		return token
	}

	function eatTypeOf(type: TokenType) {
		let token = tokens.at(tokenIndex)

		// if (token == undefined) {
		// 	parserError("expected token", undefined)
		// }

		if (token?.typeOf() !== type) {
			parserError(`expected ${TokenType[type]}, got ${TokenType[token?.tokenType || TokenType.Unknown]}`, token?.loc)
		}

		tokenIndex++

		return token
	}

	function parsePrimaryExpression(): Expression {
		switch (current()?.tokenType) {
			case TokenType.Number:
				return new NumberExpression(eat().token)
			case TokenType.String:
				return new StringExpression(eat().token)
			case TokenType.Identifier:
				return new IdentifierExpression(eat().token)
			default:
				return new UnknownExpression()
		}
	}

	function parseUnaryExpression(): Expression {
		if (
			current().typeOf() == TokenType.Sub ||
			current().typeOf() == TokenType.Ampersand
		) {
			let op = eat().token
			let expression = parseUnaryExpression()
			return new UnaryExpression(op, expression)
		}

		return parsePrimaryExpression()
	}

	function parseMultiplicativeExpression(): Expression {
		let left = parseUnaryExpression()

		while (
			current().typeOf() == TokenType.Mul ||
			current().typeOf() == TokenType.Slash ||
			current().typeOf() == TokenType.Modulo
		) {
			let op = eat().token

			left = new BinaryExpression(left, op, parseUnaryExpression())
		}

		return left
	}

	function parseAdditiveExpression(): Expression {
		let left = parseMultiplicativeExpression()

		while (current().typeOf() == TokenType.Add || current().typeOf() == TokenType.Sub) {
			let op = eat().token

			left = new BinaryExpression(left, op, parseMultiplicativeExpression())
		}

		return left
	}

	function parseExpression(): Expression {
		return parseAdditiveExpression()
	}

	function parseTypesArguments(): Array<TypeDef> {
		let args = new Array<TypeDef>()

		let openingBracket = eat()

		while (current().tokenType != TokenType.ClosingAngledBracket) {
			args.push(parseTypeDefinition())
		}

		let closingBracket = eatTypeOf(TokenType.ClosingAngledBracket)

		return args
	}

	function parseTypeDefinition(): TypeDef {
		let name = new IdentifierExpression(eatTypeOf(TokenType.Identifier).token)
		let args = new Array<TypeDef>()

		if (current().tokenType == TokenType.OpeningAngledBracket) {
			args = parseTypesArguments()
		}

		return new TypeDef(name, args)
	}

	function parseAssignment() {
		let keyword = eatTypeOf(TokenType.Keyword)
		let mutable = false

		if (current()?.tokenType === TokenType.Keyword && current()?.token === "mut") {
			mutable = true
			eat()
		}

		let name = eatTypeOf(TokenType.Identifier).token
		let type = undefined

		if (current().tokenType == TokenType.Colon) {
			let colon = eat()
			type = parseTypeDefinition()
		}

		let equalSign = eatTypeOf(TokenType.Equal)
		let expression = new Array<Expression>
		expression.push(parseExpression())
		let semiColon = eatTypeOf(TokenType.Semicolon)

		return new Assignment([new VarDef(name, type)], expression, mutable)
	}

	function parseStatement() {
		return parseAssignment()
	}

	while (tokenIndex < tokens.length) {
		statements.push(parseStatement())
	}

	return new Program(statements)
}

export function test() {
	let tokens = tokenize("let mut a: Vec<u8> = b;")
	let parsed = parse(tokens)

	console.log("AST:", JSON.stringify(parsed, null, 2))
}