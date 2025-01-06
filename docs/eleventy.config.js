const yaml = require('js-yaml')
// const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')
// const mila = require('markdown-it-link-attributes')
const { DateTime } = require('luxon')

module.exports = function (eleventyConfig) {
	eleventyConfig.setServerPassthroughCopyBehavior('passthrough')

	// eleventyConfig.ignores.add('pass')

	eleventyConfig.addPassthroughCopy({ pass: '/' })

	eleventyConfig.addGlobalData('layout', 'pages')
	eleventyConfig.addGlobalData('permalink', '/{{ page.filePathStem }}.{{ page.outputFileExtension }}')

	const DATE_OVERRIDE = {
		'xmlschema':
			"yyyy-MM-dd'T'HH:mm:ssZZ",
		'jekyll':
			'yyyy-MM-dd HH:mm:ss ZZZ',
	}
	eleventyConfig.addNunjucksFilter('date', (date, format) => {
		date = date == 'now' ? new Date() : new Date(date)
		format = DATE_OVERRIDE[format] ?? format
		return DateTime.fromJSDate(date).toFormat(format)
	})
	eleventyConfig.addFilter('starts_with', (s, search, pos) => s.startsWith(search, pos))
	eleventyConfig.addFilter('entries', Object.entries)
	eleventyConfig.addNunjucksFilter('to_array', (val) => Array.isArray(val) ? val : [val])
	eleventyConfig.addFilter('excerpt', (content) => content.split('<!--more-->')[0])
	eleventyConfig.addFilter('has_excerpt', (content) => content.includes('<!--more-->'))
	eleventyConfig.addFilter('get_3d', (arr, key) => arr.find((v) => v[0] == key)[1])

	eleventyConfig.setNunjucksEnvironmentOptions({
		throwOnUndefined: true,
		autoescape: false,
	})

	// eleventyConfig.addCollection('code', (c) => c.getFilteredByGlob('_code/**'))
	// eleventyConfig.addCollection('go', (c) => c.getFilteredByGlob('_go/**'))

	function parsePosts (c, initialValue, postCallback, postProcess) {
		const posts = c.getFilteredByTag('blog').reverse()
		if (!(initialValue && postCallback)) return posts

		for (const post of posts) {
			postCallback(post, initialValue)
		}
		return postProcess ? postProcess(initialValue) : initialValue
	}
	eleventyConfig.addCollection('posts', (c) => parsePosts(c))
	eleventyConfig.addCollection('postsByTag', (c) => parsePosts(c, {},
			(post, tagToPosts) => {
				for (const tag of post.data.blog_tags) {
					(tagToPosts[tag] ??= []).push(post)
				}
			}
		)
	)
	eleventyConfig.addCollection('postTagsByName', (c) => parsePosts(c, new Set(),
			(post, tags) => {
				for (const tag of post.data.blog_tags) {
					tags.add(tag)
				}
			},
			(tags) => Array.from(tags).sort()
		)
	)
	eleventyConfig.addCollection('postTagsBySize', (c) => parsePosts(c, [],
			(post, tagCount) => {
				for (const tag of post.data.blog_tags) {
					tagCount[tag] = (tagCount[tag] ?? 0) + 1
				}
			},
			(tagCount) => Object.entries(tagCount).sort((a, b) => b[1] - a[1]).map((entry) => entry[0])
		)
	)
	eleventyConfig.addCollection('postsByYear', (c) => parsePosts(c, {},
			(post, yearToPosts) => (yearToPosts[post.date.getFullYear()] ??= []).push(post)
		)
	)

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
				target: '_blank',
				rel: 'noopener',
			},
		})
		*/
		.use(markdownItAnchor)
	)

	// handle Jekyll date
	eleventyConfig.addDateParsing((d) => typeof d == 'string' && (d = DateTime.fromFormat(d, DATE_OVERRIDE.jekyll)).isValid && d.toJSDate())
}

module.exports.config = {
	dir: {
		input: './pages',
		includes: '../_includes',
		data: '../_data',
		layouts: '../_layouts',
	},
	markdownTemplateEngine: 'njk',
	htmlTemplateEngine: 'njk',
}
