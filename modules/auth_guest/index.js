const path = require('path')

const utils = require("../../server/utils")
const File = require("../../server/file").File

module.exports = {
	routes: [
		{
			method: "post",
			path: "/auth/guest",
			function: async function (req, res) {
				console.log(req.body)
				var nick = req.body.nick || "guest"
				const user = await req.app.locals.db["User"].create({
					nick: nick,
					temp: true,
				})
				const userToken = await user.createUserToken()
				res.json({ token: userToken.token })
			},
		},
	],
	clientJS: [ new File('multap.auth_guest.js', path.join(__dirname, 'multap.auth_guest.js')) ],
}
