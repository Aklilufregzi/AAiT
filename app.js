const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
let port = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
})
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect('mongodb+srv://user-1:Ender2622273@cluster0.4zktd.mongodb.net/?retryWrites=true&w=majority', { useUnifiedTopology: true, useNewUrlParser : true }, ()=> {
    console.log('Connected to db!'); 
});

const buildings_route = require('./Routes/building');
const intersection_route = require('./Routes/intersection');

app.use('/buildings', buildings_route);
app.use('/intersections', intersection_route);
app.get('/', (req, res) => {
    res.send('We are home!');
});

app.listen(port);