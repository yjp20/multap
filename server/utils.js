const crypto = require("crypto")

async function generateToken(len) {
	return new Promise((resolve, reject) => {
		crypto.randomBytes(len, function(err, buf) {
			resolve(buf.toString('base64'))
		})
	})
}

module.exports = {
	generateToken,
}
