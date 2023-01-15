<div align="center">
  <img src="media/logo.png" alt="Word-Snatchers-CLI" />
</div>

# word-snatchers-cli [![NPM version][npm-image]][npm-url]

> A console game which target is unscramble the letters to spell out a word fitting the given definition.

## Installation

```sh
$ npm install --global word-snatchers-cli
```

or

```sh
$ yarn global add word-snatchers-cli
```

## Usage

Run a game with default set of questions:

```shell
$ word-snatchers-cli
```

or

```shell
$ wsc
```

or

```shell
$ words-game
```

You can provide another json file that contains question items by passing an appropriate option:

```shell
$ words-game --file my/custom/questions.json
```

In order to run several game rounds you can use a `--suite` flag:

```shell
$ words-game --suite
```

There is a `--suite-folder` flag providing some folder to use another set of questions at once (rounds) from all json files located in specified folder:

```shell
$ words-game --suite --suite-folder "C:\baz"
```

Use plugins providing a `--plugin` argument:

```shell
$ words-game --plugin word-snatchers-cli-fruits-plugin
```

Train your english and expand your vocabulary!

## License

MIT © [Rushan Alyautdinov](https://github.com/akgondber)

[npm-image]: https://img.shields.io/npm/v/word-snatchers-cli.svg?style=flat
[npm-url]: https://npmjs.org/package/word-snatchers-cli
