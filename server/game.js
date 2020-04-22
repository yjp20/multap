class Game {
	constructor(options) {
		this.name = options.name || "Example Game"
		this.files = options.files
	}
}

module.exports = Game
