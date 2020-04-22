const shortid = require("shortid")

class Room {
	constructor() {
		this.id = shortid()
		this.token = shortid()
		this.users = []
		this.state = null
	}
}
