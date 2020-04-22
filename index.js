const server = require("./server")
const modules = require("./modules")

module.exports = {
	newServer: server.newServer,
	newGame: server.newGame,
	modules: modules,
}
