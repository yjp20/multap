const Sequelize = require("sequelize")

module.exports = (db, extensions) => {
	const RoomUsers = db.define("Room_Users", {
		host: {
			type: Sequelize.BOOLEAN,
		},
		...extensions,
	})

	return RoomUsers
}

