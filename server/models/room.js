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
		password: {
			type: Sequelize.STRING,
		},
		status: {
			type: Sequelize.STRING,
			get() {
				var arr = this.getDataValue('status').split(' ')
				if (this.getDataValue('password'))
					arr.push('locked')
				return arr
			},
			set(val) {
				this.setDataValue('status', val.join(' '))
			},
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
