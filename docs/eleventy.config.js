const yaml = require('js-yaml')
const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')
// const mila = require('markdown-it-link-attributes')
const { DateTime } = require('luxon')

module.exports = function (eleventyConfig) {
	// eleventyConfig.ignores.add('pass')

	eleventyConfig.addPassthroughCopy({ pass: '/' })

	eleventyConfig.addGlobalData('layout', 'pages')
	eleventyConfig.addGlobalData('permalink', '/{{ page.filePathStem }}.{{ page.outputFileExtension }}')
	eleventyConfig.addGlobalData('eleventyComputed.page_url', () => {
		return (data) => data.page.url.replace(/\.html$/, '')
	})
	eleventyConfig.addGlobalData('eleventyComputed.page_path', () => {
		return (data) => data.page.inputPath.slice(data.eleventy.directories.input.length)
	})

	eleventyConfig.addFilter('excerpt', (content) => content.split('<!--more-->')[0])
	eleventyConfig.addFilter('has_excerpt', (content) => content.includes('<!--more-->'))
	eleventyConfig.addFilter('entries', Object.entries)

	// eleventyConfig.addCollection('code', (c) => c.getFilteredByGlob('_code/**'))
	// eleventyConfig.addCollection('go', (c) => c.getFilteredByGlob('_go/**'))

	eleventyConfig.addCollection('posts', (c) => c.getFilteredByGlob('pages/_posts/**').reverse())
	eleventyConfig.addCollection('postsByTag', (c) => {
		const posts = c.getFilteredByGlob('pages/_posts/**').reverse()
		const tagToPosts = {}
		for (const post of posts) {
			for (const tag of post.data.tags ?? []) {
				(tagToPosts[tag] ??= []).push(post)
			}
		}
		return tagToPosts
	})
	eleventyConfig.addCollection('postsByYear', (c) => {
		const posts = c.getFilteredByGlob('pages/_posts/**').reverse()
		const yearToPosts = {}
		for (const post of posts) {
			(yearToPosts[post.date.getFullYear()] ??= []).push(post)
		}
		return yearToPosts
	})

	eleventyConfig.addDataExtension('yml,yaml', (contents) => yaml.load(contents))

	eleventyConfig.amendLibrary('md', (md) => md
		.set({
			html: true,
			typographer: true,
		})
		/*
		.use(mila, {
			matcher: (href) => href.match(/^https?:\/\//),
			attrs: {
				target: "_blank",
				rel: "noopener",
			},
		})
		*/
		.use(markdownItAnchor)
	)

	eleventyConfig.setLiquidOptions({
		jekyllInclude: true,
		// jekyllWhere: true,
		// timezoneOffset: 0,
		preserveTimezones: true,
		dateFormat: '%Y-%m-%d %H:%M:%S %z',
	})

	// handle Jekyll date
	eleventyConfig.addDateParsing((d) => typeof d == 'string' && (d = DateTime.fromFormat(d, 'yyyy-MM-dd hh:mm:ss ZZZ')).isValid && d.toJSDate())
}

module.exports.config = {
	dir: {
		input: './pages',
		includes: '../_includes',
		data: '../_data',
		layouts: '../_layouts',
	},
}
