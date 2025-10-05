import { Expression } from '../Rust/parser.js'
import { tokenize } from '../Rust/tokenizer.js'
import * as Parser from '../Rust/parser.js'
import * as LuauAst from './ast.js'
import { transpile } from '../Rust/transpiler.js'

export function write(ast: LuauAst.LuauProgram) {
	let source = ""
	let index = 0

	function writeExpressions(expressions: Array<LuauAst.LuauExpression>): string {
		let written = []

		expressions.forEach((expression) => {
			switch (expression.expressionType) {
				case LuauAst.LuauExpressionType.Identifier:
					written.push((expression as LuauAst.LuauIdentifierExpression).name)
					break
				case LuauAst.LuauExpressionType.Number:
					written.push((expression as LuauAst.LuauNumberExpression).number)
					break
				case LuauAst.LuauExpressionType.String:
					written.push((expression as LuauAst.LuauStringExpression).string)
					break
				case LuauAst.LuauExpressionType.BinaryExpression:
					written.push(writeBinaryExpression(expression as LuauAst.LuauBinaryExpression))
					break
				case LuauAst.LuauExpressionType.UnaryExpression:
					written.push(writeUnaryExpression(expression as LuauAst.LuauUnaryExpression))
					break
			}
		})

		return written.join(", ")
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

			s += (local as LuauAst.LuauVarDef).name + `${(local as LuauAst.LuauVarDef).type != undefined && `: ${writeTypeDef((local as LuauAst.LuauVarDef).type)} ` || ""}`
			loc.push(s)
		})

		return loc.join(", ")
	}

	function writeBinaryExpression(expression: LuauAst.LuauBinaryExpression): string {
		let left = new Array<LuauAst.LuauExpression>()
		left.push((expression as LuauAst.LuauBinaryExpression).left)

		let right = new Array<LuauAst.LuauExpression>()
		right.push((expression as LuauAst.LuauBinaryExpression).right)
		return `${writeExpressions(left)} ${(expression as LuauAst.LuauBinaryExpression).op} ${writeExpressions(right)}`
	}

	function writeUnaryExpression(expression: LuauAst.LuauUnaryExpression): string {
		let expr = new Array<LuauAst.LuauExpression>()
		expr.push(expression.expression)

		let op = undefined

		switch (expression.op) {
			case '!':
				op = "not "
				break
			case '&':
				op = "_MUTABLE_REFERENCE_BORROW"
				break
			case '*':
				op = "MUTABLE_DEREFERENCE"
				break
			default:
				op = expression.op
		}

		return `${op}${writeExpressions(expr)}`
	}

	function writeAssignment(assignment: LuauAst.LuauAssignment) {
		return `local ${writeLocals(assignment.locals)} = ${writeExpressions(assignment.expressions)}\n`
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
		"let a = b == c;"
	]

	samples.forEach((source) => {
		let tokens = tokenize(source)
		let parsed = Parser.parse(tokens)

		console.log("AST:", JSON.stringify(parsed, null, 2))

		let transpiled = transpile(parsed)
		let src = write(transpiled)
		console.log(src)
	})
}