/** Updater.ts
 * This script downloads all files from my last commit in GH
 */
import { keypress } from 'cliffy/keypress';
import { showLogs } from './Util.ts';

interface GitFile {
	name: string;
	path: string;
	sha: string;
	size: number;
	url: string;
	html_url: string;
	git_url: string;
	download_url: string | null;
	type: 'dir' | 'file';
	_links: {
		self: string;
		git: string;
		html: string;
	};
}

async function silentMode(res: (value: unknown) => void) {
	for await (const event of keypress()) {
		if (event.key === 'escape') Deno.exit();

		// quando a tecla Q for pressionada
		if (event.key === 'q') localStorage.setItem('showLogs', '');
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
		if (Deno.args.includes('--dev') && f.name === 'Updater.ts') continue;
		// Don't download Updater.ts in dev time

		try {
			// Fetch file content
			const content = await fetch(f.download_url!);

			// Write the file
			await Deno.writeTextFile(f.path, await content.text());

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
