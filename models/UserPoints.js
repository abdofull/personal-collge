const mongoose = require('mongoose');

const UserPointsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, default: 0 },
    earnedHistory: [{
        source: { type: String, enum: ['tip-application', 'tip-rating', 'daily-login'] },
        points: Number,
        date: { type: Date, default: Date.now },
        details: String
    }]
});

module.exports = mongoose.model('UserPoints', UserPointsSchema);