import { Expression, ExpressionType } from "../Rust/parser"

export enum LuauNodeType {
	Statement,
	Expression
}

export enum LuauStatementType {
	Assignment,
}

export enum LuauExpressionType {
	UnknownExpression,
	Number,
	String,
	Identifier,
	BinaryExpression,
	UnaryExpression,
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
	type!: LuauIdentifierExpression
	additionalArguments!: Array<LuauTypeDef>

	constructor(type: LuauIdentifierExpression, additionalArguments: Array<LuauTypeDef>) {
		this.type = type
		this.additionalArguments = additionalArguments
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

export class LuauProgram {
	kind: "Program"
	statements!: Array<LuauStatement>

	constructor(statements: Array<LuauStatement>) {
		this.kind = "Program"
		this.statements = statements
	}
}