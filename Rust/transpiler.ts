import * as Parser from './parser.js'
import * as LuauAst from './../Luau/ast.js'
import * as Tokenizer from './tokenizer.js'

export function transpile(program: Parser.Program) {
	let index = 0
	let statements: Array<LuauAst.LuauStatement> = []

	function transpilerError(error: string, loc: Tokenizer.LocRange | undefined) {
		throw console.error(`transpiler: ${error}${loc !== undefined && ` line: ${loc.line} column ${loc.startingColumn}-${loc.endingColumn}` || ""}`)
	}

	function transpileIdentifierExpression(identifierExpression: Parser.IdentifierExpression): LuauAst.LuauIdentifierExpression {
		return new LuauAst.LuauIdentifierExpression(identifierExpression.name)
	}

	function transpileTypeDef(typeDef: Parser.TypeDef): LuauAst.LuauTypeDef {
		let types = new Array<LuauAst.LuauTypeDef>()
		typeDef.additionalParams.forEach((param) => types.push(transpileTypeDef(param)))

		return new LuauAst.LuauTypeDef(transpileIdentifierExpression(typeDef.type), types)
	}

	function transpileExpression(expression: Parser.Expression) {
		switch (expression.expressionType) {
			case Parser.ExpressionType.Grouping:
				// unwrap grouping and transpile inner expression
				return transpileExpression((expression as any).expression)

			case Parser.ExpressionType.Identifier:
				return new LuauAst.LuauIdentifierExpression((expression as Parser.IdentifierExpression).name)
			case Parser.ExpressionType.String:
				return new LuauAst.LuauStringExpression((expression as Parser.StringExpression).string)
			case Parser.ExpressionType.Number:
				return new LuauAst.LuauNumberExpression((expression as Parser.NumberExpression).number)
			case Parser.ExpressionType.BinaryExpression:
				return new LuauAst.LuauBinaryExpression(transpileExpression((expression as Parser.BinaryExpression).left), (expression as Parser.BinaryExpression).op, transpileExpression((expression as Parser.BinaryExpression).right))
			case Parser.ExpressionType.UnaryExpression:
				return new LuauAst.LuauUnaryExpression((expression as Parser.UnaryExpression).op, transpileExpression((expression as Parser.UnaryExpression).expression))
			default:
				return new LuauAst.LuauUnknownExpression()
		}
	}

	function transpileVarDef(varDef: Parser.VarDef): LuauAst.LuauVarDef {
		let def = new LuauAst.LuauVarDef(varDef.name, undefined)

		if (varDef.type != undefined) {
			def.type = transpileTypeDef(varDef.type)
		}

		return def
	}

	while (index < program.statements.length) {
		let statement = program.statements.at(index)
		if (statement == undefined) break

		if (statement.statementType == Parser.StatementType.Assignment) {
			let variables = new Array<LuauAst.LuauVarDef>()
			let assignment = statement as Parser.Assignment

			assignment.locals.forEach((local) => variables.push(transpileVarDef(local as Parser.VarDef)))

			let expressions = new Array<LuauAst.LuauExpression>()
			assignment.values.forEach((e) => expressions.push(transpileExpression(e)))

			let transpiled = new LuauAst.LuauAssignment(variables, expressions)
			statements.push(transpiled)
		}

		index++
	}

	// Luau transpiler checkup
	let lookupIndex = 0
	while (lookupIndex < statements.length) {
		let stmt = statements.at(lookupIndex)

		function validateExpression(expression: LuauAst.LuauExpression): boolean {
			if (expression.expressionType == LuauAst.LuauExpressionType.UnaryExpression) {
				if ((expression as LuauAst.LuauUnaryExpression).op == '&' || ((expression as LuauAst.LuauUnaryExpression).op == '*')) {
					throw transpilerError("cannot reference or dereference values (gc handles it)", undefined)
				}
			}
			return true
		}

		if (stmt.statementType == LuauAst.LuauStatementType.Assignment) {
			(stmt as LuauAst.LuauAssignment).expressions.forEach(validateExpression)
		}

		lookupIndex++
	}

	return new LuauAst.LuauProgram(statements)
}

export function test() {
	let samples = [
		"let a = *b;"
	]

	samples.forEach((source) => {
		let tokens = Tokenizer.tokenize(source)
		let parsed = Parser.parse(tokens)

		let transpiled = transpile(parsed)
		console.log(JSON.stringify(transpiled, null, 2))
	})
}