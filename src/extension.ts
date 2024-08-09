import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: "si-r" }, new OutlineProvider()));
}

// This method is called when your extension is deactivated
export function deactivate() { }

const COMMANDS = ["vlan", "lan", "acl", "ether", "pseudo-ether", "aaa", "template", "remote", "host", "tracking", "node-trigger", "congestion-trigger", "internal-path", "schedule"];
const COMMANDS_DESCRIPTION = ["vlan", "lan", "acl", "pseudo-ether", "ether", "template", "remote"];
const COMMANDS_NAME = ["remote", "vlan", "host", "template", "aaa"];

class OutlineProvider {

	async provideDocumentSymbols(document: vscode.TextDocument) {
		let symbols: vscode.DocumentSymbol[] = [];
		let last_cmd = "";
		let last_start = document.lineAt(0).range.start;
		let last_start_sub = last_start;
		let last_cmd_number = "";
		let cmd_description = "";
		let cmd_description_sub = "";
		let symbol_children: vscode.DocumentSymbol[] = [];

		const detail = () => {
			if (cmd_description === "") {
				return cmd_description_sub;
			} else if (cmd_description_sub === "") {
				return cmd_description;
			}
			return cmd_description + " (" + cmd_description_sub + ")";
		};

		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			const cmd = line.text.substring(0, line.text.indexOf(' '));
			if (cmd === '' || cmd[0] === '#') {
				continue;
			}
			if (cmd !== last_cmd) {
				if (last_cmd !== "") {
					const range = new vscode.Range(last_start, document.lineAt(i - 1).range.end);
					let symbol = new vscode.DocumentSymbol(last_cmd, '', vscode.SymbolKind.Function, range, range);
					if (last_cmd_number !== "") {
						symbol.kind = vscode.SymbolKind.Array;

						const range_sub = new vscode.Range(last_start_sub, document.lineAt(i - 1).range.end);
						symbol_children.push(new vscode.DocumentSymbol(last_cmd_number.toString(), detail(), vscode.SymbolKind.Field, range_sub, range_sub));

						symbol.children = symbol_children;
						symbol_children = [];
						last_cmd_number = "";
						cmd_description = "";
						cmd_description_sub = "";
					}
					symbols.push(symbol);
				}
				last_cmd = cmd;
				last_start = line.range.start;
			}

			if (COMMANDS.includes(cmd)) {
				// ex. vlan <number>
				const line_list = line.text.split(/\s+/);
				if (Number.isNaN(Number(line_list[1]))) {
					continue;
				}
				let cmd_number = line_list[1];
				
				// Si-R G: ether <group> <port>
				if (line_list.length > 3 && line_list[0] === "ether" && !Number.isNaN(Number(line_list[2]))){
					cmd_number = cmd_number + "-" + line_list[2];
				}

				if (cmd_number !== last_cmd_number) {
					if (last_cmd_number !== "") {
						// add symbol
						const range = new vscode.Range(last_start_sub, document.lineAt(i - 1).range.end);
						const symbol = new vscode.DocumentSymbol(last_cmd_number.toString(), detail(), vscode.SymbolKind.Field, range, range);
						symbol_children.push(symbol);
					}
					last_cmd_number = cmd_number;
					last_start_sub = line.range.start;
					cmd_description = "";
					cmd_description_sub = "";
				}

				if (line_list.length === 4 && line_list[2] === "description" && COMMANDS_DESCRIPTION.includes(line_list[0])) {
					// ex. vlan 1 description XXXX
					cmd_description_sub = line_list[3];
				} else if (line_list.length === 5 && line_list[3] === "description" && line_list[0] === "ether"){
					// ex. ether 1 1 description XXXX  (for Si-R G)
					cmd_description_sub = line_list[4];
				} else if (line_list.length === 4 && line_list[2] === "name" && COMMANDS_NAME.includes(line_list[0])){
					// ex. vlan 1 name XXXX
					cmd_description = line_list[3];
				} else if (line_list.length === 6 && line_list[0] === "lan" && line_list[2] === "ip" && line_list[3] === "address") {
					// ex. lan 1 ip address 192.168.10.1/24 3
					cmd_description = line_list[4];
				}
			} else {
				last_cmd_number = "";
				cmd_description = "";
				cmd_description_sub = "";
			}
		}
		if (last_cmd !== "") {
			const range = new vscode.Range(last_start, document.lineAt(document.lineCount - 1).range.end);
			let symbol = new vscode.DocumentSymbol(last_cmd, '', vscode.SymbolKind.Function, range, range);
			if (last_cmd_number !== "") {
				symbol.kind = vscode.SymbolKind.Array;
				const range_sub = new vscode.Range(last_start_sub, document.lineAt(document.lineCount - 1).range.end);
				symbol_children.push(new vscode.DocumentSymbol(last_cmd_number.toString(), detail(), vscode.SymbolKind.Field, range_sub, range_sub));
				symbol.children = symbol_children;
			}
			symbols.push(symbol);
		}
		return symbols;
	}

}