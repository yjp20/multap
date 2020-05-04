const cors = require("cors")
const express = require("express")
const helmet = require("helmet")
const path = require("path")
const Sequelize = require("sequelize")

const File = require("./file").File
const models = require("./models")
const modules = require("../modules")

function abs(p) {
	return path.join(__dirname, p)
}

class Server {
	constructor(options) {
		this.name = options.name || "Multap"
		this.desc = options.desc || "Node.js multiplayer library"
		this.base = options.base || "/"
		this.conn = options.conn || "sqlite::memory:"
		this.descHTML = options.descHTML || `<p> ${this.desc} </p>`
		this.modules = options.modules || [modules.auth_guest]

		this.sequelize = new Sequelize(this.conn)

		if (!options.game && !options.games) throw "Cannot be missing game(s) option"
		if (options.game && options.games) throw "Cannot have both game and games"
		if (options.game) this.games = [options.game]
		if (options.games) this.games = options.games

		this.gameFiles = []
		for (var game of this.games) {
			this.gameFiles.push(express.static(game.files))
		}

		this.clientIndex = new File("index.html", abs("../client/index.html"))
		this.clientJS = [ new File("multap.client.js", abs("../client/js/multap.client.js")) ]
		this.clientCSS = [ new File("multap.css", abs("../client/css/multap.css")) ]
		this.gameLib = new File("multap.gamelib.js",  abs("../gamelib/multap.gamelib.js"))

		this.db = {}
		this.rooms = {}

		this.router = express()
		this.router.use(express.json())
		this.router.use(cors())
		this.router.use(helmet())

		this.wrapper = express()
		this.wrapper.use(this.base, this.router)

		this._applyModules()
		this._applyRoutes()
		this._registerModels()
	}

	_genFileMap() {
		this._clientCSSMap = {}
		this._clientJSMap = {}

		for (var cssFile of this.clientCSS) {
			this._clientCSSMap[cssFile.name] = cssFile
		}

		for (var jsFile of this.clientJS) {
			this._clientJSMap[jsFile.name] = jsFile
		}
	}

	_applyModules() {
		for (var module of this.modules) {
			if (module.func) {
				module.func(this)
			}
			if (module.routes) {
				for (var route of module.routes) {
					this.router[route.method](route.path, route.function)
				}
			}
			if (module.clientCSS) this.clientCSS = this.clientCSS.concat(module.clientCSS)
			if (module.clientJS) this.clientJS = this.clientJS.concat(module.clientJS)
		}
		this._genFileMap()
	}

	_applyRoutes() {
		this.router.post("/user/:userid", (req, res) => {

		})

		this.router.post("/join/:roomToken", (req, res) => {

		})

		this.router.post("/play/:roomid/*filePath", (req, res) => {
			if (!(req.params.roomid in this.rooms)) {
				res.json({ error: "Room not found" })
				return
			}
		})

		this.router.post("/auth/token", async (req, res) => {
			if (!req.body.token) {
				res.json({ error: "Token is required" })
				return
			}
			var token = await req.app.locals.db["UserToken"].findByPk(req.body.token)
			if (token === null) {
				res.json({ error: "Invalid or expired token" })
				return
			}
			res.json({
				status: "OK",
				user: await token.getUser(),
			})
		})

		this.router.get("/js/:file", (req, res) => {
			if (!(req.params.file in this._clientJSMap)) {
				res.status(404).send("JS File not found")
				return
			}
			res.type('js')
			res.send(this._clientJSMap[req.params.file].getTemplated(this))
		})

		this.router.get("/css/:file", (req, res) => {
			if (!(req.params.file in this._clientCSSMap)) {
				res.status(404).send("CSS File not found")
				return
			}
			res.type('css')
			res.send(this._clientCSSMap[req.params.file].getTemplated(this))
		})

		this.router.get("/gamelib.js", (req, res) => {
			res.send(this.gameLib.getTemplated(this))
		})

		this.router.get("/*", (req, res) => {
			res.send(this.clientIndex.getTemplated(this))
		})
	}

	async _registerModels() {
		this.db["User"] = models.User(this.sequelize)
		this.db["UserToken"] = models.UserToken(this.sequelize)
		for (var key in this.db) {
			if (this.db[key].associate) {
				this.db[key].associate(this.db)
			}
		}
		await this.sequelize.sync()
		this.router.locals.db = this.db
	}

	listen(port) {
		this.wrapper.listen(port, () => {
			console.log(`${this.name} server listening on ${port}`)
		})
	}
}

module.exports = Server
