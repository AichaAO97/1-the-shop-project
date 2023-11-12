const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const errorController = require('./controllers/error');
const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');



app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


// all requests will have a user object which is a sequelize object that can be used in all controllers
app.use((req, res, next) => {
  User.findByPk(1)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);


Product.belongsTo(User, { constraints: true, onDelete: 'CASCADE'});
User.hasMany(Product); // optional
User.hasOne(Cart);
Cart.belongsTo(User); // optional
/** Many to Many relationship between Cart and Product **/
Cart.belongsToMany(Product, {through: CartItem}); 
Product.belongsToMany(Cart, {through: CartItem});
/* ** */
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, {through: OrderItem});
Product.belongsToMany(Order, {through: OrderItem}); // this line can be removed

sequelize
  // .sync({force: true})
  .sync()
  .then(result =>{
    return User.findByPk(1);
    
  })
  .then( user => {
    if(!user) {
      return User.create({name:'Aicha', email: 'test@test.com'});
    }
    return user;
  })
  .then( user => {
    // once we have a user, we need to create a cart for them
    return user.createCart();
  })
  .then(cart => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });

