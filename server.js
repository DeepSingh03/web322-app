/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: __Pushapdeep Singh Khural__ Student ID: _142557222_ Date: _15/02/2024_
*
*  Cyclic Web App URL: ____https://weak-tan-bee-tux.cyclic.app/____________________________________________________
* 
*  GitHub Repository URL: ___https://github.com/DeepSingh03/web322-app.git___________________________________________________
*
********************************************************************************/ 


const express = require('express');
const path = require('path');
const storeService = require('./store-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();

// Set up multer upload
const upload = multer();

// Set up Cloudinary configuration
cloudinary.config({
    cloud_name: 'dnbvpdklc',
    api_key: 769892587259137,
    api_secret: 'aB3DAmOfVB6ZzNAewQkpjdNjJX4',
    secure: true
});

const HTTP_PORT = process.env.PORT || 8080;
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/about.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/about.html'));
});

app.get('/shop', (req, res) => {
    storeService.getPublishedItems()
        .then((publishedItems) => {
            res.json(publishedItems);
        })
        .catch((err) => {
            res.json({ message: err });
        });
});

// Route to get all items with optional filters
app.get('/items', (req, res) => {
    // Check for query parameters
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then((items) => {
                res.json(items);
            })
            .catch((err) => {
                res.status(500).send({ message: err });
            });
    } else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then((items) => {
                res.json(items);
            })
            .catch((err) => {
                res.status(500).send({ message: err });
            });
    } else {
        storeService.getItems()
            .then((allItems) => {
                res.json(allItems);
            })
            .catch((err) => {
                res.status(500).send({ message: err });
            });
    }
});

// Route to get a single item by ID
app.get('/item/:id', (req, res) => {
    const itemId = req.params.id;
    storeService.getItemById(itemId)
        .then((item) => {
            res.json(item);
        })
        .catch((err) => {
            res.status(500).send({ message: err });
        });
});

app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then((allCategories) => {
            res.json(allCategories);
        })
        .catch((err) => {
            res.status(500).send({ message: err });
        });
});

// Route for serving the addItem.html file
app.get('/items/add', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/addItem.html'));
});

// POST route for adding an item
app.post('/items/add', upload.single('featureImage'), (req, res) => {
    if(req.file){
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded)=>{
            processItem(req, res, uploaded.url); // Pass req and res objects here
        });
    } else {
        processItem(req, res, ""); // Pass req and res objects here
    }
});

// Function to process item after upload
function processItem(req, res, imageUrl){ // Receive req and res objects as parameters
    req.body.featureImage = imageUrl;

    storeService.addItem(req.body)
        .then((item) => {
            console.log('Item added successfully:', item);
            res.redirect('/items');
        })
        .catch((err) => {
            console.error('Error adding item:', err);
            res.status(500).send('Error adding item');
        });
}

storeService.initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => console.log(`Express http server listening on port ${HTTP_PORT}`));
    })
    .catch((err) => {
        console.error(`Error initializing store-service: ${err}`);
    });
