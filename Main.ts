import { TerminalSpinner } from '@spinners';
import { Select } from '@cliffy/select';
import colors from '@colors';
import { delay } from '@std';

// Title.txt contém uma string colorida bem cringe
const title: string = await Deno.readTextFile('Title.txt')
	.catch(() => '');

let currentMenu: string;
colors;
menu(); // Abre o menu

async function menu() {
	console.clear(); // Limpa o console
	console.log(title);

	// Solicita uma opção para prosseguir
	const input: string = await Select.prompt({
		message: 'Escolha uma ferramenta:',
		options: [
			{ name: '- Injetar Trojan:WiFiCloner', value: '1' },
			{ name: '- Instalar Backdoor', value: '2', disabled: true },
			{ name: '- Copiar chave de ativação', value: '3' },
			// Select.separator('--------'),
			{ name: '- Apagar registros', value: '4' },
			{ name: '- Encerrar', value: '0' },
		],
	});

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

	// Voltando ao menu inicial
	setTimeout(() => menu(), 5_000);
}

async function NetSHProfileCollector() {
	currentMenu = 'Wi-Fi CLONER';

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

	Deno.mkdir('.tempdata') // Cria pasta de arquivos temporários
		.catch(() => {});

	Deno.mkdir('WiFiPasswords') // Cria pasta de senhas
		.catch(() => {});

	// Chamando a API do Windows
	await executeCommand(
		'netsh wlan export profile key=clear folder=.tempdata',
	);

	let counter = 0;

	// Por padrão, A API fornece as informações em arquivos XML bem poluídos
	// Então eu fiz essa bosta aqui pra deixar só o que é realmente importante
	for (const file of Deno.readDirSync('.tempdata')) {
		if (file.isDirectory) continue; // Pular pastas
		counter++;

		// Lendo conteúdo do arquivo
		const content = Deno.readTextFileSync(`.tempdata/${file.name}`);

		// Filtrando tags que são úteis
		const name = clearTags(content.match(/<name>.*?<\/name>/));
		const securityLevel = clearTags(
			content.match(/<authentication>.*?<\/authentication>/),
		);
		const password = clearTags(
			content.match(/<keyMaterial>.*?<\/keyMaterial>/),
		);

		// Escrevendo arquivos com as informações filtradas no diretório final
		Deno.writeTextFileSync(
			`WiFiPasswords/${name}.txt`,
			`SSID: ${name}\nSecurity Level: ${securityLevel}\nPassword: ${password}`,
		);
	}

	spinner.end(`${counter} redes clonadas.`);

	await delay(1_000);
	await clearTraces(); // Limpar registros

	return;
}

async function copyWinKey() {
	currentMenu = 'KEY CLONER';

	const status = new Spinner('Obtendo chave de ativação...');
	await delay(3_000);

	const key = (await executeCommand(
		'wmic path softwarelicensingservice get OA3xOriginalProductKey',
	)).split('\n')[1];

	status.end(
		`Chave de ativação obtida:\n\n${key}`,
	);

	Deno.mkdir('WindowsKeys') //
		.catch(() => {});

	Deno.writeTextFileSync(
		`WindowsKeys/${Deno.hostname()}.txt`,
		`Machine: ${Deno.hostname()}\nWindows License Key: ${key}`,
	);
}

async function clearTraces() {
	currentMenu = 'CLEANER';

	const status = new Spinner('Apagando registros...');
	await delay(1_500);

	Deno.remove('.tempdata', { recursive: true })
		// 'recursive' significa que é pra apagar mesmo se tiver pastas e arquivos dentro
		.then(() => status.end('Registros excluídos.'))
		.catch(() => status.fail('Nada para excluir.'));
	return;
}

async function executeCommand(cmd: string) {
	const process = Deno.run({
		cmd: cmd.split(' '),
		stdout: 'piped',
		stderr: 'piped',
	});

	const res = new TextDecoder()
		.decode(await process.output());

	process.close(); // Encerra processo

	return res;
}

async function createFakeStatus(loadingMsg: string, completeMsg: string) {
	const status = new Spinner(loadingMsg, currentMenu);
	await delay(random());
	status.end(completeMsg);

	return;
}

function clearTags(text: RegExpMatchArray | string | null) {
	// Regex pra filtrar as tags do XML
	return String(text)
		.replace(/<\/?[a-z][a-z0-9]*[^<>]*>|<!--.*?-->/gim, '');
}

function random() {
	// Retorna um número aleatório até 2000
	const value = Math.floor(Math.random() * 3_000);
	return value < 500 ? value + 1_000 : value;
}

class Spinner {
	sector: string;
	text: string;
	spinner: TerminalSpinner;

	constructor(text: string, sector?: string) {
		this.sector = sector || currentMenu;
		this.text = text;
		// Inicia Spinner
		this.spinner = new TerminalSpinner({
			text: this._format(),
			spinner: {
				interval: 40,
				frames: [
					'⠋',
					'⠙',
					'⠹',
					'⠸',
					'⠼',
					'⠴',
					'⠦',
					'⠧',
					'⠇',
					'⠏',
				],
			},
			indent: 1,
			cursor: true,
			color: 'cyan',
		}).start();
	}

	end(msg?: string) {
		this.text = msg || this.text;
		this.spinner.succeed(this._format());
	}

	fail(msg?: string) {
		this.text = msg || this.text;
		this.spinner.fail(this._format());
	}

	_format() {
		const date = new Date();
		const minutes = date.getMinutes() < 10
			? '0' + date.getMinutes()
			: date.getMinutes();

		return [ // isso pode parecer meio confuso
			'[',
			this.sector.toUpperCase().cyan, // [ SECTOR
			'|',
			`${date.getHours()}:${minutes}`.yellow, // [ SECTOR | 18:04
			'] -',
			this.text,
		].join(' '); // [ SETOR | 18:04 ] - TEXT
	}
}
