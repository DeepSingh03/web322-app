const fs = require('fs').promises;
const path = require('path');

let items = [];
let categories = [];

module.exports.initialize = function() {
    return new Promise((resolve, reject) => {
        Promise.all([
            fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf8').then(data => {
                items = JSON.parse(data);
            }),
            fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf8').then(data => {
                categories = JSON.parse(data);
            })
        ]).then(() => {
            resolve("Successfully initialized data.");
        }).catch(err => {
            reject("Failed to initialize data: " + err);
        });
    });
};

module.exports.getAllItems = function() {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            reject("No items returned");
        } else {
            resolve(items);
        }
    });
};

module.exports.getPublishedItems = function() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published === true);
        if (publishedItems.length === 0) {
            reject("No published items returned");
        } else {
            resolve(publishedItems);
        }
    });
};

module.exports.getCategories = function() {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            reject("No categories returned");
        } else {
            resolve(categories);
        }
    });
};

module.exports.addItem = function(itemData) {
    return new Promise((resolve, reject) => {
        itemData.published = itemData.published === undefined ? false : true;
        itemData.id = items.length + 1;
        items.push(itemData);
        resolve(itemData);
    });
};

module.exports.getItemsByCategory = function(category) {
    return new Promise((resolve, reject) => {
        const itemsByCategory = items.filter(item => item.category === category);
        if (itemsByCategory.length === 0) {
            reject("No results returned");
        } else {
            resolve(itemsByCategory);
        }
    });
};

module.exports.getItemsByMinDate = function(minDateStr) {
    return new Promise((resolve, reject) => {
        const itemsByMinDate = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));
        if (itemsByMinDate.length === 0) {
            reject("No results returned");
        } else {
            resolve(itemsByMinDate);
        }
    });
};

module.exports.getItemById = function(id) {
    return new Promise((resolve, reject) => {
        const item = items.find(item => item.id === id);
        if (!item) {
            reject("No result returned");
        } else {
            resolve(item);
        }
    });
};
