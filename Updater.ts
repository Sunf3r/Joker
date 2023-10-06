/** Updater.ts
 * This script downloads all files from my last commit in GH
 */
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

const showLogs = !Deno.args.includes('-q');

async function getUpdates(path: string) {
	// Fetch file list
	const request = await fetch(path);

	const data: GitFile[] = await request.json();

	const files: GitFile[] = [];
	for (const f of data) {
		if (f.type === 'dir') {
			await Deno.mkdir(`./${f.path}`, { recursive: true });

			files.push(...(await getUpdates(`${path}/${f.name}`)));
			continue;
		}

		files.push(f);
	}

	return files;
}

// deno-lint-ignore no-async-promise-executor
await new Promise(async (res, rej) => {
	setTimeout(() => res(true), 5_000);
	// Resolve the promise if the download take more than 5 seconds

	const files = await getUpdates(`https://api.github.com/repos/Sunf3r/Joker/contents`);

	showLogs && console.log(
		`%c[UPDATER] %c- ${files!.length} files found.`,
		'color: cyan;',
		'color: green;',
	);

	for (const f of files!) {
		console.log(f.name);

		if (f.name === 'Main.ts') continue; // Don't download Main.ts
		if (Deno.args.includes('--dev') && f.name === 'Updater.ts') continue;
		// Don't download Updater.ts in dev time

		try {
			// Fetch file content
			const content = await fetch(f.download_url!);

			// Write the file
			await Deno.writeTextFile(f.path, await content.text());

			showLogs && console.log(
				`%c[UPDATER] %c- ${f.name} update.`,
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
		showLogs && console.log(
			`%c[UPDATER] %c- ${e}`,
			'color: cyan',
			'color: red',
			'color: white; background-color: red',
			'color: red',
		)
	);

// await import('./Collector.ts');
