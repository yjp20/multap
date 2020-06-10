const Sequelize = require("sequelize")

module.exports = (db, extensions) => {
	const Room = db.define("Room", {
		uuid: {
			type: Sequelize.UUID,
			allowNull: false,
			unqiue: true,
			defaultValue: Sequelize.UUIDV4,
		},
		gamename: {
			type: Sequelize.STRING,
		},
		name: {
			type: Sequelize.STRING,
			allowNull: false,
		},
		num: {
			type: Sequelize.INTEGER,
			allowNull: false,
		},
		max: {
			type: Sequelize.INTEGER,
			allowNull: false,
		},
		...extensions,
	})

	Room.associate = function (models) {
		models.Room.Host = models.Room.belongsTo(models.User, { as: "host" } )
		models.Room.Users = models.Room.belongsToMany(models.User, {
			as: "users",
			through: "RoomUsers",
		})
	}

	return Room
}
