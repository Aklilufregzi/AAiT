const express = require('express');
const router = express.Router();

const Building = require('../Models/Building');
const Intersection = require('../Models/Intersection');

const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
}

const upload = multer({ storage: storage, fileFilter: fileFilter });

router.get('/', async (req, res) => {
    const posts = await Building.find();
    console.log(posts);
    res.json(posts);    
})

router.get('/1', (req, res) => {
    res.send('we are in the first floor');
})

router.post('/', (req, res, next) => {
    const building = new Building({
        "name": req.body.name,
        "lat": req.body.lat,
        "lng": req.body.lng
    })
    building.save()
            .then(data => {res.json(data)})
            .catch(err => {res.json({message: err})});
})

router.post('/room', async (req, res, next) => {
    const filter = {
        "name": req.body.building
    };
    console.log(req.body.building);
    let build = await Building.find(filter);
    console.log(build);
    const update = {
        $push: {
            "rooms": {
                "room_name": req.body.room_name,
                "lat": req.body.lat,
                "lng": req.body.lng
            }
        }
    }
    let doc = await Building.findOneAndUpdate(filter, update, { new: false });
    //console.log(doc);
    res.json(doc);
})

router.post('/floor', upload.single('floorImage'), async (req, res) => {
    console.log(req.file);
    console.log(req.body.building);
    console.log(req.body.floor_number);

    const filter = {
        "name": req.body.building
    };

    const update = {
        $push: {
            "floors": {
                "floor_number": req.body.floor_number,
                "floor_design": req.file.originalname
            }
        }
    };

    let doc = await Building.findOneAndUpdate(filter, update, { new: true });
    
    console.log(doc);
    res.json(doc);
})


function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}
  
function distanceInKmBetweenEarthCoordinates(lat1, lon1, lat2, lon2) {
    var earthRadiusKm = 6371;

    var dLat = degreesToRadians(lat2-lat1);
    var dLon = degreesToRadians(lon2-lon1);

    lat1 = degreesToRadians(lat1);
    lat2 = degreesToRadians(lat2);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return earthRadiusKm * c;
}

function bfs(start_coord, target_coord, connections) {
    let route = [];
    if (start_coord > target_coord) {
        for (let i = start_coord; i >= target_coord; i--) {
            route.push(connections[i]);
        }
    }
    else {
        for (let i = start_coord; i <= target_coord; i++) {
            route.push(connections[i]);
        }
    }
    console.log("routes:");
    console.log(route);
    return route;
}

router.post('/navigate', async (req, res) => {
    // Algorithm:
    // 1. find the closest intersection point to start
    // 2. find the closest intersection point to end
    // 3. If start and end are in the same building
    // 4.   If start level equals end level       
    // 5.       return an array consisting of all coordinates from start intersection to end intersection
    // 6.   If start level != end level
    // 7.       find closest stair coordinate
    // 8.       find closest intersection point to stair coordinate
    // 9.       return route from start intersection to stair intersection
    // 10.      notify the user how many stairs to go down/up
    // 11.      return route from stairs intersection to end intersection
    // 12.  If start and end are not in the same building
    // 13.      If both start and end are on the ground floor
    // 14.          return an array consisting of all coordinates from start intersection to end intersection
    // 15.      If start level > 0
    // 16.          find closest stair coordinate
    // 17.          find closest intersection point to stair coordinate
    // 18.          return route from start intersection to stair coordinate
    // 19.          find stair intersection on ground floor
    // 20.          start intersection = stair intersection
    // 21.          notify the user how many stairs to go down
    // 22.     If end intersection is on the ground
    // 23.          return route from start intersection to end intersection
    // 24.     If not
    // 25.          find closest stair coordinate in end's building
    // 26.          find closest intersection point to end's stair coordinate
    // 27.          return route from start's stair intersection to end's stair intersection
    // 28.          notify the user how many stairs to go up
    // 29.          return route from stair intersection to end intersection  

    let start = req.body.start;
    let end = req.body.end;
    let start_coord = req.body.start_coord;
    let end_coord = req.body.end_coord;
    let start_building = null;
    let end_building = null;
    let start_level = -1;
    let end_level = -1;
    // find the buildings that start and end belong to
    const buildings =  await Building.find();
    console.log(start + " , " + end);
    buildings.map((building, idx) => {
        building.rooms.map((room, room_idx) => {
            console.log(room.room_name);
            if (room.room_name === start) {
                console.log("start found at " + room.floor_number);
                start_level = room.floor_number;
                start_building = building.name;
            }
            if (room.room_name === end) {
                console.log("end found");
                end_level = room.floor_number;
                end_building = building.name;
            }
        })
        // building.stairs.map((stair, stair_idx) => {
        //     if (stair.name === start) {
        //         start_level = stair.level;
        //         start_building = building.name;
        //     }
        //     if (stair.name === end) {
        //         end_level = room.floor_number;
        //         end_building = building.name;
        //     }
        // })
    })
    let response = {
        routes: [],
        stairs: null,
        error: null
    };
    if (start_building === end_building) {
        if (start_level === end_level) {
            const intersections = await Intersection.find({"level": start_level});
            let start_intersection = null;
            let end_intersection = null;
            let start_distance = 1000;
            let end_distance = 1000;
            let intersection_idx = -1;
            intersections.map((intersection, idx) => {
                intersection.connections.map((coord, c) => {
                    const dist_start = distanceInKmBetweenEarthCoordinates(start_coord.lat, start_coord.lng, coord[1], coord[0]);
                    const dist_end = distanceInKmBetweenEarthCoordinates(end_coord.lat, end_coord.lng, coord[1], coord[0]);
                    if (dist_start < start_distance) {
                        start_distance = dist_start;
                        start_intersection = c;
                        intersection_idx = idx;
                    }

                    if (dist_end < end_distance) {
                        end_distance = dist_end;
                        end_intersection = c;
                        intersection_idx = idx;
                    }
                })
            })
            let route = bfs(start_intersection, end_intersection, intersectins[inter_idx].connections);
            response.routes.push(route);
            res.json(response);
        }
        else {
            const start_intersections = await Intersection.find({"level": start_level});
            const end_intersections = await Intersection.find({"level": end_level});
            let start_intersection = null;
            let end_intersection = null;
            let start_distance = 1000;
            let end_distance = 1000;
            let start_intersection_idx = -1;
            let end_intersection_idx = -1;
            // Find closest intersections to start and end
            start_intersections.map((intersection, idx) => {
                intersection.connections.map((coord, c) => {
                    const dist_start = distanceInKmBetweenEarthCoordinates(start_coord.lat, start_coord.lng, coord[1], coord[0]);
                    if (dist_start < start_distance) {
                        start_distance = dist_start;
                        start_intersection = c;
                        start_intersection_idx = idx;
                    }
                })
            });
            end_intersections.map((intersection, idx) => {
                intersection.connections.map((coord, c) => {
                    const dist_start = distanceInKmBetweenEarthCoordinates(end_coord.lat, end_coord.lng, coord[1], coord[0]);
                    if (dist_start < end) {
                        end_distance = dist_start;
                        end_intersection = c;
                        end_intersection_idx = idx;
                    }
                })
            })
            // Find closest stair coordinate in start's building
            let stair_coordinate = null;
            let stair_distance = 1000;
            let step_idx = -1;
            const building = Building.find({"name": start_building});
            building.steps.map((step, s) => {
                const start_lat = intersections[start_intersection_idx].connections[start_intersection][1];
                const start_lng = intersections[start_intersection_idx].connections[start_intersection][0];
                const dist_stair = distanceInKmBetweenEarthCoordinates(start_lat, start_lng, step.lat, step.lng);
                if (dist_stair < stair_distance) {
                    stair_distance = dist_stair;
                    stair_coordinate = [step.lng, step.lat];
                }
            });
            // Find closest stair intersection
            let stair_intersection = null;
            stair_distance = 1000;
            start_intersections[start_intersection_idx].connections.map((intersection, idx) => {
                const dist_stair = distanceInKmBetweenEarthCoordinates(stair_coordinate[1], stair_coordinate[0], intersection[1], intersection[0]);
                if (dist_stair < stair_distance) {
                    stair_distance = dist_stair;
                    stair_intersection = idx;
                } 
            });
            let route_1 = bfs(start_intersection, stair_intersection, start_intersections[start_intersection_idx].connections);
            response.routes.push(route_1);
            if (start_level > end_level) {
                response.steps.push(start_level - end_level);
            }
            const stair_intersection_lat = start_intersections[start_intersection_idx].connections[stair_intersection][1];
            const stair_intersection_lng = start_intersections[start_intersection_idx].connections[stair_intersection][0];
            stair_distance = 1000;
            end_intersections[end_intersection_idx].connections.map((intersection, idx) => {
                const dist_stair = distanceInKmBetweenEarthCoordinates(stair_intersection_lat, stair_intersection_lng, intersections[1], intersection[0]);
                if (dist_stair < stair_distance) {
                    stair_distance = dist_stair;
                    stair_intersection = idx;
                }
            });
            let route_2 = bfs(stair_intersection, end_intersections, end_intersections[end_intersection_idx]);
            response.routes.push(route_2);
            res.json(response);
        }
    }
    else {
        if (start_level === 0 && end_level == 0) {
            const intersections = await Intersection.find({"level": start_level});
            let start_intersection = null;
            let end_intersection = null;
            let start_distance = 1000;
            let end_distance = 1000;
            let intersection_idx = -1;
            intersections.map((intersection, idx) => {
                intersection.connections.map((coord, c) => {
                    const dist_start = distanceInKmBetweenEarthCoordinates(start_coord.lat, start_coord.lng, coord[1], coord[0]);
                    const dist_end = distanceInKmBetweenEarthCoordinates(end_coord.lat, end_coord.lng, coord[1], coord[0]);
                    if (dist_start < start_distance) {
                        start_distance = dist_start;
                        start_intersection = c;
                        intersection_idx = idx;
                    }

                    if (dist_end < end_distance) {
                        end_distance = dist_end;
                        end_intersection = c;
                        intersection_idx = idx;
                    }
                })
            })
            let route = bfs(start_intersection, end_intersection, intersectins[inter_idx].connections);
            response.routes.push(route);
            res.json(response);
        }
        else {
            let start_intersections = await Intersection.find({"level": start_level});
            const end_intersections = await Intersection.find({"level": end_level});
            let start_intersection = null;
            let end_intersection = null;
            let start_distance = 1000;
            let end_distance = 1000;
            let start_intersection_idx = -1;
            let end_intersection_idx = -1;
            // Find closest intersections to start and end
            start_intersections.map((intersection, idx) => {
                intersection.connections.map((coord, c) => {
                    const dist_start = distanceInKmBetweenEarthCoordinates(start_coord.lat, start_coord.lng, coord[1], coord[0]);
                    if (dist_start < start_distance) {
                        start_distance = dist_start;
                        start_intersection = c;
                        start_intersection_idx = idx;
                    }
                })
            });
            end_intersections.map((intersection, idx) => {
                intersection.connections.map((coord, c) => {
                    const dist_start = distanceInKmBetweenEarthCoordinates(end_coord.lat, end_coord.lng, coord[1], coord[0]);
                    if (dist_start < end) {
                        end_distance = dist_start;
                        end_intersection = c;
                        end_intersection_idx = idx;
                    }
                })
            })
            if (start_level > 0) {
                // Find closest stair coordinate in start's building
                let stair_coordinate = null;
                stair_distance = 1000;
                let step_idx = -1;
                const building = Building.find({"name": start_building});
                building.steps.map((step, s) => {
                    const start_lat = start_intersections[start_intersection_idx].connections[start_intersection][1];
                    const start_lng = start_intersections[start_intersection_idx].connections[start_intersection][0];
                    const dist_stair = distanceInKmBetweenEarthCoordinates(start_lat, start_lng, step.lat, step.lng);
                    if (dist_stair < stair_distance) {
                        stair_distance = dist_stair;
                        stair_coordinate = [step.lng, step.lat];
                    }
                });
                // Find closest stair intersection
                let stair_intersection = null;
                let stair_distance = 1000;
                start_intersections[start_intersection_idx].connections.map((intersection, idx) => {
                    const dist_stair = distanceInKmBetweenEarthCoordinates(stair_coordinate[1], stair_coordinate[0], intersection[1], intersection[0]);
                    if (dist_stair < stair_distance) {
                        stair_distance = dist_stair;
                        stair_intersection = idx;
                    } 
                });  
                let route_1 = bfs(start_intersection, stair_intersection, start_intersections[start_intersection_idx].connections);        
                response.routes.push(route_1);
                response.steps.push(start_level);
                start_intersections = Intersection.find({"level": 0});
                // find intersection on ground closest to stair intersection
                stair_distance = 1000;
                let stair_intersection_lat = start_intersections[start_intersection_idx].connections[stair_intersection][1];
                let stair_intersection_lng = start_intersections[start_intersection_idx].connections[stair_intersection][0];
                
                start_intersections.forEach((intersection, idx) => {
                    intersection.connections.forEach((connection, c) => {
                        const dist_stair = distanceInKmBetweenEarthCoordinates(connection[1], connection[0], stair_intersection_lat, start_intersection_lng);
                        if (dist_stair < stair_distance) {
                            stair_distance = dist_stair;
                            intersection_idx = idx;
                            stair_intersection = c;
                        }
                    })
                })
                start_intersection = stair_intersection;
            }
            if (end_level === 0) {
                let route_2 = bfs(start_intersection, end_intersection, end_intersections[end_intersection_idx]);
                response.routes.push(route_2);
                res.json(response);
            }
            else {
                let build = await Building.find({name: end_building});
                let stair_distance = 1000;
                let stair_intersection = null;
                let start_intersection_lat = start_intersections[start_intersection_idx].connections[start_intersection][1];
                let start_intersection_lng = start_intersections[start_intersection_idx].connections[start_intersection][0];
                build.steps.forEach((step, s) => {
                    const dist_stair = distanceInKmBetweenEarthCoordinates(step.lat, step.lng, start_intersection_lat, start_intersectin_lng);
                    if (dist_stair < stair_distance) {
                        stair_distance = dist_stair;
                        stair_intersection = s;
                    }
                });
                let route_3 = bfs(start_intersection, stair_intersection, start_intersections[start_intersection_idx]);
                response.routes.push(route_3);
                res.json(response);
            }
        }
    }

})
module.exports = router;
