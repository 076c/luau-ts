import * as Parser from './parser.js'
import * as LuauAst from './../Luau/ast.js'
import * as Tokenizer from './tokenizer.js'
import * as TypeMap from './type_map.js'

export interface CompileOptions {
	// Use the Roblox bindings (e.g game.GetService -> game:GetService)
	useRobloxBindings: boolean,

	// Optimise constants (e.g 1 + 1 -> 2)
	foldConstants: boolean,

	// Use Luau bindings (e.g println! -> print)
	useLuauBindings: boolean,

	// Add a main function export (e.g main();)
	useMainFuncExport: boolean,
}

// TODO:
// unfortunately, to get a Service or perform a NAMECALL operation, you have to call __namecall (literally)
// e.g 
// let x = __namecall(game, "GetService", "Players")
// Though this will be definitely removed in the future

export function transpile(program: Parser.Program, options: CompileOptions) {
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

		return new LuauAst.LuauTypeDef(transpileIdentifierExpression(typeDef.type), types, typeDef.tupleReturn && (typeDef.tupleReturn.map((f) => transpileTypeDef(f))))
	}

	function transpileExpression(expression: Parser.Expression) {
		switch (expression.expressionType) {
			case Parser.ExpressionType.Grouping:
				return new LuauAst.LuauGroupedExpression(transpileExpression((expression as Parser.GroupingExpression).expression))

			case Parser.ExpressionType.Identifier:
				return new LuauAst.LuauIdentifierExpression((expression as Parser.IdentifierExpression).name)
			case Parser.ExpressionType.String:
				return new LuauAst.LuauStringExpression((expression as Parser.StringExpression).string)
			case Parser.ExpressionType.Number:
				return new LuauAst.LuauNumberExpression((expression as Parser.NumberExpression).number)
			case Parser.ExpressionType.BinaryExpression:
				{
					let bin = expression as Parser.BinaryExpression
					let left = transpileExpression(bin.left)
					let right = transpileExpression(bin.right)
					// convert bitwise ops to bit32.* calls
					// TODO: format range expresions properly
					switch (bin.op) {
						case '&':
							return new LuauAst.LuauFunctionCallExpression(new LuauAst.LuauIdentifierExpression('bit32.band'), [left, right])
						case '|':
							return new LuauAst.LuauFunctionCallExpression(new LuauAst.LuauIdentifierExpression('bit32.bor'), [left, right])
						case '^':
							return new LuauAst.LuauFunctionCallExpression(new LuauAst.LuauIdentifierExpression('bit32.bxor'), [left, right])
						case '>>':
							return new LuauAst.LuauFunctionCallExpression(new LuauAst.LuauIdentifierExpression('bit32.rshift'), [left, right])
						case '<<':
							return new LuauAst.LuauFunctionCallExpression(new LuauAst.LuauIdentifierExpression('bit32.lshift'), [left, right])
						case '..':
							return new LuauAst.LuauFunctionCallExpression(new LuauAst.LuauIdentifierExpression('Range.new'), [left, right])
						default:
							let op
							switch (bin.op) {
								case '&&':
									op = 'and'
									break
								case '||':
									op = 'or'
									break
								default:
									op = bin.op
							}
							return new LuauAst.LuauBinaryExpression(left, op, right)
					}
				}
			case Parser.ExpressionType.UnaryExpression:
				return new LuauAst.LuauUnaryExpression((expression as Parser.UnaryExpression).op, transpileExpression((expression as Parser.UnaryExpression).expression))
			case Parser.ExpressionType.FunctionCall:
				let funcCall = expression as Parser.FunctionCallExpression
				if (options.useLuauBindings == true) {
					if (funcCall.callee.expressionType == Parser.ExpressionType.MemberExpression) {
						if ((funcCall.callee as Parser.MemberExpression).object.expressionType == Parser.ExpressionType.String) {
							if ((funcCall.callee as Parser.MemberExpression).property.expressionType == Parser.ExpressionType.Identifier && TypeMap.stringFuncMap[(((funcCall.callee as Parser.MemberExpression).property as Parser.IdentifierExpression).name)]) {
								return TypeMap.stringFuncMap[(((funcCall.callee as Parser.MemberExpression).property as Parser.IdentifierExpression).name)](transpileExpression((funcCall.callee as Parser.MemberExpression).object))
							}
						}
					}
					if (funcCall.callee.expressionType == Parser.ExpressionType.Identifier && TypeMap.funcMap[(funcCall.callee as Parser.IdentifierExpression).name]) {
						if (typeof TypeMap.funcMap[(funcCall.callee as Parser.IdentifierExpression).name] == "string") {
							return new LuauAst.LuauFunctionCallExpression(new LuauAst.LuauIdentifierExpression(TypeMap.funcMap[(funcCall.callee as Parser.IdentifierExpression).name]), funcCall.args.map((e) => transpileExpression(e)))
						} else {
							return TypeMap.funcMap[(funcCall.callee as Parser.IdentifierExpression).name](funcCall.args.map((e) => transpileExpression(e)))
						}
					}
					if ((funcCall.callee.expressionType == Parser.ExpressionType.Identifier && ((funcCall.callee as Parser.IdentifierExpression).name == "__namecall"))) {
						return new LuauAst.LuauNameCallExpression(transpileExpression((expression as Parser.FunctionCallExpression).args[0]), ((expression as Parser.FunctionCallExpression).args[1].expressionType == Parser.ExpressionType.String ? ((expression as Parser.FunctionCallExpression).args[1] as Parser.StringExpression).string : ((expression as Parser.FunctionCallExpression).args[1] as Parser.IdentifierExpression).name), (expression as Parser.FunctionCallExpression).args.slice(2).map((e) => transpileExpression(e)))
					}
				}
				return new LuauAst.LuauFunctionCallExpression(transpileExpression((expression as Parser.FunctionCallExpression).callee), (expression as Parser.FunctionCallExpression).args.map((e) => transpileExpression(e)))
			case Parser.ExpressionType.MatchExpression:
				/*
					TODO:
					let val = match comp {
						x => something(),
						y => something_else(),
						z => other(),
						_ => panic!()
					}
					->
					local val
					if comp == x then
						val = something()
					elseif comp == y then
						val = something_else()
					elseif comp == z then
						val = other
					else
						val = panic()
					end
					CURRENT:
					local val = (function()
						if comp == x then
							return something()
						elseif comp == y then
							return something_else()
						elseif comp == z then
							return other()
						else
							return panic()
						end
					end)
				*/
				// TODO: I(C) := C
				let match = (expression as Parser.MatchExpression)
				let statements = []

				let handleCase = (c: Parser.MatchCase) => {
					let comparison = new LuauAst.LuauBinaryExpression(transpileExpression(match.comparator), '==', transpileExpression(c.comparator))
					if (c.comparator.expressionType == Parser.ExpressionType.Identifier && (c.comparator as Parser.IdentifierExpression).name == '_') {
						c.body.statements.forEach((stmt) => {
							statements.push(transpileStatement(stmt))
						})
						return
					}

					let ifStmt = new LuauAst.LuauIfStatement(comparison, c.body.statements.map((stmt) => transpileStatement(stmt)), undefined, undefined)
					statements.push(ifStmt)
				}

				match.cases.forEach((c: Parser.MatchCase) => {
					handleCase(c)
				})

				return new LuauAst.LuauFunctionCallExpression(new LuauAst.LuauClosureExpression(statements, []), [])
			case Parser.ExpressionType.FieldExpression:
				return new LuauAst.LuauFieldExpression(transpileExpression((expression as Parser.FieldExpression).object), transpileExpression((expression as Parser.FieldExpression).property))
			case Parser.ExpressionType.MemberExpression:
				return new LuauAst.LuauMemberExpression(transpileExpression((expression as Parser.MemberExpression).object), transpileExpression((expression as Parser.MemberExpression).property))
			case Parser.ExpressionType.PathExpression:
				return new LuauAst.LuauMemberExpression(transpileExpression((expression as Parser.PathExpression).object), transpileExpression((expression as Parser.PathExpression).property))
			case Parser.ExpressionType.ClosureExpression:
				return new LuauAst.LuauClosureExpression((expression as Parser.ClosureExpression).body.statements.map((stmt) => transpileStatement(stmt)), (expression as Parser.ClosureExpression).args.map((p) => transpileVarDef(p)))
			default:
				return new LuauAst.LuauUnknownExpression()
		}
	}

	function transpileStatement(statement: Parser.Statement): LuauAst.LuauStatement | undefined {
		switch (statement.statementType) {
			case Parser.StatementType.Assignment: {
				let variables = new Array<LuauAst.LuauVarDef>()
				let assignment = statement as Parser.Assignment
				assignment.locals.forEach((local) => variables.push(transpileVarDef(local as Parser.VarDef)))

				let expressions = new Array<LuauAst.LuauExpression>()
				assignment.values.forEach((e) => expressions.push(transpileExpression(e)))

				return new LuauAst.LuauAssignment(variables, expressions)
			}
			case Parser.StatementType.ExpressionStatement: {
				let exprStmt = statement as any
				let e = transpileExpression(exprStmt.expression)
				return new LuauAst.LuauExpressionStatement(e)
			}
			case Parser.StatementType.IfStatement: {
				let ifs = statement as Parser.IfStatement
				let condition = transpileExpression(ifs.condition)
				// transpile trueBody chunk
				let trueBody: Array<LuauAst.LuauStatement> = []
				ifs.trueBody.statements.forEach((s) => {
					let ts = transpileStatement(s)
					if (ts) trueBody.push(ts)
				})

				let elseIf: LuauAst.LuauIfStatement | undefined = undefined
				if (ifs.elseIfStatement) {
					let eIf = transpileStatement(ifs.elseIfStatement) as LuauAst.LuauIfStatement
					elseIf = eIf
				}

				let elseBody: Array<LuauAst.LuauStatement> | undefined = undefined
				if (ifs.elseBody) {
					// elseBody may be a Chunk or an IfStatement depending on parser handling; handle both
					if ((ifs.elseBody as any).statements) {
						elseBody = []
							; (ifs.elseBody as any).statements.forEach((s: Parser.Statement) => {
								let ts = transpileStatement(s)
								if (ts) elseBody!.push(ts)
							})
					} else {
						// elseBody might be an IfStatement in some parser constructions; wrap it as an elseif
						let nestedIf = transpileStatement(ifs.elseBody as Parser.IfStatement) as LuauAst.LuauIfStatement
						elseBody = undefined
						// signal elseif by assigning to elseIf
						elseIf = nestedIf
					}
				}

				return new LuauAst.LuauIfStatement(condition, trueBody, elseIf, elseBody)
			}
			case Parser.StatementType.ReturnStatement: {
				let retStmt = statement as Parser.ReturnStatement
				let expressions = retStmt.expressions.map((e) => transpileExpression(e))
				return new LuauAst.LuauReturnStatement(expressions)
			}
			case Parser.StatementType.EnumStatement: {
				let enumStmt = statement as Parser.EnumStatement
				let enumIndex = 0
				let members = enumStmt.members.map((m) => {
					let def = new LuauAst.LuauVarDef(m, undefined)
					let val = new LuauAst.LuauNumberExpression(enumIndex.toString())
					enumIndex++
					return { key: def, value: val }
				})
				return new LuauAst.LuauAssignment([new LuauAst.LuauVarDef(enumStmt.name, undefined)], [new LuauAst.LuauDictionaryExpression(members)])
			}
			case Parser.StatementType.FunctionDeclarationStatement: {
				let funcStmt = statement as Parser.FunctionDeclarationStatement
				let funcDef = new LuauAst.LuauFuncDef(funcStmt.funcDef.funcName, funcStmt.funcDef.params.map((p) => transpileVarDef(p)), funcStmt.funcDef.returnType && transpileTypeDef(funcStmt.funcDef.returnType))
				let body = funcStmt.body.map((s) => transpileStatement(s))
				return new LuauAst.LuauFunctionDeclarationStatement(funcDef, body)
			}
			case Parser.StatementType.CommentStatement: {
				let commentStmt = statement as Parser.CommentStatement
				return new LuauAst.LuauCommentStatement(commentStmt.comment)
			}
			default:
				return new LuauAst.LuauExpressionStatement(new LuauAst.LuauUnknownExpression())
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

		let ts = transpileStatement(statement)
		if (ts) statements.push(ts)

		index++
	}

	if (options.useMainFuncExport == true) {
		let mainFuncExport = undefined;
		statements.forEach((stmt) => {
			if (stmt.statementType == LuauAst.LuauStatementType.FunctionDeclarationStatement) {
				let funcStmt = stmt as LuauAst.LuauFunctionDeclarationStatement
				if (funcStmt.funcDef.funcName == "main") {
					mainFuncExport = funcStmt
				}
			}
		})

		if (mainFuncExport) {
			statements.push(
				new LuauAst.LuauExpressionStatement(
					new LuauAst.LuauFunctionCallExpression(
						new LuauAst.LuauIdentifierExpression("main"), []
					)
				)
			)
		} else {
			transpilerError("useMainFuncExport is enabled but no main function was found", undefined)
		}
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