const Sequelize = require("sequelize")

module.exports = (db, extensions) => {
	const User = db.define("User", {
		uuid: {
			type: Sequelize.UUID,
			allowNull: false,
			unique: true,
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
	}

	return User
}
