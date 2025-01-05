function parseJekyllTags (tags) {
	return tags?.split(/\s+/)
}

export default {
	layout: 'posts',
	permalink: "/blog/{{ page.date | date('y/MM') }}/{{ page.fileSlug }}.{{ page.outputFileExtension }}",
	tags: 'blog',
	eleventyComputed: {
		blog_tags: (data) => parseJekyllTags(data.blog_tags),
		categories: (data) =>
			data.categories ? parseJekyllTags(data.categories)
				: data.category ? [data.category]
					: undefined,
	}
}
