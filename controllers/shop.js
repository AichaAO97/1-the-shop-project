const Product = require('../models/product');
const Cart = require('../models/cart');

exports.getProducts = (req, res, next) => {

  Product.findAll().then(products => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products'
    });
  }).catch(err => console.log(err));

};

exports.getProduct = (req, res, next) => {

  const prodId = req.params.productId;

  Product.findByPk(prodId).then(
    (product) => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
      
    }
  ).catch(err => {
    console.log(err);
  });

}

exports.getIndex = (req, res, next) => {

  Product.findAll().then(products => {
    res.render('shop/index', {
      prods: products,
      path: '/',
      pageTitle: 'Shop',
    });
  }).catch(err => console.log(err));
  
};

exports.getCart = (req, res, next) => {
  
  req.user.getCart()
    .then(cart => {
      return cart.getProducts();
    })
    .then(products => {
      // console.log({products});
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
  
      });
    })
    .catch(err => {
      console.log(err);
    });

  // Before adding the one to many relationship
  /*
  Cart.getCart(cart => {

    Product.fetchAll(products => {
      const cartProducts = [];
      for (let product of products) {
        const cartProductData = cart.products.find( prod => prod.id === product.id);
        if (cartProductData) {
          cartProducts.push({productData: product, qty: cartProductData.qty});
        }
      }
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: cartProducts
  
      });
    });

  });
  */
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  let fetchedCart;
  let newQuantity = 1;

  req.user
    .getCart()
    .then(cart => {
      fetchedCart = cart;
      return cart.getProducts({where: {id: prodId}});
    })
    .then( prod => {
      let product;
      if (prod.length > 0) {
        product = prod[0];
      }
      // If product in cart, get its quantity then increment it
      if (product) {
        const oldQuantity = product.cartItem.quantity;
        newQuantity = oldQuantity + 1;
        return product;
      }
      // If no product in cart, get product from Product table
      return Product.findByPk(prodId);
    })
    .then(product => {
      return fetchedCart.addProduct(product, { through: { quantity: newQuantity }});
    })
    .then(()=> {
      res.redirect('/cart');
    })
    .catch(err => {
      console.log(err);
    })


  // Before many to many relationship
  /*
  Product.findById(prodId, (product) => {
    Cart.addProduct(prodId, product.price);
  });
  res.redirect('/cart');
  */
};


exports.postCartDeleteProduct = (req, res, next) => {
  const productId = req.body.productId;
  req.user.getCart()
    .then(cart => {
      return cart.getProducts({where: {id: productId}});
    })
    .then(prod => {
      let product = prod[0];
      return product.cartItem.destroy();
    })
    .then((result)=> {
      res.redirect('/cart');
    })
    .catch(err => {
      console.log(err);
    });
  const product = Product.findByPk(productId, product => {
    Cart.deleteProduct(productId, product.price);
    res.redirect('/cart');
  })
}


exports.postOrder = (req, res, next) => {
  let fetchedCart;
  req.user.getCart()
    .then(cart => {
      fetchedCart = cart;
      return cart.getProducts();
    })
    .then(products => {
      return req.user.createOrder()
              .then(order => {
                return order.addProducts(products.map(product => {
                  product.orderItem = {quantity: product.cartItem.quantity};
                  return product;
                }));
              })
              .catch(err => console.log(err));
      
    })
    .then(result => {
      return fetchedCart.setProducts(null);
    })
    .then((result) => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
}


exports.getOrders = (req, res, next) => {
  req.user
    .getOrders({include: ['products']})
    .then(orders => {
      console.log(orders);
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));
};
