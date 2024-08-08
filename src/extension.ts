import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: "si-r" }, new OutlineProvider()));
}

// This method is called when your extension is deactivated
export function deactivate() { }

class OutlineProvider {

	async provideDocumentSymbols(document: vscode.TextDocument) {
		console.log('eval');
		let symbols: vscode.DocumentSymbol[] = [];
		let last_cmd = "";
		let last_start = document.lineAt(0).range.start;

		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			const cmd = line.text.substring(0, line.text.indexOf(' '));
			if (cmd === '' || cmd[0] === '#') {
				continue;
			}
			if (cmd !== last_cmd) {
				if (last_cmd !== "") {
					const range = new vscode.Range(last_start, document.lineAt(i-1).range.end);
					const symbol = new vscode.DocumentSymbol(last_cmd, '', vscode.SymbolKind.Field, range, range);
					symbols.push(symbol);
				}
				last_cmd = cmd;
				last_start = line.range.start;
			}
		}
		if (last_cmd !== "") {
			const range = new vscode.Range(last_start, document.lineAt(document.lineCount-1).range.end);
			const symbol = new vscode.DocumentSymbol(last_cmd, '', vscode.SymbolKind.Field, range, range);
			symbols.push(symbol);
		}
		return symbols;
	}

}