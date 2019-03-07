function parseJekyllTags (tags) {
	return typeof tags == 'string' ? tags.split(/\s+/) : tags
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
