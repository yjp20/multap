const Sequelize = require("sequelize")

module.exports = (db, extensions) => {
	const User = db.define("User", {
		id: {
			type: Sequelize.UUID,
			allowNull: false,
			unique: true,
			primaryKey: true,
			defaultValue: Sequelize.UUIDV4,
		},
		nick: {
			type: Sequelize.STRING,
			allowNull: false,
		},
		temp: {
			type: Sequelize.BOOLEAN,
			allowNull: false,
		},
		...extensions,
	})

	User.associate = function (models) {
		models.User.Tokens = models.User.hasMany(models.UserToken)
		models.User.Rooms = models.User.belongsToMany(models.Room, { through: "Room_Users" })
	}

	return User
}
