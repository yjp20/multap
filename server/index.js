const Game = require("./game")
const Server = require("./server")

function newServer(options) {
	var server = new Server(options)
	return server
}

function newGame(options) {
	var game = new Game(options)
	return game
}

module.exports = { newServer, newGame }
