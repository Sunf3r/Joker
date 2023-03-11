import { DateTime } from '@luxon';

export function rand(min = 500, max = 2_500) {
	return Math.floor(Math.random() * (max - min) + min);
}

export function getNow(timeOrFmt: string | boolean = false) {
	// true para timestamp, string para formatação
	const now = DateTime.now()
		.setLocale('pt')
		.setZone('America/Sao_Paulo');

	return timeOrFmt === true ? now.ts : now.toFormat(timeOrFmt || 'DDDD');
}

export function clearTags(matches: IterableIterator<RegExpMatchArray>) {
	// Regex pra filtrar as tags do XML
	const networks: string[][] = [];

	for (const match of matches) {
		networks.push([
			String(match[0]).replace(/<.*?>/g, ''), // nome da rede
			match[0], // tag HTML da rede
		]);
	}

	return networks;
}

export function createHTML(title: string, body: string) {
	const factors = [
		['\n', '<br>\n'],
		['<s', '<strong>'],
		['s>', '</strong>'],
	];
	for (const factor of factors) body = body.replaceAll(factor[0], factor[1]);

	return `<!DOCTYPE html>\n<html lang="pt-BR">\n<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title}</title>
</head>\n<body> ${body}\n</body>\n</html>
`;
}

export async function checkDirs() {
	const folders = ['data', 'temp', 'data/WiFiPasswords', 'data/WindowsKeys'];

	for (const f of folders) await Deno.mkdir(f).catch(() => {});
}
