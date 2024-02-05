const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');

mongoose.connect("mongodb+srv://akeelah:smart001@cluster0.zhk5ybj.mongodb.net/todolistDB")
    .then(() => console.log("Database connection was successful."))
    .catch(err => console.log(err));

const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Todo field can't be empty"]
    }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Complete a module."
});

const item2 = new Item({
    name: "Finish multistep signup."
});

const item3 = new Item({
    name: "check out daily challenges."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
})

const List = mongoose.model('List', listSchema);

app.get('/', (req, res) => {

    Item.find()
        .then(todoList => {
            if (todoList.length === 0) {
                Item.insertMany(defaultItems)
                    .then(() => console.log("Default items inserted."))
                    .catch(err => console.log(err));
                res.redirect('/');
            } else {
                res.render('list', { listTittle: "Today", itemList: todoList });
            }
        })
        .catch(err => console.log(err))
});


app.get('/:customListName', (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName })
        .then(list => {
            if (list) {
                res.render('list', {listTittle: list.name, itemList: list.items});
            } else {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                
                list.save();
                res.redirect('/' + customListName);
            }
        })
        .catch(err => console.log(err));
});

app.post('/', (req, res) => {
    const itemName = req.body.item;
    const listName = req.body.list;

    const newItem = new Item({ name: itemName });

    if (listName === 'Today') {
        newItem.save();
        res.redirect('/');
    } else {
        List.findOne({name: listName})
            .then(foundList => {
                foundList.items.push(newItem);
                foundList.save();
                res.redirect('/' + listName);
            })
            .catch(err => console.log(err));
    }

});

app.post('/delete', (req, res) => {
    const checkedId = req.body.checkbox;
    const listName = req.body.listName;
    console.log(listName);

    if (listName === "Today") {
        Item.findOneAndDelete(checkedId)
            .then(() => console.log('1 item deleted.'))
            .catch(err => console.log(err));
    
        res.redirect('/');
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedId}}})
            .then(() => console.log(`${listName} item deleted.`))
            .catch(err => console.log(err));
        
        res.redirect('/' + listName);
    }
})


app.get('/about', (req, res) => {
    res.render('about');
});

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log('Listening at port 3000!');
});