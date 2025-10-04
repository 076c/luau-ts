import { Expression } from '../Rust/parser.js'
import { tokenize } from '../Rust/tokenizer.js'
import * as Parser from '../Rust/parser.js'
import * as LuauAst from './ast.js'
import { transpile } from '../Rust/transpiler.js'

export function write(ast: LuauAst.LuauProgram) {
	let source = ""
	let index = 0

	function writeExpressions(expressions: Array<LuauAst.LuauExpression>): string {
		let loc = ""

		expressions.forEach((expression) => {
			switch (expression.expressionType) {
				case LuauAst.LuauExpressionType.Identifier:
					loc += (expression as LuauAst.LuauIdentifierExpression).name
					break
			}
		})

		return loc
	}

	function writeTypeDef(typeDef: LuauAst.LuauTypeDef): string {
		let loc = ""

		loc += writeExpressions(new Array<LuauAst.LuauExpression>(typeDef.type))
		typeDef.additionalArguments.forEach((type) => loc += writeTypeDef(type))

		return loc
	}

	function writeLocals(locals: Array<LuauAst.LuauLocal>): string {
		let loc = []

		locals.forEach((local) => {
			let s = ""

			s += (local as LuauAst.LuauVarDef).name + `${(local as LuauAst.LuauVarDef).type != undefined && `: ${writeTypeDef((local as LuauAst.LuauVarDef).type) || ""}`}`
			loc.push(s)
		})

		return loc.join(", ")
	}

	function writeAssignment(assignment: LuauAst.LuauAssignment) {
		return `local ${assignment.locals.join(", ")} = ${writeExpressions(assignment.expressions)}\n`
	}

	while (index < ast.statements.length) {
		let statement = ast.statements.at(index)

		switch (statement.statementType) {
			case LuauAst.LuauStatementType.Assignment:
				source += writeAssignment(statement as LuauAst.LuauAssignment)
				break
			default:
				source += "-- Unknown Statement"
				break
		}

		index++
	}

	return source
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
		let src = write(transpiled)
		console.log(src)
	})
}