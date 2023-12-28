# Plugins

## List of plugins

The list of plugins:

- [`word-snatchers-cli-fruits-plugin`](https://github.com/akgondber/word-snatchers-cli-fruits-plugin)
- [`word-snatchers-cli-berries-plugin`](https://github.com/akgondber/word-snatchers-cli-berries-plugin)
- [`word-snatchers-cli-nuts-plugin`](https://github.com/akgondber/word-snatchers-cli-nuts-plugin)
- [`word-snatchers-cli-stationery-and-office-supplies-plugin`](https://github.com/akgondber/word-snatchers-cli-stationery-and-office-supplies-plugin)
- [`word-snatchers-cli-is-he-living-or-is-he-dead-by-twain-words-plugin`](https://github.com/akgondber/word-snatchers-cli-is-he-living-or-is-he-dead-by-twain-words-plugin)

## Creating plugins

In order to create a plugin you have at least two options:

- writing a plugin from scratch (see for example a [`word-snatchers-cli-fruits-plugin`](https://github.com/akgondber/word-snatchers-cli-fruits-plugin))
- using a [yeoman generator](https://github.com/akgondber/generator-word-snatchers-cli-plugin) which allows you to build a plugin as easy as ABC - module structure and code will be generated

### Writing a plugin from scratch

See for example a [`word-snatchers-cli-fruits-plugin`](https://github.com/akgondber/word-snatchers-cli-fruits-plugin).

### Using a yeoman generator

If you don't know what is yeoman you can go to its [web site](https://yeoman.io/) and read about it. A [word-snatchers-cli-plugin generator](https://github.com/akgondber/generator-word-snatchers-cli-plugin) allows you to build a plugin for [word-snatchers-cli](https://github.com/akgondber/word-snatchers-cli) without writing any line of code!

Basic steps to use this generator are as follows:

First, install [Yeoman](http://yeoman.io) and generator-word-snatchers-cli-plugin using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).

```bash
npm install -g yo
npm install -g generator-word-snatchers-cli-plugin
```

Then generate your new plugin for [word-snatchers-cli](https://github.com/akgondber/word-snatchers-cli):

```bash
yo word-snatchers-cli-plugin
```

Please see the [documentation](https://github.com/akgondber/generator-word-snatchers-cli-plugin/blob/master/README.md) for more details.

After generating process you can check out that everyting is right, make some additions if needed and your plugin is ready. You can share it with others by publising it to npm.
