import { SpinnerTypes, TerminalSpinner } from '@spinners';
import { keypress } from '@cliffy/keypress';
import { Select } from '@cliffy/select';
import { DateTime } from '@luxon';
import colors from '@colors';
import { delay } from '@std';
import qr from '@qrcode';

// Title.txt contém uma string colorida bem cringe
const title: string = await Deno.readTextFile('Title.txt')
	.catch(() => '');

let showLogs: boolean | number = true;
/** showLogs
 * Se for false, nada será exibido no console
 * e os delays serão desativados
 */

const sleep = (timeout: number) => showLogs ? delay(timeout) : null;
/** sleep()
 * Função intermediária para delay()
 * verifica se o silent mode is on
 */

let currentMenu: string; // string exibida no sector do spinner
colors;
menu(); // Abre o menu

async function menu() {
	console.clear(); // Limpa o console
	console.log(title);

	// Solicita uma opção para prosseguir
	const input: string = await Select.prompt({
		message: 'Escolha uma ferramenta:',
		options: [
			{ name: '- Injetar Trojan:Wi-FiCloner', value: '1' },
			{ name: '- Instalar Backdoor', value: '2', disabled: true },
			{ name: '- Copiar chave de ativação', value: '3' },
			// Select.separator('--------'),
			{ name: '- Apagar registros', value: '4' },
			{ name: '- Encerrar', value: '0' },
		],
	});

	silentMode();
	/** SilentMode()
	 * Ativa o Listener para o teclado
	 * Coloquei essa função após o menu pois pode causar
	 * conflitos com o Listener do Select Menu
	 */

	switch (input) {
		case '0':
			// Se o usuário cancelar
			console.clear();
			Deno.exit();
		/* falls through */
		case '1':
			// "injetar trojan" vulgo acessar uma API nativa do Windows
			await NetSHProfileCollector();
			break;
		case '2':
			// Instalar backdoor kjkkjkkkjkjkjkkjk
			break;
		case '3':
			// Copiar key do Windows
			await copyWinKey();
			break;
		case '4':
			// Limpar registros de arquivos
			await clearTraces();
			break;
	}

	// Encerrando...
	Deno.exit();
}

async function NetSHProfileCollector() {
	currentMenu = 'Wi-Fi CLONER';

	Deno.mkdir('.tempdata') // Cria pasta de arquivos temporários (se não existir)
		.catch(() => {});

	Deno.mkdir('WiFiPasswords') // Cria pasta de senhas (se não existir)
		.catch(() => {});

	// Chama a API do Windows
	await executeCommand(
		'netsh wlan export profile key=clear folder=.tempdata',
	);

	let counter = 0;
	/** counter
	 * Fiz um counter manual pois o readDir retorna um Iterable<Deno.DirEntry>
	 * e eu não quis quebrar a cabeça com algo tão fútil quanto pegar o length disso
	 */

	const timestamp = DateTime.now()
		.setZone('America/Sao_Paulo')
		.setLocale('pt')
		.toFormat('DDDD'); // Data formatada

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
		let wifiQR;
		qr.generate(
			`WIFI:S:${SSID};T:${security};P:${password};H:false;;`,
			{ small: true },
			(qrCode: string) => wifiQR = qrCode,
		);

		// Escrevendo arquivos com as informações filtradas no diretório final
		await Deno.writeTextFile(
			`WiFiPasswords/${SSID}.txt`,
			`SSID: ${SSID}\nData: ${timestamp}\nSegurança: ${security}\nSenha: ${password}\n\n${wifiQR}`,
		);
	}

	const statuses = [
		['Preparando servidor Proxy...', 'Proxy #0 operante.'],
		['Injetando Trojan na API do NetSH...', 'Script injetado.'],
		['Modificando permissões do Windows...', 'Permissões concedidas.'],
		[
			'Abrindo porta no FireWall...',
			'FireWall desbloqueado na porta 8080.',
		],
		['Testando servidor Proxy...', 'Conexão estabilizanda.'],
	];

	for (const status of statuses) { // Exibe status fakes pra impressionar leigos
		await createFakeStatus(status[0], status[1]);
	}

	const spinner = new Spinner('Clonando redes Wi-Fi...');
	spinner.end(`${counter} redes clonadas.`);

	await clearTraces(); // Limpar registros
}

async function copyWinKey() {
	currentMenu = 'KEY CLONER';

	const status = new Spinner('Obtendo chave de ativação...');
	await sleep(3_000);

	const key = (await executeCommand(
		'wmic path softwarelicensingservice get OA3xOriginalProductKey',
	)).split('\n')[1];

	status.end(
		`Chave de ativação obtida:\n\n${key}`,
	);

	Deno.mkdir('WindowsKeys') // Cria pasta de chaves do Windows (se não existir)
		.catch(() => {});

	Deno.writeTextFileSync(
		`WindowsKeys/${Deno.hostname()}.txt`,
		`Machine: ${Deno.hostname()}\nWindows License Key: ${key}`,
	);
}

async function clearTraces() {
	currentMenu = 'CLEANER';

	const status = new Spinner('Apagando registros...');
	await sleep(random(500, 3_000));

	await Deno.remove('.tempdata', { recursive: true })
		// 'recursive' significa que é pra apagar mesmo se tiver arquivos dentro
		.then(() => status.end('Registros excluídos.'))
		.catch(() => status.fail('Nada para excluir.'));
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

async function createFakeStatus(loadingMsg: string, completeMsg: string) {
	const status = new Spinner(loadingMsg, currentMenu);

	await sleep(random(1_000, 3_500));
	status.end(completeMsg);
}

function random(min: number, max: number) {
	// Retorna um número aleatório entre min e max
	return Math.floor(Math.random() * (max - min) + min);
}

async function silentMode() {
	for await (const event of keypress()) {
		if (event.ctrlKey && event.key === 'c') Deno.exit();

		// quando a tecla S for pressionada
		if (event.key === 's') showLogs = false;
		// ativa o silent mode
	}
}

class Spinner {
	sector: string;
	text: string;
	spinner: TerminalSpinner | undefined;

	constructor(text: string, sector?: string) {
		this.sector = sector || currentMenu;
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
		const now = DateTime.now()
			.setZone('America/Sao_Paulo')
			.setLocale('pt')
			.toFormat('T');

		return [ // Modelo de string
			'[',
			this.sector.toUpperCase().cyan, // [ SECTOR
			'|',
			now.yellow, // [ SECTOR | 18:04
			'] -',
			this.text,
		].join(' '); // [ SETOR | 18:04 ] - TEXT
	}
}
