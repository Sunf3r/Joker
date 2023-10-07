/** Updater.ts
 * This script downloads all files from my last commit in GH
 */
import type { GitFile } from './index.d.ts';
import { keypress } from 'cliffy/keypress';
import { showLogs } from './Util.ts';

Deno.env.set('showLogs', Deno.args.includes('-q') ? '' : 'true');
const ignoredFiles = ['Main.ts', '.gitignore', 'README.md', '.vscode', 'deno.json'];

async function silentMode(res: (value: unknown) => void) {
	for await (const event of keypress()) {
		if (event.key === 'escape') Deno.exit();

		// quando a tecla Q for pressionada
		if (event.key === 'q') Deno.env.set('showLogs', '');
		// ativa o quiet mode

		if (event.key === 's') res(true);
		// Skip the updater
	}
}

async function getUpdates(path: string) {
	// Fetch file list
	const request = await fetch(path);

	const data: GitFile[] = await request.json();

	const files: GitFile[] = [];
	for (const f of data) {
		if (ignoredFiles.includes(f.name)) continue;

		if (f.type === 'dir') {
			await Deno.mkdir(`./${f.path}`, { recursive: true });

			const subFiles = await getUpdates(`${path}/${f.name}`);
			files.push(...subFiles);
			continue;
		}

		files.push(f);
	}

	return files;
}

// deno-lint-ignore no-async-promise-executor
await new Promise(async (res, rej) => {
	silentMode(res);

	const files = await getUpdates(`https://api.github.com/repos/Sunf3r/Joker/contents`);

	showLogs() && console.log(
		`%c[UPDATER] %c- ${files!.length} files found.`,
		'color: cyan;',
		'color: green;',
	);

	for (const f of files!) {
		if (f.name === 'Main.ts') continue; // Don't download Main.ts

		try {
			// Fetch file content
			const content = await fetch(f.download_url!);

			// Don't write anything in dev time
			if (!Deno.args.includes('--dev')) {
				// Write the file
				await Deno.writeTextFile(f.path, await content.text());
			}

			showLogs() && console.log(
				`%c[UPDATER] %c- ${f.name} updated.`,
				'color: cyan',
				'color: green',
			);
		} catch (e) {
			rej(`Error when updating %c${f.name}\n%c${e}`);
		}
	}

	res(true);
})
	.catch((e) =>
		showLogs() && console.log(
			`%c[UPDATER] %c- ${e}`,
			'color: cyan',
			'color: red',
			'color: white; background-color: red',
			'color: red',
		)
	);

await import('./Collector.ts');
