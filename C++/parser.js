"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalType = exports.ExpressionType = exports.StatementType = exports.NodeType = void 0;
var NodeType;
(function (NodeType) {
    NodeType[NodeType["Unknown"] = 0] = "Unknown";
    NodeType[NodeType["Statement"] = 1] = "Statement";
    NodeType[NodeType["Expression"] = 2] = "Expression";
})(NodeType || (exports.NodeType = NodeType = {}));
var StatementType;
(function (StatementType) {
    StatementType[StatementType["Assignment"] = 0] = "Assignment";
})(StatementType || (exports.StatementType = StatementType = {}));
var ExpressionType;
(function (ExpressionType) {
    ExpressionType[ExpressionType["IdentifierExpression"] = 0] = "IdentifierExpression";
})(ExpressionType || (exports.ExpressionType = ExpressionType = {}));
var LocalType;
(function (LocalType) {
})(LocalType || (exports.LocalType = LocalType = {}));
function parse(tokens) {
}
