import yaml from 'js-yaml'
// import markdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
// import mila from 'markdown-it-link-attributes'
import { DateTime } from 'luxon'
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight'

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(syntaxHighlight, {
		preAttributes: {
			tabindex: 0,
			'data-language': ({ language }) => language,
		},
	})

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
	const EXCERPT_SEPARATOR = '<!--more-->'
	eleventyConfig.addNunjucksFilter('date', (date, format) => {
		date = date == 'now' ? new Date() : new Date(date)
		format = DATE_OVERRIDE[format] ?? format
		return DateTime.fromJSDate(date).toFormat(format)
	})
	eleventyConfig.addNunjucksFilter('to_array', (val) => Array.isArray(val) ? val : [val])
	eleventyConfig.addFilter('excerpt', (content) => content.split(EXCERPT_SEPARATOR)[0])
	eleventyConfig.addFilter('has_excerpt', (content) => content.includes(EXCERPT_SEPARATOR))
	eleventyConfig.addFilter('get_3d', (arr, key) => arr.find((v) => v[0] == key)[1])

	eleventyConfig.setNunjucksEnvironmentOptions({
		throwOnUndefined: true,
		autoescape: false,
	})

	// eleventyConfig.addCollection('code', (c) => c.getFilteredByGlob('_code/**'))
	// eleventyConfig.addCollection('go', (c) => c.getFilteredByGlob('_go/**'))

	function makePostCollections (c) {
		const posts = c.getFilteredByTag('blog').reverse()
		const postsByTag = {}
		const tagCount = {}
		const postsByYear = {}

		for (const post of posts) {
			for (const tag of post.data.blog_tags) {
				(postsByTag[tag] ??= []).push(post)
				tagCount[tag] = (tagCount[tag] ?? 0) + 1
			}
			(postsByYear[post.date.getFullYear()] ??= []).push(post)
		}
		return {
			posts,
			postsByTag,
			postTagsByName: Object.keys(postsByTag).sort(),
			postTagsBySize: Object.entries(tagCount).sort((a, b) => b[1] - a[1]).map((entry) => entry[0]),
			postsByYear,
			postYears: Object.keys(postsByYear).sort((a, b) => b - a),
		}
	}
	let postCollections
	for (const c of [
		'posts',
		'postsByTag',
		'postTagsByName',
		'postTagsBySize',
		'postsByYear',
		'postYears',
	]) {
		eleventyConfig.addCollection(c, (collectionsApi) => (postCollections ??= makePostCollections(collectionsApi))[c])
	}

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

export const config = {
	dir: {
		input: './pages',
		includes: '../_includes',
		data: '../_data',
		layouts: '../_layouts',
	},
	markdownTemplateEngine: 'njk',
	htmlTemplateEngine: 'njk',
}
