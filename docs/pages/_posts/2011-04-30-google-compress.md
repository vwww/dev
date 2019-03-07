---
title: Google-Like Compression
date: "2011-04-30 19:15:00 -0700"
category: Programming
blog_tags: PHP Programming Web
---
I have a <mark>PHP object buffer callback</mark> that allows you to compress your PHP like Google:

```php
<?php
function op_handler($buffer, $mode) { // overpowered handler xD
	// tabs
	$buffers = explode("</script>", $buffer);
	foreach($buffers as &$buffer) {
		$tabsearch = array(
			'/[\t]+/' => '', // strip tabs
			'/\s+/' => ' ', // multi-spaces
		);
		$jssearch = array(
			'/\s+<!--/' => '<!--', // comment start
			'/-->\s+/' => '-->', // comment end
		);

		$buffer = explode("<script", $buffer, 2);
		$buffer[0] = preg_replace(array_keys($tabsearch), array_values($tabsearch), $buffer[0]);
		$buffer[1] = preg_replace(array_keys($jssearch), array_values($jssearch), $buffer[1]);
		$buffer = implode("<script", $buffer);
	}
	$buffer = implode("</script>", $buffers);
	// gzip!
	return ob_gzhandler($buffer, $mode);
}
ob_start("op_handler");

// ...output the page here...
```

It does tries to compress it by <mark>stripping tabs and compacting spaces without affecting the *&lt;script&gt;* tags</mark>. Then it <mark>gzips it using Apache's mod\_deflate</mark>.
