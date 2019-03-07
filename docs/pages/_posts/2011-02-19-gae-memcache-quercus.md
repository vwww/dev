---
title: Google App Engine's Memcache with Quercus
date: "2011-02-19 17:17:00 -0700"
category: Programming
blog_tags: Java PHP Programming Web
---
Google App Engine supports Java and Python, thus supporting <mark>PHP via Quercus on Java</mark>. We can <mark>use their fast-access Memcache with code similar to the following</mark>:

```php
<?php
import com.google.appengine.api.memcache.MemcacheService;
import com.google.appengine.api.memcache.MemcacheServiceFactory;

$service = MemcacheServiceFactory::getMemcacheService();
$service->put("key", "this is the value");
echo $service->get("key"); // outputs, "this is the value"
```

As you can see, <mark>the **import** keyword is nonstandard PHP</mark> but works on Quercus.
