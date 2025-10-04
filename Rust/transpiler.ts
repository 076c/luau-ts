import * as Parser from './parser.js'
import * as LuauAst from './../Luau/ast.js'
import { tokenize } from './tokenizer.js'

export function transpile(program: Parser.Program) {
	let index = 0
	let statements: Array<LuauAst.LuauStatement> = []

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
			case Parser.ExpressionType.Identifier:
				return new LuauAst.LuauIdentifierExpression((expression as Parser.IdentifierExpression).name)
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

	return new LuauAst.LuauProgram(statements)
}

export function test() {
	let samples = [
		"let a = b;",
		"let a = c;",
		"let a = d;"
	]

	samples.forEach((source) => {
		let tokens = tokenize(source)
		let parsed = Parser.parse(tokens)

		let transpiled = transpile(parsed)
		console.log(JSON.stringify(transpiled, null, 2))
	})
}