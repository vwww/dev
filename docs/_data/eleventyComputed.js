export default {
	page_url: (data) => data.page.url.replace(/^\/+/, '/').replace(/(index)?\.html$/, ''),
	page_path: (data) => data.page.inputPath.slice(data.eleventy.directories.input.length),
	page_level: (data) => data.page_url.split('/').length - 2, // subtract leading slash
	base: (data) => Array(data.page_level).fill('..').join('/'),
	assets: (data) => data.base + '/assets/',
}
