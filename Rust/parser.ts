import { LocRange, Token, tokenize, TokenType } from './tokenizer.js'

export enum NodeType {
	Expression,
	Statement
}

export enum StatementType {
	Assignment,
	ReAssignment,
	IfStatement,
	ReturnStatement,
	ExpressionStatement,
	FunctionDeclarationStatement,
}

export enum ExpressionType {
	Unknown,
	Number,
	String,
	Identifier,
	BinaryExpression,
	Grouping,
	FunctionCall,
	UnaryExpression,
	ArrayExpression,
	MatchExpression,
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

export class FuncDef extends Local {
	funcName!: string
	params!: Array<VarDef>
	returnType: TypeDef | undefined

	constructor(funcName: string, params: Array<VarDef>, returnType: TypeDef | undefined) {
		super(LocalType.FuncDef)

		this.funcName = funcName
		this.params = params
		this.returnType = returnType
	}
}

export class Chunk {
	statements: Array<Statement>

	constructor(statements: Array<Statement>) {
		this.statements = statements
	}
}

export class TypeDef {
	type!: IdentifierExpression | undefined
	additionalParams!: Array<TypeDef>
	tupleReturn!: Array<TypeDef> | undefined

	constructor(type: IdentifierExpression | undefined, additionalParams: Array<TypeDef>, tupleReturn: Array<TypeDef> | undefined) {
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

export class GroupingExpression extends Expression {
	expression!: Expression

	constructor(expression: Expression) {
		super(ExpressionType.Grouping)
		this.expression = expression
	}
}

export class FunctionCallExpression extends Expression {
	callee!: Expression
	args!: Array<Expression>

	constructor(callee: Expression, args: Array<Expression>) {
		super(ExpressionType.FunctionCall)
		this.callee = callee
		this.args = args
	}
}

export class ArrayExpression extends Expression {
	elements!: Array<Expression>

	constructor(elements: Array<Expression>) {
		super(ExpressionType.ArrayExpression)
		this.elements = elements
	}
}

export class MatchCase {
	comparator!: Expression
	body!: Chunk

	constructor(comparator: Expression, body: Chunk) {
		this.comparator = comparator
		this.body = body
	}
}

export class MatchExpression extends Expression {
	comparator!: Expression
	cases!: Array<MatchCase>

	constructor(comparator: Expression, cases: Array<MatchCase>) {
		super(ExpressionType.MatchExpression)
		this.comparator = comparator
		this.cases = cases
	}
}

// TODO: impl
export class DictionaryExpression extends Expression { }

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

export class ReAssignment extends Statement {
	local!: Local
	value!: Expression

	constructor(local: Local, value: Expression) {
		super(StatementType.ReAssignment)
		this.local = local
		this.value = value
	}
}

export class IfStatement extends Statement {
	condition!: Expression
	trueBody: Chunk
	elseIfStatement: IfStatement
	elseBody: IfStatement | undefined

	constructor(condition: Expression, trueBody: Chunk, elseIfStatement: IfStatement, elseBody: IfStatement | undefined) {
		super(StatementType.IfStatement)

		this.condition = condition
		this.trueBody = trueBody
		this.elseIfStatement = elseIfStatement
		this.elseBody = elseBody
	}
}

export class ExpressionStatement extends Statement {
	expression!: Expression

	constructor(expression: Expression) {
		super(StatementType.ExpressionStatement)
		this.expression = expression
	}
}

export class ReturnStatement extends Statement {
	implicit!: boolean
	expressions: Array<Expression>

	constructor(implicit: boolean, expressions: Array<Expression>) {
		super(StatementType.ReturnStatement)
		this.implicit = implicit
		this.expressions = expressions
	}
}

export class Program {
	kind = "Program"
	statements!: Array<Statement>

	constructor(statements: Array<Statement>) {
		this.statements = statements
	}
}

// ORDER OF PRECEDENCE
// 1: CLOSURES
// 2: BREAK
// 3: RETURN
// 4: COMPOUND AND, XOR, OR
// 5: COMPUND SHL, SHR
// 6: DIRECT ASSIGNMENT
// 7: RANGE, COMPOUND RANGE
// 8: LOGAND
// 9: LOGOR
// 10: LE, LEQ, GE, GEQ
// 11: EQ, NEQ
// 12: BITOR
// 13: BITXOR
// 14: BITAND
// 15: BITSHR, BITSHL
// 16: ADD, SUB
// 17: MUL, DIV, MOD
// 18: COL
// 19: TYPECASE 'as'
// 20: MUTABLE BORROW &mut
// 21: SHARED BORROW &
// 22: DEREFERENCE *
// 23: BITNOT
// 24: NEG (UNARY -)
// 25: QMARK OP
// 26: FUNCTION CALLS, ARRAY INDEX
// 27: FIELD EXPRESSIONS
// 28: METHOD CALLS
// 29: PATH

export function parse(tokens: Array<Token>) {
	let statements: Array<Statement> = []
	let tokenIndex = 0

	function parserError(error: string, loc: LocRange | undefined) {
		throw console.error(`parser: ${error}${loc !== undefined ? ` line: ${loc.line} column ${loc.startingColumn}-${loc.endingColumn}` : ""}`)
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
			case TokenType.OpeningParens:
				let openingParens = eatTypeOf(TokenType.OpeningParens)
				let expr = parseExpression()
				let closingParens = eatTypeOf(TokenType.ClosingParens)
				return new GroupingExpression(expr)
			case TokenType.OpeningBracket:
				let openingBracket = eatTypeOf(TokenType.OpeningBracket)
				let elements: Array<Expression> = []

				while (current() && current()?.tokenType != TokenType.ClosingBracket) {
					let before = tokenIndex
					elements.push(parseExpression())
					if (tokenIndex === before) parserError("unable to parse array element", current()?.loc)
				}

				let closingBracket = eatTypeOf(TokenType.ClosingBracket)

				return new ArrayExpression(elements)
			case TokenType.Keyword:
				if (current()?.token == "match") {
					return parseMatchExpression()
				}
			default:
				parserError(`failed to parse expression`, current().loc)
		}
	}

	function parseUnaryExpression(): Expression {
		// treat prefix operators as unary (e.g. -x, &x, *x, +x, !x)
		if (
			current()?.typeOf() == TokenType.Sub ||
			current()?.typeOf() == TokenType.Ampersand ||
			current()?.typeOf() == TokenType.Mul ||
			current()?.typeOf() == TokenType.Add ||
			current()?.typeOf() == TokenType.Exclamation
		) {
			let opToken = eat()
			let op = opToken?.token
			let expression = parseUnaryExpression()
			return new UnaryExpression(op, expression)
		}

		return parseFunctionCall()
	}

	function parseMultiplicativeExpression(): Expression {
		let left = parseUnaryExpression()

		while (
			current()?.typeOf() == TokenType.Mul ||
			current()?.typeOf() == TokenType.Slash ||
			current()?.typeOf() == TokenType.Modulo
		) {
			let op = eat().token

			left = new BinaryExpression(left, op, parseUnaryExpression())
		}

		return left
	}

	function parseAdditiveExpression(): Expression {
		let left = parseMultiplicativeExpression()

		while (current()?.typeOf() == TokenType.Add || current()?.typeOf() == TokenType.Sub) {
			let op = eat().token

			left = new BinaryExpression(left, op, parseMultiplicativeExpression())
		}

		return left
	}

	function parseRangeExpression(): Expression {
		let left = parseLogAndExpression()
		while (current()?.tokenType == TokenType.Dot) {
			let dot = eat()
			let right = parseAdditiveExpression()
			left = new BinaryExpression(left, "..", right)
		}

		return left
	}

	function parseLogAndExpression(): Expression {
		let left = parseLogOrExpression()

		while (current()?.typeOf() == TokenType.Ampersand && tokens.at(tokenIndex + 1)?.tokenType == TokenType.Ampersand) {
			let before = tokenIndex
			let op = eat().token + eat().token // & & -> &&

			left = new BinaryExpression(left, op, parseLogOrExpression())
			if (tokenIndex === before) parserError('parser did not advance while parsing logical AND', current()?.loc)
		}

		return left
	}

	function parseBitAndExpression(): Expression {
		let left = parseBitShiftExpression()

		// single '&' (bitwise) — avoid consuming '&&' (logical and)
		while (current()?.typeOf() == TokenType.Ampersand && tokens.at(tokenIndex + 1)?.tokenType != TokenType.Ampersand) {
			let op = eat().token
			left = new BinaryExpression(left, op, parseBitShiftExpression())
		}

		return left
	}

	function parseBitXorExpression(): Expression {
		let left = parseBitAndExpression()

		while (current()?.typeOf() == TokenType.Sqrt) {
			let before = tokenIndex
			let op = eat().token

			left = new BinaryExpression(left, op, parseBitAndExpression())
			if (tokenIndex === before) parserError('parser did not advance while parsing bitwise XOR', current()?.loc)
		}

		return left
	}

	function parseBitOrExpression(): Expression {
		let left = parseBitXorExpression()

		while (current()?.typeOf() == TokenType.Pipe && tokens.at(tokenIndex + 1)?.tokenType != TokenType.Pipe) {
			let before = tokenIndex
			let op = eat().token

			left = new BinaryExpression(left, op, parseBitXorExpression())
			if (tokenIndex === before) parserError('parser did not advance while parsing bitwise OR', current()?.loc)
		}

		return left
	}

	function parseBitShiftExpression(): Expression {
		let left = parseAdditiveExpression()

		while (
			(current()?.tokenType == TokenType.OpeningAngledBracket && tokens.at(tokenIndex + 1)?.tokenType == TokenType.OpeningAngledBracket) ||
			(current()?.tokenType == TokenType.ClosingAngledBracket && tokens.at(tokenIndex + 1)?.tokenType == TokenType.ClosingAngledBracket)
		) {
			let before = tokenIndex
			let op = eat().token + eat().token

			left = new BinaryExpression(left, op, parseAdditiveExpression())
			if (tokenIndex === before) parserError('parser did not advance while parsing bit shift', current()?.loc)
		}

		return left
	}

	function parseEqualComparisonExpression(): Expression {
		let left = parseBitOrExpression()

		while (current()?.typeOf() == TokenType.Equal && (tokens.at(tokenIndex + 1)?.tokenType == TokenType.Equal || tokens.at(tokenIndex + 1)?.tokenType == TokenType.Exclamation)) {
			let before = tokenIndex
			let op = eat().token + eat().token // = = -> ==

			left = new BinaryExpression(left, op, parseBitOrExpression())
			if (tokenIndex === before) parserError('parser did not advance while parsing equality comparison', current()?.loc)
		}

		return left
	}

	function parseLogOrExpression(): Expression {
		let left = parseEqualComparisonExpression()

		while (current()?.typeOf() == TokenType.Pipe && tokens.at(tokenIndex + 1)?.tokenType == TokenType.Pipe) {
			let before = tokenIndex
			let op = eat().token + eat().token // | | -> ||

			left = new BinaryExpression(left, op, parseEqualComparisonExpression())
			if (tokenIndex === before) parserError('parser did not advance while parsing logical OR', current()?.loc)
		}

		return left
	}

	function parseMatchExpression(): Expression {
		if (current()?.tokenType == TokenType.Keyword && current()?.token == "match") {
			let kword = eatTypeOf(TokenType.Keyword) // match
			let comparator = parseExpression()
			let cases: Array<MatchCase> = []
			let openingBracket = eatTypeOf(TokenType.OpeningCurlyBracket)

			// TODO: fix last case not being parsed
			while (current()?.tokenType != TokenType.ClosingCurlyBracket && current()?.tokenType != TokenType.Comma) {
				let comparator = parseExpression()
				let fat_arrow = eatTypeOf(TokenType.Equal).token + eatTypeOf(TokenType.ClosingAngledBracket).token
				let body = null

				if (current().tokenType == TokenType.OpeningCurlyBracket) {
					body = parseChunk()
					if (current().tokenType == TokenType.Comma) {
						let comma = eatTypeOf(TokenType.Comma)
					}
				} else {
					body = new Chunk([
						parseStatement()
					])
					if (current().tokenType == TokenType.Comma) {
						let comma = eatTypeOf(TokenType.Comma)
					}
				}

				cases.push(new MatchCase(comparator, body))
			}

			let closingBracket = eatTypeOf(TokenType.ClosingCurlyBracket)
			return new MatchExpression(comparator, cases)
		} else {
			return parseRangeExpression()
		}
	}

	function parseFunctionCall(): Expression {
		let expr = parsePrimaryExpression()
		let isMacro = current()?.tokenType == TokenType.Exclamation ? (eat() && true) : false

		while (current() && current()?.tokenType == TokenType.OpeningParens) {
			let openingParen = eatTypeOf(TokenType.OpeningParens)
			let args: Array<Expression> = []

			while (current() && current().tokenType != TokenType.ClosingParens) {
				let before = tokenIndex
				args.push(parseExpression())
				if (tokenIndex === before) parserError('unable to parse function call argument', current()?.loc)
			}

			let closingParen = eatTypeOf(TokenType.ClosingParens)
			expr = new FunctionCallExpression(expr, args)
		}

		return expr
	}

	function parseExpression(): Expression {
		return parseRangeExpression()
	}

	function parseTypesArguments(openingType: TokenType, closingType: TokenType): Array<TypeDef> {
		let args = new Array<TypeDef>()

		let openingBracket = eatTypeOf(openingType)
		while (current() && current()?.tokenType != closingType) {
			let before = tokenIndex
			args.push(parseTypeDefinition())
			if (tokenIndex === before) parserError('unable to parse type argument', current()?.loc)
		}

		let closingBracket = eatTypeOf(closingType)
		return args
	}

	function parseTypeDefinition(): TypeDef {
		if (current().tokenType == TokenType.OpeningParens) {
			return new TypeDef(undefined, undefined, parseTypesArguments(TokenType.OpeningParens, TokenType.ClosingParens))
		}
		let name = new IdentifierExpression(eatTypeOf(TokenType.Identifier).token)
		let args = new Array<TypeDef>()

		if (current().tokenType == TokenType.OpeningAngledBracket) {
			args = parseTypesArguments(TokenType.OpeningAngledBracket, TokenType.ClosingAngledBracket)
		}

		return new TypeDef(name, args, undefined)
	}

	function parseReAssignment() {
		let name = eatTypeOf(TokenType.Identifier).token
		let type = undefined

		let equalSign = eatTypeOf(TokenType.Equal)
		let expression = parseExpression()

		return new ReAssignment(new VarDef(name, type), expression)
	}

	function parseChunk() {
		let openingBracket = eatTypeOf(TokenType.OpeningCurlyBracket)
		let statements: Array<Statement> = []

		while (current() && current()?.tokenType != TokenType.ClosingCurlyBracket) {
			let before = tokenIndex
			let st = parseStatement()
			if (st === undefined) parserError('unable to parse statement in chunk', current()?.loc)
			statements.push(st)
			if (tokenIndex === before) parserError('parser did not advance while parsing chunk', current()?.loc)
		}

		let closingBracket = eatTypeOf(TokenType.ClosingCurlyBracket)
		return new Chunk(statements)
	}

	function parseIfStatement() {
		let kword = eatTypeOf(TokenType.Keyword)
		let condition = parseExpression()
		let trueBody = parseChunk()
		let elseBody = undefined
		let elseIfBody = undefined

		if (current().tokenType == TokenType.Keyword && current().token == "else") {
			// lookahead: else if ...
			if (tokens.at(tokenIndex + 1)?.tokenType == TokenType.Keyword && tokens.at(tokenIndex + 1)?.token == "if") {
				// consume 'else' and parse nested if
				eat()
				elseIfBody = parseIfStatement()
			} else {
				// consume 'else' then parse chunk
				eat()
				elseBody = parseChunk()
			}
		}

		return new IfStatement(condition, trueBody, elseIfBody, elseBody)
	}

	function parseAssignment(): Assignment {
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
		let expressions: Array<Expression> = new Array<Expression>()
		expressions.push(parseExpression())
		let semiColon = eatTypeOf(TokenType.Semicolon)

		return new Assignment([new VarDef(name, type)], expressions, mutable)
	}

	function parseExpressionStatement(): ExpressionStatement | ReturnStatement {
		let expr = parseExpression()

		if (current().tokenType != TokenType.Semicolon) {
			return new ReturnStatement(true, new Array<Expression>(expr))
		} else {
			eat() // semicolon
			return new ExpressionStatement(expr)
		}
	}

	function parseStatement() {
		if (current().tokenType == TokenType.Keyword && current().token == "let") {
			return parseAssignment()
		} else if (current().tokenType == TokenType.Identifier && tokens.at(tokenIndex + 1).tokenType == TokenType.Equal) {
			return parseReAssignment()
		} else if (current().tokenType == TokenType.Keyword && current().token == "if") {
			return parseIfStatement()
		} else {
			return parseExpressionStatement()
		}
	}

	while (tokenIndex < tokens.length) {
		if (tokens.at(tokenIndex) && tokens.at(tokenIndex)?.tokenType == TokenType.Eof) {
			break
		}
		let before = tokenIndex
		statements.push(parseStatement())
		if (tokenIndex === before) parserError('parser did not advance while parsing top-level statements', current()?.loc)
	}

	return new Program(statements)
}