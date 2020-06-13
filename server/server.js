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

async function getUser(req) {
	var token = await req.app.locals.db["UserToken"].findByPk(req.body.token)
	if (token === null) {
		return { error: "Token invalid" }
	}
	var user = await token.getUser()
	return { user }
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
		if (options.game) {
			this.games = {}
			this.games[options.game.name] = options.game
		}
		if (options.games) this.games = options.games

		this.gameFiles = []
		for (var game in this.games) {
			this.gameFiles.push(express.static(this.games[game].files))
		}

		this.clientIndex = new File("index.html", abs("../client/index.html"))
		this.clientJS = [ new File("multap.client.js", abs("../client/js/multap.client.js")) ]
		this.clientCSS = [ new File("multap.css", abs("../client/css/multap.css")) ]
		this.gameLib = new File("multap.gamelib.js",  abs("../gamelib/multap.gamelib.js"))

		this.db = {}
		this.rooms = {}

		this.roomOptions = options.roomOptions || []
		if (!this.noDefaultRoomOptions) {
			this.roomOptions = [
				{
					"viewname": "Room Name",
					"name": "name",
					"type": "text",
					"placeholder": "Random Room",
					"max": 20,
				},
				{
					"viewname": "Password",
					"name": "password",
					"type": "text",
					"placeholder": "Leave empty for no password",
					"max": 32,
				},
				...this.roomOptions,
			]
		}

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
		this.router.post("/rooms/options", async (req, res) => {
			res.json({
				roomOptions: this.roomOptions,
			})
		})

		this.router.post("/rooms/new", async (req, res) => {
			var { user, error } = await getUser(req)
			if (error) {
				res.json({ error })
				return
			}

			var name = req.body.name || "Random Room"
			var password = req.body.password || ""

			var room = await this.db["Room"].create({
				name: name,
				hostId: user.id,
				num: 1,
				max: 5,
				status: [ "waiting" ],
				password: password,
			}, {
				include: [ this.db.Room.Host ],
				attributes: {
					exclude: ["id", "password"],
				},
			})
			res.json({
				room: room,
			})
		})

		this.router.post("/rooms/get", async (req, res) => {
			var rooms = await this.db["Room"].findAll({
				include: [ this.db.Room.Host ],
				attributes: {
					exclude: ["id", "password"],
				},
			})
			res.json({
				rooms: rooms,
			})
		})

		this.router.post("/rooms/join", async (req, res) => {
			var { user, error } = await getUser(req)
			if (error) {
				alert(error)
				return
			}
			var rooms = await this.db["Room"].findAll({
				include: [ this.db.Room.Host ],
			})
			res.json({
				rooms: rooms,
			})
		})

		this.router.post("/room/get", async (req, res) => {
			var rooms = await this.db["Room"].findOne({
				where: {
					uuid: req.body.uuid,
				},
				include: [ this.db.Room.Host ],
				attributes: {
					exclude: ["id"],
				},
			})
			res.json({
				rooms: rooms,
			})
		})

		this.router.post("/user/:userid", (req, res) => {

		})

		this.router.post("/join/:roomToken", async (req, res) => {
			var { user, error } = await getUser(req)

		})

		this.router.post("/play/:roomid/*filePath", (req, res) => {
			if (!(req.params.roomid in this.rooms)) {
				res.json({ error: "Room not found" })
				return
			}
		})

		this.router.post("/auth/token", async (req, res) => {
			var { user, error } = await getUser(req)
			if (error) {
				res.json({ error })
				return
			}
			res.json({ user })
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
		this.db["Room"] = models.Room(this.sequelize)
		for (var key in this.db) {
			if (this.db[key].associate) {
				this.db[key].associate(this.db)
			}
		}
		await this.sequelize.sync()
		this.router.locals.db = this.db
		console.log(this.db)
	}

	listen(port) {
		this.wrapper.listen(port, () => {
			console.log(`${this.name} server listening on ${port}`)
		})
	}
}

module.exports = Server
