const cors = require("cors")
const express = require("express")
const helmet = require("helmet")
const path = require("path")

class Server {
	constructor(options) {
		this.name = options.name || "Multap"
		this.desc = options.desc || "Node.js multiplayer library"
		this.base = options.base || "/"
		this.client = options.client || express.static(path.join(__dirname, '../client'))
		this.clientIndex = options.clientIndex || path.join(__dirname, '../client/index.html')
		this.clientlib = options.clientlib || express.static(path.join(__dirname, '../clientlib'))
		this.gameFiles = []
		this.rooms = {}

		if (!options.game && !options.games) {
			throw "Cannot be missing game(s) option"
		}

		if (options.game && options.games) {
			throw "Cannot have both game and games"
		}

		if (options.game) {
			options.games = [options.game]
		}

		for (var game of options.games) {
			this.gameFiles.push(express.static(game.files))
		}

		this.router = express()
		this.wrapper = express()
		this.wrapper.use(this.base, this.router)

		this.router.use(cors())
		this.router.use(helmet())
		this.router.post("/user/:userid", function (req, res) {

		})
		this.router.post("/join/:roomToken", function (req, res) {

		})
		this.router.post("/play/:roomid/*filePath", function (req, res) {
			if (!(req.params.roomid in this.rooms)) {
				res.json({ error: 'Room not found' })
			}
		})
		this.router.use("/clientlib", this.clientlib)
		this.router.use("/", this.client)
		this.router.get("/*", function (req, res) {
			res.sendFile(this.clientIndex)
		}.bind(this))
	}

	listen(port) {
		this.wrapper.listen(port, () => {
			console.log(`${this.name} server listening on ${port}`)
		})
	}
}

module.exports = Server
