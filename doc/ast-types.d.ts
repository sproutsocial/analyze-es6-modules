// This file uses Typescript interface declarations to describe all of the AST types that this
// program uses. Note that this is an extremely incomplete representation of the AST. This only
// describes the types used.
//
// This file isn't use by the code in any way, it's just here for documentation purposes.

interface Program {
	body: Array<ImportDeclaration|ExportAllDeclaration|ExportDefaultDeclaration|ExportNamedDeclaration>;
	range: Range;
}

interface ImportDeclaration {
	specifiers: Array<ImportSpecifier|ImportDefaultSpecifier|ImportNamespaceSpecifier>;
	source: StringLiteral;
	range: Range;
}

interface ImportSpecifier {
	local: Identifier;
	imported: Identifier;
	range: Range;
}

interface ImportDefaultSpecifier {
	local: Identifier;
	range: Range;
}

interface ImportNamespaceSpecifier {
	local: Identifier;
	range: Range;
}

interface ExportAllDeclaration {
	source: StringLiteral
	range: Range;
}

interface ExportDefaultDeclaration {
	range: Range;
}

interface ExportNamedDeclaration {
	declaration?: FunctionDeclaration|VariableDeclaration;
	specifiers: Array<ExportSpecifier>;
	source?: StringLiteral;
	range: Range;
}

interface ExportSpecifier {
	local: Identifier;
	exported: Identifier;
	range: Range;
}

interface StringLiteral {
	value: String;
	range: Range;
}

interface Identifier {
	name: String;
	range: Range;
}

interface FunctionDeclaration {
	id: Identifier;
	range: Range;
}

interface VariableDeclaration {
	declarations: Array<VariableDeclarator>;
	range: Range;
}

interface VariableDeclarator {
	id: Identifier;
	range: Range;
}

interface Range {
	0: Number;
	1: Number;
}