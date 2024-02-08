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

let temporaryList = []

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

// User login Test functionality.
const usersSchema = new mongoose.Schema({
    userName: String,
    password: String,
    defualtTodos: [itemsSchema],
    customList: [listSchema]
});

const User = mongoose.model("User", usersSchema);

// Home route should only render a temporary list items.
app.get('/', (req, res) => {

    if (temporaryList.length === 0) {
        temporaryList = temporaryList.concat(defaultItems);
        console.log("Default items inserted.");
        res.redirect('/');
    } else {
        res.render('list', { listTittle: "Today", itemList: temporaryList });
    }

});

app.post("/", (req, res) => {
    const itemName = req.body.item;

    const newItem = new Item({ name: itemName });

    temporaryList.push(newItem);
    res.redirect('/');
});

app.post("/delete", (req, res) => {
    const checkedId = req.body.checkbox;

    temporaryList.forEach(item => {
        const idString = String(item._id);
        if (idString === checkedId) {
            _.pull(temporaryList, item);
        }
    });
    res.redirect("/");
});


// User signup test functionality.

app.get('/signup', (req, res) => {
    res.render('signup');
})

// Find user and login or create account

app.post('/signup', (req, res) => {
    const userName = req.body.userName;
    const password = req.body.password;

    User.findOne({ userName: userName })
        .then(user => {
            if (user && user.password === password) {
                res.redirect(`/${user._id}/dashboard`);
            } else if (user) {
                res.redirect("/signup")
            } else {
                const user = new User({
                    userName: userName,
                    password: password,
                    defualtTodos: defaultItems
                });
                Item.insertMany(defaultItems)
                user.save();

                res.redirect(`/${user._id}/dashboard`);
            }
        })
        .catch(err => console.log(err));
});

app.get('/:userId/dashboard', (req, res) => {
    const accountID = req.params.userId;
    User.findById(accountID)
        .then(account => {
            res.render('user', {
                listTittle: "Today",
                itemList: account.defualtTodos,
                userId: accountID
            })
        })
        .catch(err => console.log(err));
});

app.post('/:userId', (req, res) => {
    const accountID = req.params.userId;
    const itemName = req.body.item;
    const listName = req.body.list;

    const newItem = new Item({ name: itemName });

    User.findById(accountID)
        .then(account => {
            if (listName === "Today") {
                account.defualtTodos.push(newItem);
                // newItem.save(); 
                account.save();
                res.redirect("/" + accountID + "/dashboard");
            } else {
                const foundList = _.find(account.customList, { name: listName });

                foundList.items.push(newItem);
                account.save();
                res.redirect(`/${accountID}/${listName}`);
            }
        })
        .catch(err => console.log(err));
});


app.post('/:userId/delete', (req, res) => {
    const accountID = req.params.userId;
    const checkedId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        User.findByIdAndUpdate(accountID, { $pull: { defualtTodos: { _id: checkedId } } })
            .catch(err => console.log(err));
        res.redirect("/" + accountID + "/dashboard");
    } else {
        User.findById(accountID)
            .then(account => {
                const foundList = _.find(account.customList, { name: listName });

                foundList.items.forEach(doc => {
                    if (String(doc._id) === checkedId) {
                        foundList.items.pull(doc);
                    }
                })
                account.save();
                res.redirect(`/${accountID}/${listName}`);
            })
            .catch(err => console.log(err));

    }
})

app.get('/:userId/:customListName', (req, res) => {
    const accountID = req.params.userId;
    const customListName = _.capitalize(req.params.customListName);

    User.findById(accountID)
        .then(account => {
            const foundList = _.find(account.customList, { name: customListName })
            if (foundList) {
                res.render('user', {
                    listTittle: foundList.name,
                    itemList: foundList.items,
                    userId: accountID
                })
            } else {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                account.customList.push(list);
                account.save();

                res.redirect(`/${accountID}/${customListName}`);
            }
        })
        .catch(err => console.log(err));

});

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log('Listening at port 3000!');
});