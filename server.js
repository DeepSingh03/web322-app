/*********************************************************************************
*  WEB322 – Assignment 05
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
const express = require("express")
const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');

const app = express() 
const HTTP_PORT = process.env.PORT || 8080;

const formatDate = function(dateObj){
  let year = dateObj.getFullYear();
  let month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  let day = dateObj.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

Handlebars.registerHelper('formatDate', formatDate);

Handlebars.registerHelper('safeHTML', function(options) {
  return new Handlebars.SafeString(options.fn(this));
});

app.use(function(req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
})

const hbs = exphbs.create({ 
  extname: ".hbs",
  helpers: {
    navLink: function (url, options) {
      return (
        '<li class="nav-item"><a ' +
        (url == app.locals.activeRoute ? ' class="nav-link active" ' : ' class="nav-link" ') +
        ' href="' +
        url +
        '">' +
        options.fn(this) +
        "</a></li>"
      );
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  }
});

app.engine('hbs', hbs.engine); 
app.set('view engine', 'hbs');

const path = require('path');
const storeService = require('./store-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({ 
    cloud_name: 'dnbvpdklc',
    api_key: 769892587259137,
    api_secret: 'aB3DAmOfVB6ZzNAewQkpjdNjJX4',
  secure: true
});

const upload = multer(); 

app.get('/items/add', (req, res) => {

  storeService.getCategories()
    .then(categories => {
      res.render("addItem", { categories: categories });
    })
    .catch(error => {
      res.render("addItem", { categories: [] });
    });
});

app.post('/items/add', upload.single('featureImage'), (req, res) => {
  if (req.file) {
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

    async function uploadToCloudinary(req) {
      try {
        let result = await streamUpload(req);
        console.log(result);
        processItem(result.secure_url);
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        processItem('');
      }
    }

    uploadToCloudinary(req);
  } else {
    processItem('');
  }

  function processItem(imageUrl) {
  
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const postDate = `${year}-${month}-${day}`;

    req.body.featureImage = imageUrl;
    req.body.postDate = postDate;

    req.body.category = parseInt(req.body.category);

    storeService.addItem(req.body)    
      .then(() => {
        res.redirect('/items');
      })
      .catch(error => {
        console.error('Error adding item:', error);
        res.status(500).send('Error adding item');
      });
  }
});

app.use(express.urlencoded({ extended: true }));

app.get('/categories/add', (req, res) => {
    res.render('addCategory');
});

app.post('/categories/add', (req, res) => {
    storeService.addCategory(req.body)
        .then(() => {
            res.redirect('/categories');
        })
        .catch(error => {
            console.error('Error adding category:', error);
            res.status(500).send('Error adding category');
        });
});

app.get('/categories/delete/:id', (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect('/categories');
        })
        .catch(error => {
            console.error('Error deleting category:', error);
            res.status(500).send('Unable to Remove Category / Category not found');
        });
});

app.get('/items/delete/:id', (req, res) => {
    storeService.deletePostById(req.params.id)
        .then(() => {
            res.redirect('/items');
        })
        .catch(error => {
            console.error('Error deleting item:', error);
            res.status(500).send('Unable to Remove Item / Item not found');
        });
});


app.use(express.static("public"));

app.get('/', (req, res) => {
    res.redirect('/shop');
  });

app.get('/about', (req, res) => {
   res.render('about');
  });

 
app.get("/shop", async (req, res) => {
  let viewData = {};

  try {
    let items = [];

    if (req.query.category) {
 
      items = await storeService.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await storeService.getPublishedItems();
    }

    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    let post = items[0];

    viewData.items = items;
    viewData.post = post;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    let categories = await storeService.getCategories();

    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  res.render("shop", { data: viewData });
});

app.get('/shop/:id', async (req, res) => {

  let viewData = {};

  try{

      let items = [];
      if(req.query.category){
          items = await storeService.getPublishedItemsByCategory(req.query.category);
      }else{
          items = await storeService.getPublishedItems();
      }
      items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      viewData.items = items;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      viewData.post = await storeService.getItemById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      let categories = await storeService.getCategories();
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  res.render("shop", {data: viewData})
});
  
app.get('/items', (req, res) => {

  const { category, minDate } = req.query;

  if (category) {
      storeService.getItemsByCategory(category)
          .then(data => {
              if (data.length > 0) {
                  res.render("items", { items: data });
              } else {
                  res.render("items", { message: "no results" });
              }
          })
          .catch(err => res.render("items", { message: "no results" })); 
  }
  else if (minDate) {
      storeService.getItemsByMinDate(minDate)
          .then(data => {
              if (data.length > 0) {
                  res.render("items", { items: data });
              } else {
                  res.render("items", { message: "no results" });
              }
          })
          .catch(err => res.render("items", { message: "no results" })); 
  }
  else {
      storeService.getAllItems()
          .then(data => {
              if (data.length > 0) {
                  res.render("items", { items: data });
              } else {
                  res.render("items", { message: "no results" });
              }
          })
          .catch(err => res.render("items", { message: "no results" })); 
  }
});

app.get('/item/:id', (req, res) => {
  const itemId = req.params.id;

  storeService.getItemById(itemId)
      .then(item => {
          if (item) {
              res.json(item);
          } else {
              res.status(404).json({ message: 'Item not found' });
          }
      })
      .catch(err => res.status(500).json({ message: err }));
});

app.get('/categories', (req, res) => {
  storeService.getCategories()
      .then(data => {
          if (data.length > 0) {
              res.render("categories", { categories: data });
          } else {
              res.render("categories", { message: "no results" });
          }
      })
      .catch(err => res.render("categories", { message: "no results" }));
});

app.get('/Items/delete/:id', (req, res) => {
  storeService.deletePostById(req.params.id)
      .then(() => {
          res.redirect('/Items');
      })
      .catch(error => {
          console.error('Error deleting post:', error);
          res.status(500).send('Unable to Remove Post / Post not found');
      });
});

  app.use(function(req, res) {
    res.render('404');
  })

app.listen(HTTP_PORT, onHttpStart);

function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
    
    return storeService.initialize()
        .then(function (data) {
            console.log(data);
        })
        .catch(function (err) {
            console.log(err);
        });
}

async function deletePostById(id) {
  try {
      await storeService.deletePostById(id);
      console.log(`Post with ID ${id} successfully deleted.`);
  } catch (error) {
      console.error(`Error deleting post with ID ${id}: ${error}`);
  }
}