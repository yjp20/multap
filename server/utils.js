const crypto = require("crypto")

async function generateToken() {
	return new Promise((resolve, reject) => {
		crypto.randomBytes(48, function(err, buf) {
			resolve(buf.toString('base64'))
		})
	})
}

module.exports = {
	generateToken,
}
