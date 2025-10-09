export enum LuauNodeType {
	Statement,
	Expression
}

export enum LuauStatementType {
	Assignment,
	IfStatement,
	ExpressionStatement,
	ReturnStatement,
}

export enum LuauExpressionType {
	UnknownExpression,
	Number,
	Nil,
	String,
	Identifier,
	BinaryExpression,
	UnaryExpression,
	FunctionCall,
	ClosureExpression,
}

export enum LuauLocalType {
	VarDef,
	FuncDef,
}

export class LuauBaseNode {
	nodeType!: LuauNodeType

	constructor(nodeType: LuauNodeType) {
		this.nodeType = nodeType
	}
}

export class LuauStatement extends LuauBaseNode {
	statementType!: LuauStatementType

	constructor(statementType: LuauStatementType) {
		super(LuauNodeType.Statement)
		this.statementType = statementType
	}
}

export class LuauExpression extends LuauBaseNode {
	expressionType!: LuauExpressionType

	constructor(expressionType: LuauExpressionType) {
		super(LuauNodeType.Expression)
		this.expressionType = expressionType
	}
}

export class LuauIdentifierExpression extends LuauExpression {
	name!: string

	constructor(name: string) {
		super(LuauExpressionType.Identifier)
		this.name = name
	}
}

export class LuauStringExpression extends LuauExpression {
	string!: string

	constructor(string: string) {
		super(LuauExpressionType.String)
		this.string = string
	}
}

export class LuauNilExpression extends LuauExpression {
	constructor() { super(LuauExpressionType.Nil) }
}

export class LuauClosureExpression extends LuauExpression {
	chunk!: Array<LuauStatement>
	params!: Array<LuauVarDef>

	constructor(chunk: Array<LuauStatement>, params: Array<LuauVarDef>) {
		super(LuauExpressionType.ClosureExpression)
		this.chunk = chunk
		this.params = params
	}
}

export class LuauNumberExpression extends LuauExpression {
	number!: string

	constructor(number: string) {
		super(LuauExpressionType.Number)
		this.number = number
	}
}

export class LuauBinaryExpression extends LuauExpression {
	left!: LuauExpression
	op!: string
	right!: LuauExpression

	constructor(left: LuauExpression, op: string, right: LuauExpression) {
		super(LuauExpressionType.BinaryExpression)

		this.left = left
		this.op = op
		this.right = right
	}
}

export class LuauUnaryExpression extends LuauExpression {
	op!: string
	expression!: LuauExpression

	constructor(op: string, expression: LuauExpression) {
		super(LuauExpressionType.UnaryExpression)

		this.op = op
		this.expression = expression
	}
}

export class LuauFunctionCallExpression extends LuauExpression {
	callee!: LuauExpression
	args!: Array<LuauExpression>

	constructor(callee: LuauExpression, args: Array<LuauExpression>) {
		super(LuauExpressionType.FunctionCall)
		this.callee = callee
		this.args = args
	}
}

export class LuauUnknownExpression extends LuauExpression {
	constructor() {
		super(LuauExpressionType.UnknownExpression)
	}
}

export class LuauLocal {
	localType!: LuauLocalType

	constructor(localType: LuauLocalType) {
		this.localType = localType
	}
}

export class LuauTypeDef {
	tupleArguments: Array<LuauTypeDef> | undefined
	type!: LuauIdentifierExpression | undefined
	additionalArguments!: Array<LuauTypeDef>

	constructor(type: LuauIdentifierExpression | undefined, additionalArguments: Array<LuauTypeDef>, tupleArguments: Array<LuauTypeDef> | undefined) {
		this.type = type
		this.additionalArguments = additionalArguments
		this.tupleArguments = tupleArguments
	}
}

export class LuauVarDef extends LuauLocal {
	name!: string
	type!: LuauTypeDef

	constructor(name: string, type: LuauTypeDef) {
		super(LuauLocalType.VarDef)

		this.name = name
		this.type = type
	}
}

export class LuauAssignment extends LuauStatement {
	locals: Array<LuauLocal>
	expressions: Array<LuauExpression>

	constructor(locals: Array<LuauLocal>, expressions: Array<LuauExpression>) {
		super(LuauStatementType.Assignment)

		this.locals = locals
		this.expressions = expressions
	}
}

export class LuauReturnStatement extends LuauStatement {
	values: Array<LuauExpression>

	constructor(values: Array<LuauExpression>) {
		super(LuauStatementType.ReturnStatement)
		this.values = values
	}
}

export class LuauProgram {
	kind: "Program"
	statements!: Array<LuauStatement>

	constructor(statements: Array<LuauStatement>) {
		this.kind = "Program"
		this.statements = statements
	}
}

export class LuauIfStatement extends LuauStatement {
	condition!: LuauExpression
	trueBody!: Array<LuauStatement>
	elseIf!: LuauIfStatement | undefined
	elseBody!: Array<LuauStatement> | undefined

	constructor(condition: LuauExpression, trueBody: Array<LuauStatement>, elseIf: LuauIfStatement | undefined, elseBody: Array<LuauStatement> | undefined) {
		super(LuauStatementType.IfStatement)
		this.condition = condition
		this.trueBody = trueBody
		this.elseIf = elseIf
		this.elseBody = elseBody
	}
}

export class LuauExpressionStatement extends LuauStatement {
	expression!: LuauExpression

	constructor(expression: LuauExpression) {
		super(LuauStatementType.ExpressionStatement)
		this.expression = expression
	}
}