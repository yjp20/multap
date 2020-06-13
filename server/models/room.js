const Sequelize = require("sequelize")
const utils = require("./../utils")

module.exports = (db, extensions) => {
	const Room = db.define("Room", {
		id: {
			type: Sequelize.UUID,
			allowNull: false,
			unqiue: true,
			primaryKey: true,
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
		hasPassword: {
			type: Sequelize.BOOLEAN,
			allowNull: false,
		},
		host: {
			type: Sequelize.VIRTUAL,
			get() {
				var users = this.getDataValue('Users')
				var host = null
				if (users) {
					users.forEach(user => {
						if (user.Room_Users.host)
							host = user
					})
				}
				return host
			},
		},
		status: {
			type: Sequelize.STRING,
			get() {
				var arr = this.getDataValue('status').split(' ')
				if (this.getDataValue('hasPassword'))
					arr.push('locked')
				return arr
			},
			set(val) {
				this.setDataValue('status', val.join(' '))
			},
		},
		...extensions,
	}, {
		hooks: {
			beforeValidate: (room) => {
				room.hasPassword = room.password.length > 0
			},
			beforeCreate: async (room) => {
				room.token = await utils.generateToken(16)
			},
		},
		defaultScope: {
			attributes: {
				exclude: ["token"],
			},
		},
	})

	Room.associate = function (models) {
		models.Room.Users = models.Room.belongsToMany(models.User, { through: "Room_Users" })
	}

	return Room
}
