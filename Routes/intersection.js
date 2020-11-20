const express = require('express');
const router = express.Router();
const Intersection = require('../Models/Intersection');

router.get('/', async (req, res) => {
    const intersections = await Intersection.find();
    console.log(intersections);
    res.json(intersections);
})

router.post('/', (req, res, next) => {
    const intersection = new Intersection({
        "connections": req.body.connections,
        "level": req.body.level
    })
    intersection.save()
                .then(data => {res.json(data)})
                .catch(err => {res.json({message: err})});
})

module.exports = router;
