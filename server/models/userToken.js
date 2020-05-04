const Sequelize = require("sequelize")

module.exports = (db) => {
	const UserToken = db.define('UserToken', {
		token: {
			type: Sequelize.STRING(100),
			primaryKey: true,
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
