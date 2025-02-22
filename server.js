const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create data directory and file paths
const dataDir = path.join(__dirname, 'data');
const productsFile = path.join(dataDir, 'products.json');
const ordersFile = path.join(dataDir, 'orders.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Load or initialize products
let products = [];
let nextProductId = 1;

try {
  if (fs.existsSync(productsFile)) {
    const data = fs.readFileSync(productsFile, 'utf8');
    products = JSON.parse(data);
    // Set nextProductId based on existing products
    const maxId = Math.max(...products.map(p => parseInt(p.id)));
    nextProductId = isFinite(maxId) ? maxId + 1 : 1;
  } else {
    // Initialize with default products if file doesn't exist
    products = [
      {
        id: "1",
        name: "Masala Dosa",
        description: "Crispy rice crepe served with potato masala and chutneys",
        price: 2.500,
        image: "https://via.placeholder.com/300"
      },
      {
        id: "2",
        name: "Paneer Butter Masala",
        description: "Cottage cheese cubes in rich tomato gravy",
        price: 3.500,
        image: "https://via.placeholder.com/300"
      },
      {
        id: "3",
        name: "Veg Biryani",
        description: "Fragrant rice cooked with mixed vegetables and aromatic spices",
        price: 3.000,
        image: "https://via.placeholder.com/300"
      }
    ];
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
  }
} catch (error) {
  console.error('Error loading products:', error);
}

// Helper function to save products with error handling
const saveProducts = () => {
  try {
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
    console.log('Products saved successfully');
  } catch (error) {
    console.error('Error saving products:', error);
  }
};

// Update POST endpoint for adding products
app.post('/products', (req, res) => {
  try {
    const newProduct = {
      id: nextProductId.toString(),
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      image: req.body.image || 'https://via.placeholder.com/300'
    };
    products.push(newProduct);
    nextProductId++;
    saveProducts();
    console.log('Product added:', newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Failed to add product' });
  }
});

// Update your product endpoints to use saveProducts
// Add GET endpoint for products
app.get('/products', (req, res) => {
  try {
    // Read the latest products from file
    const data = fs.readFileSync(productsFile, 'utf8');
    const currentProducts = JSON.parse(data);
    res.json(currentProducts);
  } catch (error) {
    console.error('Error reading products:', error);
    res.json(products); // Fallback to memory if file read fails
  }
});
// Add caching for products
let productsCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Update GET endpoint for products with caching
app.get('/products', (req, res) => {
  try {
    const now = Date.now();
    if (productsCache && (now - lastCacheTime < CACHE_DURATION)) {
      return res.json(productsCache);
    }

    const data = fs.readFileSync(productsFile, 'utf8');
    const currentProducts = JSON.parse(data);
    productsCache = currentProducts;
    lastCacheTime = now;
    res.json(currentProducts);
  } catch (error) {
    console.error('Error reading products:', error);
    res.json(products);
  }
});

// Update POST endpoint to use cache
app.post('/products', (req, res) => {
  try {
    const newProduct = {
      id: nextProductId.toString(),
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      image: req.body.image || 'https://via.placeholder.com/300'
    };
    
    products.push(newProduct);
    nextProductId++;
    saveProducts();
    
    // Update cache
    productsCache = [...products];
    lastCacheTime = Date.now();
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Failed to add product' });
  }
});

// Update delete endpoint to clear cache
app.delete('/products/:id', (req, res) => {
  try {
    const productId = req.params.id;
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    products.splice(productIndex, 1);
    saveProducts();
    
    // Clear cache
    productsCache = null;
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});
app.delete('/products', (req, res) => {
  try {
    const productId = req.params.id;
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    products.splice(productIndex, 1);
    saveProducts();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});
// Remove the duplicate delete endpoints and replace with this one
app.delete('/products', (req, res) => {
  try {
    products.length = 0;
    nextProductId = 1;
    console.log('All products deleted');
    res.status(200).json({ message: 'All products deleted successfully' });
  } catch (error) {
    console.error('Error deleting all products:', error);
    res.status(500).json({ message: 'Failed to delete all products' });
  }
});
// Update CORS to accept requests from your deployed frontend
app.use(cors({
  origin: ['https://your-user-app.netlify.app', 'https://your-admin-app.netlify.app']
}));
// Add near the top after imports
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// Orders array to store orders
let orders = [];
try {
  if (fs.existsSync(ordersFile)) {
    const data = fs.readFileSync(ordersFile, 'utf8');
    orders = JSON.parse(data);
  } else {
    orders = [];
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
  }
} catch (error) {
  console.error('Error loading orders:', error);
}

// Add orders caching
let ordersCache = null;
let lastOrdersCacheTime = 0;
const ORDERS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
// Add helper function to save orders
const saveOrders = () => {
  try {
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
    console.log('Orders saved successfully');
  } catch (error) {
    console.error('Error saving orders:', error);
  }
};
// Update POST endpoint for orders
app.post('/orders', (req, res) => {
  try {
    const newOrder = {
      id: (orders.length + 1).toString(),
      ...req.body,
      createdAt: new Date()
    };
    orders.push(newOrder);
    saveOrders();
    
    // Update cache
    ordersCache = [...orders];
    lastOrdersCacheTime = Date.now();
    
    console.log('Order added:', newOrder);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error adding order:', error);
    res.status(500).json({ message: 'Failed to add order' });
  }
});

// Update GET endpoint for orders to ensure fresh data
app.get('/orders', (req, res) => {
  try {
    const data = fs.readFileSync(ordersFile, 'utf8');
    const currentOrders = JSON.parse(data);
    ordersCache = currentOrders;
    lastOrdersCacheTime = Date.now();
    res.json(currentOrders);
  } catch (error) {
    console.error('Error reading orders:', error);
    res.json(orders);
  }
});
app.delete('/orders/:id', (req, res) => {
  try {
    const orderId = req.params.id;
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    orders.splice(orderIndex, 1);
    saveOrders(); // Save to file
    console.log('Order deleted:', orderId);
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Failed to delete order' });
  }
});

app.delete('/orders', (req, res) => {
  try {
    orders.length = 0;
    saveOrders(); // Save to file
    console.log('All orders deleted');
    res.status(200).json({ message: 'All orders deleted successfully' });
  } catch (error) {
    console.error('Error deleting all orders:', error);
    res.status(500).json({ message: 'Failed to delete orders' });
  }
});