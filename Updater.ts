/** Updater.ts
 * Esse script vai escrever todos os arquivos TypeScript
 * do commit mais recente no GitHub
 */

// Baixando a lista de arquivos
const request = await fetch(
	`https://api.github.com/repos/Sunf3r/WiFi_Cloner/contents`,
);
// Filtrando o nome dos arquivos
const files: string[] = (await request.json())
	.map((file: { name: string }) => file.name);

for (const f of files) {
	if (!f.endsWith('.ts')) continue; // Apenas arquivos .TS

	let req;
	try {
		req = await fetch( // Lendo o arquivo
			`https://raw.githubusercontent.com/Sunf3r/WiFi_Cloner/master/${f}`,
		);
		console.log(
			`%c[UPDATER] %c- ${f} fetched!`,
			'color: cyan',
			'color: green',
		);

		// Escrevendo o arquivo
		await Deno.writeTextFile(`./${f}`, await req.text());
	} catch (e) {
		console.log(
			`%c[UPDATER] %c- Error when fetching %c${f}\n%c${e}`,
			'color: cyan',
			'color: red',
			'color: white; background-color: red',
			'color: red',
		);
	}
}

await import('./Main.ts');
