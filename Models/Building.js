const mongoose = require('mongoose');

const FloorSchema = mongoose.Schema({
    floor_number: {
        type: Number,
        required: false
    },
    floor_design: {
        type: String,
        required: false
    }
})

const RoomSchema = mongoose.Schema({
    room_name: {
        type: String,
        required: false
    },
    lat: {
        type: Number,
        required: false
    },
    lng: {
        type: Number, 
        required: false
    },
    floor_number: {
        type: Number,
        required: false
    }
})

const StepSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    level: {
        type: Number,
        required: false
    },
    lat: {
        type: Number,
        required: false
    },
    lng: {
        type: Number,
        required: false
    }
})

const BuildingSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    lat: {
        type: Number,
        required: true
    },
    lng: {
        type: Number,
        required: true
    },
    floors: [FloorSchema],
    rooms: [RoomSchema],
    steps: [StepSchema]
})

module.exports = mongoose.model('Building', BuildingSchema);