const admin = require('firebase-admin')

// Initialize once
if (!admin.apps.length) {
  admin.initializeApp()
}

const { weeklyReset } = require('./weeklyReset.js')

module.exports = { weeklyReset }
