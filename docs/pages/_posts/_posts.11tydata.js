function parseJekyllTags (tags) {
	return tags?.split(/\s+/)
}

export default {
	layout: 'posts',
	permalink: "/blog/{{ page.date | date('y/MM') }}/{{ page.fileSlug }}.{{ page.outputFileExtension }}",
	eleventyComputed: {
		tags: (data) => parseJekyllTags(data.tags[0]),
		categories: (data) =>
			data.categories ? parseJekyllTags(data.categories)
				: data.category ? [data.category]
					: undefined,
	}
}
