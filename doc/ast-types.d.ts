// This file uses Typescript interface declarations to describe all of the AST types that this
// program uses. Note that this is an extremely incomplete representation of the AST. This only
// describes the types used.
//
// This file isn't use by the code in any way, it's just here for documentation purposes.

interface Program {
	body: Array<ImportDeclaration|ExportAllDeclaration|ExportDefaultDeclaration|ExportNamedDeclaration>;
}

interface ImportDeclaration {
	specifiers: Array<ImportSpecifier|ImportDefaultSpecifier|ImportNamespaceSpecifier>;
	source: StringLiteral;
}

interface ImportSpecifier {
	local: Identifier;
	imported: Identifier;
}

interface ImportDefaultSpecifier {
	local: Identifier;
}

interface ImportNamespaceSpecifier {
	local: Identifier;
}

interface ExportAllDeclaration {
	source: StringLiteral
}

interface ExportDefaultDeclaration {

}

interface ExportNamedDeclaration {
	declaration?: FunctionDeclaration|VariableDeclaration;
	specifiers: Array<ExportSpecifier>;
	source?: StringLiteral;
}

interface ExportSpecifier {
	local: Identifier;
	exported: Identifier;
}

interface StringLiteral {
	value: String;
}

interface Identifier {
	name: String;
}

interface FunctionDeclaration {
	id: Identifier;
}

interface VariableDeclaration {
	declarations: Array<VariableDeclarator>;
}

interface VariableDeclarator {
	id: Identifier;
}