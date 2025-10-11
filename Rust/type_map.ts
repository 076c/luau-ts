// Type mappings Rust->Luau
// This file should be auto-generated

import * as LuauAst from "../Luau/ast.js"

// Map known Rust functions to Luau bindings .e.g print! -> print
export let funcMap = {
    "println": "print",
    "panic": "error"
}

// Define functions for `string`
// e.g `to_string()` -> `tostring(self)`
export let stringFuncMap = {
    "to_string": (self: LuauAst.LuauExpression) => new LuauAst.LuauFunctionCallExpression(new LuauAst.LuauIdentifierExpression("tostring"), [self])
}

