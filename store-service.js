const Sequelize = require('sequelize');

const sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'Ysrg6GIq7Pue', {
  host: 'ep-divine-wildflower-a5e56p6t-pooler.us-east-2.aws.neon.tech',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
      ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});
const Item = sequelize.define('Item', {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE
});

const Category = sequelize.define('Category', {
  category: Sequelize.STRING
});

Item.belongsTo(Category, { foreignKey: 'category' });
module.exports.initialize = function() {
  return new Promise(function(resolve, reject) {
      sequelize.sync()
          .then(() => {
              resolve("Database synchronization successful.");
          })
          .catch(error => {
              reject("Unable to synchronize the database: " + error.message);
          });
  });
};

module.exports.getAllItems = function () {
  return new Promise(function(resolve, reject) {
    Item.findAll()
      .then(items => {
        if (items && items.length > 0) {
          resolve(items);
        } else {
          reject("No items found");
        }
      })
      .catch(error => {
        reject("Error fetching items: " + error.message);
      });
  });
};

module.exports.getCategories = function () {
  return new Promise(function(resolve, reject) {
      Category.findAll()
          .then(categories => {
              resolve(categories);
          })
          .catch(error => {
              reject("Error retrieving categories: " + error.message);
          });
  });
};
module.exports.addItem = function(itemData) {
  return new Promise(function(resolve, reject) {
      itemData.published = (itemData.published) ? true : false;
      for (let prop in itemData) {
          if (itemData[prop] === "") {
              itemData[prop] = null;
          }
      }
      itemData.postDate = new Date();
      Item.create(itemData)
          .then(() => {
              resolve();
          })
          .catch(error => {
              reject("Unable to create post: " + error.message);
          });
  });
};

module.exports.getItemsByCategory = function(category) {
  return new Promise(function(resolve, reject) {
      Item.findAll({
              where: {
                  category: category
              }
          })
          .then(items => {
              resolve(items);
          })
          .catch(error => {
              reject("Error retrieving items by category: " + error.message);
          });
  });
};

module.exports.getItemsByMinDate = function(minDateStr) {
  return new Promise(function(resolve, reject) {
      Item.findAll({
              where: {
                  postDate: {
                      [Sequelize.Op.gte]: new Date(minDateStr)
                  }
              }
          })
          .then(items => {
              resolve(items);
          })
          .catch(error => {
              reject("Error retrieving items by minimum date: " + error.message);
          });
  });
};

module.exports.getItemById = function(id) {
  return new Promise(function(resolve, reject) {
      Item.findAll({
              where: {
                  id: id
              }
          })
          .then(items => {
              if (items && items.length > 0) {
                  resolve(items[0]);
              } else {
                  reject("No item found with the specified ID.");
              }
          })
          .catch(error => {
              reject("Error retrieving item by ID: " + error.message);
          });
  });
};

module.exports.getPublishedItems = function () {
  return new Promise(function(resolve, reject) {
      Item.findAll({
              where: {
                  published: true
              }
          })
          .then(items => {
              resolve(items);
          })
          .catch(error => {
              reject("Error retrieving published items: " + error.message);
          });
  });
};

module.exports.getPublishedItemsByCategory = function(category) {
  return new Promise(function(resolve, reject) {
      Item.findAll({
              where: {
                  published: true,
                  category: category
              }
          })
          .then(items => {
              resolve(items);
          })
          .catch(error => {
              reject("Error retrieving published items by category: " + error.message);
          });
  });
};

module.exports.addCategory = function(categoryData) {
  return new Promise(function(resolve, reject) {
      for (let prop in categoryData) {
          if (categoryData[prop] === "") {
              categoryData[prop] = null;
          }
      }

      Category.create(categoryData)
          .then(() => {
              resolve();
          })
          .catch(error => {
              reject("Unable to create category: " + error.message);
          });
  });
};
module.exports.deleteCategoryById = function(id) {
  return new Promise(function(resolve, reject) {
      Category.destroy({
              where: {
                  id: id
              }
          })
          .then(() => {
              resolve();
          })
          .catch(error => {
              reject("Error deleting category: " + error.message);
          });
  });
};

module.exports.deletePostById = function(id) {
  return new Promise(function(resolve, reject) {
      Item.destroy({
              where: {
                  id: id
              }
          })
          .then(() => {
              resolve();
          })
          .catch(error => {
              reject("Error deleting post: " + error.message);
          });
  });
};

