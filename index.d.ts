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
