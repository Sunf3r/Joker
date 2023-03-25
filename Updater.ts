/** Updater.ts
 * Esse script vai ler e escrever todos os arquivos TypeScript
 * do commit mais recente no GitHub
 */

const showLogs = !Deno.args.includes('-q');

try {
	// Baixando a lista de arquivos
	const request = await fetch(
		`https://api.github.com/repos/Sunf3r/WiFi_Cloner/contents`,
	);

	// Filtrando o nome dos arquivos
	const files: string[] = (await request.json())
		.map((file: { name: string }) => file.name);

	showLogs && console.log(
		`%c[UPDATER] %c- ${files.length} arquivos encontrados!`,
		'color: cyan',
		'color: green',
	);

	for (const f of files) {
		if (!f.endsWith('.ts') && !f.endsWith('.vbs')) continue; // Apenas arquivos .TS e .VBS
		if (f === 'Main.ts') continue; // Não baixar o arquivo Main.ts pq ele é o executável
		if (Deno.args.includes('--dev') && f === 'Updater.ts') continue;
		// Não atualizar o updater enquanto estiver em dev time

		let req;
		try {
			req = await fetch( // Lendo o arquivo
				`https://raw.githubusercontent.com/Sunf3r/WiFi_Cloner/master/${f}`,
			);

			// Escrevendo o arquivo
			await Deno.writeTextFile(`./${f}`, await req.text());

			showLogs && console.log(
				`%c[UPDATER] %c- ${f} atualizado!`,
				'color: cyan',
				'color: green',
			);
		} catch (e) {
			showLogs && console.log(
				`%c[UPDATER] %c- Erro ao atualizar o arquivo %c${f}\n%c${e}`,
				'color: cyan',
				'color: red',
				'color: white; background-color: red',
				'color: red',
			);
		}
	}
} catch (e) {
	showLogs && console.log(
		`%c[UPDATER] %c- Erro geral:\n${e}`,
		'color: cyan',
		'color: red',
	);
} finally {
	await import('./Collector.ts');
}
