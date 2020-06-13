const Sequelize = require("sequelize")
const utils = require("../utils")

module.exports = (db) => {
	const UserToken = db.define('UserToken', {
		token: {
			type: Sequelize.STRING(100),
			primaryKey: true,
		},
	}, {
		hooks: {
			beforeCreate: async (usertoken) => {
				usertoken.token = await utils.generateToken(48)
			},
		},
	})

	UserToken.associate = function (models) {
		models.UserToken.belongsTo(models.User, {
			onDelete: "CASCADE",
			foreignKey: {
				allowNull: false,
			},
		})
	}

	return UserToken
}
