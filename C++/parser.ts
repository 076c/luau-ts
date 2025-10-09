import { Token } from "./tokenizer.js";

export enum NodeType {
    Unknown,
    Statement,
    Expression
}

export enum StatementType {
    Assignment,
}

export enum ExpressionType {
    IdentifierExpression,
}

export enum LocalType {

}

function parse(tokens: Array<Token>) {
    
}