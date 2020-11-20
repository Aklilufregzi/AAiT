const mongoose = require('mongoose');

const IntersectionSchema = mongoose.Schema({
    level: {
        type: Number,
        required: false
    },
    connections: [[Number, Number]]
})

module.exports = mongoose.model('Intersection', IntersectionSchema);