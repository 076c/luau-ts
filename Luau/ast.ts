export enum LuauNodeType {
	Statement,
	Expression
}

export enum LuauStatementType {
	Assignment,
	IfStatement,
	ExpressionStatement,
	ReturnStatement,
	FunctionDeclarationStatement,
	CommentStatement,
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
	MemberExpression,
	FieldExpression,
	DictionaryExpression,
	NameCallExpression,
	GroupedExpression
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

export class LuauNameCallExpression extends LuauExpression {
	callee!: LuauExpression
	method!: string
	args!: Array<LuauExpression>

	constructor(callee: LuauExpression, method: string, args: Array<LuauExpression>) {
		super(LuauExpressionType.NameCallExpression)
		this.callee = callee
		this.method = method
		this.args = args
	}
}

export class LuauMemberExpression extends LuauExpression {
	object!: LuauExpression
	property!: LuauExpression

	constructor(object: LuauExpression, property: LuauExpression) {
		super(LuauExpressionType.MemberExpression)
		this.object = object
		this.property = property
	}
}

export class LuauFieldExpression extends LuauExpression {
	object!: LuauExpression
	property!: LuauExpression

	constructor(object: LuauExpression, property: LuauExpression) {
		super(LuauExpressionType.FieldExpression)
		this.object = object
		this.property = property
	}
}

export class LuauDictionaryExpression extends LuauExpression {
	keyValuePairs!: Array<{ key: LuauVarDef, value: LuauExpression }>

	constructor(keyValuePairs: Array<{ key: LuauVarDef, value: LuauExpression }>) {
		super(LuauExpressionType.DictionaryExpression)
		this.keyValuePairs = keyValuePairs
	}
}

export class LuauFunctionDeclarationStatement extends LuauStatement {
	funcDef!: LuauFuncDef
	body!: Array<LuauStatement>

	constructor(funcDef: LuauFuncDef, body: Array<LuauStatement>) {
		super(LuauStatementType.FunctionDeclarationStatement)
		this.funcDef = funcDef
		this.body = body
	}
}

export class LuauGroupedExpression extends LuauExpression {
	expression!: LuauExpression

	constructor(expression: LuauExpression) {
		super(LuauExpressionType.GroupedExpression)
		this.expression = expression
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

export class LuauFuncDef extends LuauLocal {
	funcName!: string
	params!: Array<LuauVarDef>
	returnType: LuauTypeDef | undefined

	constructor(funcName: string, params: Array<LuauVarDef>, returnType: LuauTypeDef | undefined) {
		super(LuauLocalType.FuncDef)
		this.funcName = funcName
		this.params = params
		this.returnType = returnType
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

export class LuauCommentStatement extends LuauStatement {
	comment!: string

	constructor(comment: string) {
		super(LuauStatementType.CommentStatement)
		this.comment = comment
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