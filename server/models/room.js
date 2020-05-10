const Sequelize = require("sequelize")

module.exports = (db, extensions) => {
	const Room = db.define("Room", {
		uuid: {
			type: Sequelize.UUID,
			allowNull: false,
			unqiue: true,
			defaultValue: Sequelize.UUIDV4,
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
		models.Room.hasOne(models.User, {as: 'host'})
		models.Room.hasMany(models.User, {as: 'users'})
	}

	return Room
}
