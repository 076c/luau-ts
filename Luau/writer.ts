import { Expression } from '../Rust/parser.js'
import { tokenize } from '../Rust/tokenizer.js'
import * as Parser from '../Rust/parser.js'
import * as LuauAst from './ast.js'
import { transpile } from '../Rust/transpiler.js'

export function write(ast: LuauAst.LuauProgram) {
	let source = ""
	let index = 0

	// indentation support
	let indentLevel = 0
	const INDENT = "\t"

	function indent(): string {
		return INDENT.repeat(indentLevel)
	}

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
				case LuauAst.LuauExpressionType.FunctionCall:
					written.push(writeFunctionCallExpression(expression as LuauAst.LuauFunctionCallExpression))
					break
				case LuauAst.LuauExpressionType.ClosureExpression:
					let closure = expression as LuauAst.LuauClosureExpression
					let closureStr = `function(${writeLocals(closure.params)})\n`
					indentLevel++
					closure.chunk.forEach((stmt) => closureStr += writeStatement(stmt))
					indentLevel--
					closureStr += `${indent()}end`
					written.push(closureStr)
					break
				default:
					written.push("--[[ UNKNOWN EXPRESSION ]]")
					break
			}
		})

		return written.join(", ")
	}

	function writeTypeDef(typeDef: LuauAst.LuauTypeDef): string {
		let args = "<"
		typeDef.additionalArguments.forEach((type) => args += writeTypeDef(type))
		args += ">"

		if (typeDef.type != undefined) {
			return `${writeExpressions(new Array<LuauAst.LuauExpression>(typeDef.type))}${args != "<>" ? args : ""}`
		} else {
			return `(${typeDef.tupleArguments.map((f) => writeTypeDef(f)).join(", ")})`
		}
	}

	function writeLocals(locals: Array<LuauAst.LuauLocal>): string {
		let loc = []

		locals.forEach((local) => {
			let s = ""

			s += (local as LuauAst.LuauVarDef).name + `${(local as LuauAst.LuauVarDef).type != undefined ? `: ${writeTypeDef((local as LuauAst.LuauVarDef).type)} ` : ""}`
			loc.push(s)
		})

		return loc.join(", ")
	}

	function writeBinaryExpression(expression: LuauAst.LuauBinaryExpression): string {
		return `${writeExpressions(new Array<LuauAst.LuauExpression>((expression as LuauAst.LuauBinaryExpression).left))
			} ${(expression as LuauAst.LuauBinaryExpression).op
			} ${writeExpressions(new Array<LuauAst.LuauExpression>((expression as LuauAst.LuauBinaryExpression).right))
			}`
	}

	function writeFunctionCallExpression(expression: LuauAst.LuauFunctionCallExpression): string {
		if (expression.callee.expressionType != LuauAst.LuauExpressionType.Identifier) {
			return `(${writeExpressions(new Array<LuauAst.LuauExpression>(expression.callee))})(${writeExpressions(expression.args)})`
		} else {
			return `${writeExpressions(new Array<LuauAst.LuauExpression>(expression.callee))}(${writeExpressions(expression.args)})`
		}
	}

	function writeUnaryExpression(expression: LuauAst.LuauUnaryExpression): string {
		let expr = new Array<LuauAst.LuauExpression>(expression.expression)
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
		return `${indent()}local ${writeLocals(assignment.locals)} = ${writeExpressions(assignment.expressions)};\n`
	}

	function writeIfStatement(ifStmt: LuauAst.LuauIfStatement) {
		let out = ''

		// write the initial if
		out += `${indent()}if ${writeExpressions(new Array<LuauAst.LuauExpression>(ifStmt.condition))} then\n`
		indentLevel++
		ifStmt.trueBody.forEach((s) => { out += writeStatement(s) })
		indentLevel--

		// handle else-if chain
		let current: LuauAst.LuauIfStatement | undefined = ifStmt.elseIf
		let finalElseBody = ifStmt.elseBody
		while (current) {
			out += `${indent()}elseif ${writeExpressions(new Array<LuauAst.LuauExpression>(current.condition))} then\n`
			indentLevel++
			current.trueBody.forEach((s) => { out += writeStatement(s) })
			indentLevel--
			finalElseBody = current.elseBody
			current = current.elseIf
		}

		// write final else block if present
		if (finalElseBody) {
			out += `${indent()}else\n`
			indentLevel++
			finalElseBody.forEach((s) => { out += writeStatement(s) })
			indentLevel--
		}

		out += `${indent()}end\n`
		return out
	}

	function writeExpressionStatement(exprStmt: LuauAst.LuauExpressionStatement) {
		return `${indent()}${writeExpressions(new Array<LuauAst.LuauExpression>(exprStmt.expression))};\n`
	}

	function writeReturnStatement(values) {
		return `${indent()}return ${writeExpressions(values)}\n`
	}

	function writeStatement(statement: LuauAst.LuauStatement) {
		switch (statement.statementType) {
			case LuauAst.LuauStatementType.Assignment:
				return writeAssignment(statement as LuauAst.LuauAssignment)
				break
			case LuauAst.LuauStatementType.IfStatement:
				return writeIfStatement(statement as LuauAst.LuauIfStatement)
				break
			case LuauAst.LuauStatementType.ExpressionStatement:
				return writeExpressionStatement(statement as LuauAst.LuauExpressionStatement)
				break
			case LuauAst.LuauStatementType.ReturnStatement:
				return writeReturnStatement((statement as LuauAst.LuauReturnStatement).values)
				break
			default:
				return "-- Unknown Statement"
				break
		}
	}

	while (index < ast.statements.length) {
		let statement = ast.statements.at(index)
		source += writeStatement(statement)
		index++
	}

	return source
}

export function test() {
	let samples = [
		`
		let func = print;

		if func == print {
			func!("Hello world!");
		} else {
			func!("{}", 1 | 2 ^ 3 & (4 + 5))	
		}
		`
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