const fs = require("fs")
const handlebars = require("handlebars")
const process = require("process")

var cache = true

class File {
	constructor(name, path, content) {
		this.name = name
		this.path = path
		this.content = content
		this.cache = null
	}

	getTemplated(data, force) {
		if (this.cache && cache && force !== true) return this.cache
		var content = String(this.getContent())
		return this.cache = handlebars.compile(content)(data)
	}

	getContent() {
		if (this.path) return fs.readFileSync(this.path)
		if (this.content) return this.content
	}
}

if (process.env.NODE_ENV !== "production") {
	cache = false
}

module.exports.File = File
