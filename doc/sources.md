# Sources

## List of available sources

The list of sources:

- [`word-snatcher-cli-animals-source`](https://gist.githubusercontent.com/akgondber/39eb9d89891a709c4c543a55f2c5a5bf/raw/af8b0f847841b9b305033bcb031c9cf366b8d852/word-snatchers-cli-animals-source.json)
- [`word-snatchers-cli-common-words`](https://gist.githubusercontent.com/akgondber/0317e3349c04ea0943ba14215f033392/raw/e80ea08b8d6e4fe1bacec736fd31a53534591336/word-snatchers-cli-common-words.json)

## Writing a source

In order to create a source of questions you should create an endpoint which will respond with an array of question items. You can create either own server implementation or use some service which allows to host json files. See for example the following sources hosted in gist:
- [with single round](https://gist.githubusercontent.com/akgondber/39eb9d89891a709c4c543a55f2c5a5bf/raw/af8b0f847841b9b305033bcb031c9cf366b8d852/word-snatchers-cli-animals-source.json)
- [with several rounds](https://gist.githubusercontent.com/akgondber/0317e3349c04ea0943ba14215f033392/raw/e80ea08b8d6e4fe1bacec736fd31a53534591336/word-snatchers-cli-common-words.json)
