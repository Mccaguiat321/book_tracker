const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// CORS options
const corsOptions = {
  origin: 'http://localhost:4200', // Allow requests from Angular app
  credentials: true,              // Allow cookies and session data
};

// Middleware configuration
app.use(cors(corsOptions)); 
app.use(bodyParser.json());

// Session configuration
app.use(session({
  secret: 'your-secret-key', // Replace with a more secure secret in production
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,  // Set to true when using HTTPS
    httpOnly: true, // Prevent JavaScript access to cookies
  },
}));

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',   // Set a proper password here
  database: 'book_tracker',
});



db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to the database');
});




app.post('/api/register', async (req, res) => {
  const { name, age, password } = req.body;

  // Check for required fields
  if (!name || !age || !password) {
    return res.status(400).json({ message: 'Name, age, and password are required fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO user (name, age, password) VALUES (?, ?, ?)';
    db.query(sql, [name, age, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return res.status(500).json({ message: 'Error inserting data' });
      }
      res.status(200).json({ message: 'Registration successful', result });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
});




app.post('/api/inserts', (req, res) => {
  const { expensestitle, userId } = req.body;

  // Check for required fields
  if (!expensestitle || !userId) {  // Ensure only the necessary fields are checked
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = 'INSERT INTO genre_of_books (use_id, genre) VALUES (?, ?)';
  db.query(sql, [userId, expensestitle], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ message: 'Error inserting data' });
    }
    res.status(200).json({ message: 'Data inserted successfully', result });
  });
});


app.post('/api/expenses_insert', (req, res) => {
  const { itemId, book_name, author } = req.body;
  const status = 0;  // Default status value

  // Ensure book_name and author are provided
  if (!book_name || !author) {
    return res.status(400).json({ message: 'Book Name and Author are required fields' });
  }

  // Check if itemId is provided and is a valid number (assuming it is an integer)
  if (!itemId || isNaN(itemId)) {
    return res.status(400).json({ message: 'Valid Item ID is required' });
  }

  // Insert the record into the database
  const sql = 'INSERT INTO books (g_id, book_name, author, status) VALUES (?, ?, ?, ?)';
  db.query(sql, [itemId, book_name, author, status], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);  // Logs the error for debugging
      return res.status(500).json({ message: 'Error saving item' });
    }
    res.status(200).json({ message: 'Item saved successfully', data: result });
  });
});




app.put('/api/update/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, age } = req.body;

  if (!name || !age) {
    return res.status(400).json({ message: 'Name and age are required fields' });
  }

  const sql = 'UPDATE user SET name = ?, age = ? WHERE id = ?';
  db.query(sql, [name, age, userId], (err, result) => {
    if (err) {
      console.error('Error updating data:', err);
      return res.status(500).json({ message: 'Error updating data' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  });
});
app.put('/update_expenses/:id', (req, res) => {
  const { book_name, author } = req.body;
  const { id } = req.params;

  if (!book_name || !author) {
    return res.status(400).json({ message: 'Book Name and Author are required fields' });
  }

  const sql = 'UPDATE books SET book_name = ?, author = ? WHERE id = ?';
  db.query(sql, [book_name, author, id], (err, result) => {
    if (err) {
      console.error('Error updating data:', err);
      return res.status(500).json({ message: 'Error updating data' });
    }
    // After updating, you can fetch the updated list or return a success message
    res.status(200).json({ message: 'Item updated successfully' });
  });
});



app.put('/api/update_title_expense/:id', (req, res) => {
  const genreId = parseInt(req.params.id); // Ensure the correct field is being passed
  const { genre } = req.body; // The correct field name in the request body

  if (!genre) {
    return res.status(400).json({ message: 'Genre is a required field' }); // Adjust the validation message accordingly
  }
  
  const sql = 'UPDATE genre_of_books SET genre = ? WHERE id = ?';
  db.query(sql, [genre, genreId], (err, result) => {
    if (err) {
      console.error('Error updating data:', err);
      return res.status(500).json({ message: 'Error updating data' });
    }
    res.status(200).json({ message: 'Item updated successfully' });
  });
});



app.delete('/api/delete_from_title_expense/:id', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const sql = 'DELETE FROM genre_of_books WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Error deleting data' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  });
});



app.delete('/delete_expenses/:id', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const sql = 'DELETE FROM books WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Error deleting item' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  });
});



app.delete('/api/delete/:id', (req, res) => {
  const userId = parseInt(req.params.id);

  const sql = 'DELETE FROM user WHERE id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error deleting data:', err);
      return res.status(500).json({ message: 'Error deleting data' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

// Get items with search functionality
app.get('/items', (req, res) => {
  let search = req.query.search || '';
  let sql = `SELECT * FROM user WHERE name LIKE ? OR id LIKE ? OR age LIKE ?`;
  
  // Prepare the search parameters to match the wildcard search
  const searchParams = [`%${search}%`, `%${search}%`, `%${search}%`];

  db.query(sql, searchParams, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});






app.get('/title_expenses', (req, res) => {
  const search = req.query.search || '';
  const page = parseInt(req.query.page, 10) || 1; // Ensure valid integer with base 10
  const limit = parseInt(req.query.limit, 10) || 10;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }

  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      genre_of_books.id AS genre_id,
      genre_of_books.genre,
      genre_of_books.use_id,
     
      COUNT(*) OVER() AS total_items
    FROM 
     
      genre_of_books 
    
    WHERE 
      (genre_of_books.genre LIKE ?)
      AND genre_of_books.use_id = ?
    LIMIT ? OFFSET ?
  `;

  const params = [`%${search}%`, userId, limit, offset];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    const totalItems = results.length > 0 ? results[0].total_items : 0;
    res.json({
      titleExpenses: results,
      totalItems,
    });
  });
});




app.get('/expenses', (req, res) => {
  const search = req.query.search || '';
  const itemId = req.query.itemId; // Get itemId from query parameters
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }

  if (!itemId) {
    return res.status(400).json({ message: 'Item ID is required.' });
  }

  const sql = `
    SELECT * 
    FROM books 
    WHERE (book_name LIKE ? OR id LIKE ? OR author LIKE ?)
    AND g_id = ?
  `;

  // Escape the search term to prevent SQL injection
  const searchParams = [`%${search}%`, `%${search}%`, `%${search}%`, itemId];

  db.query(sql, searchParams, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'No matching records found.' });
    }
    res.json(results);
  });
});





app.put('/api/items/:id/status', (req, res) => {
  const id = req.params.id;
  const { status } = req.body;  // status should be sent in the request body

  // Ensure that status is either 1 or 0
  if (status !== 1 && status !== 0) {
    return res.status(400).send('Invalid status value');
  }

  // Update status in the database
  const query = 'UPDATE books SET status = ? WHERE id = ?';
  db.query(query, [status, id], (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      return res.status(500).send('Error updating status');
    }
    res.json({ success: true, updatedStatus: status });
  });
});













// Route: Login
app.post('/login', (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  db.query('SELECT * FROM user WHERE name = ?', [name], async (error, results) => {
    if (error) {
      console.error('Database query error:', error);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Incorrect password' });
      }

      req.session.userId = user.id;

      return res.status(200).json({
        message: 'Login successful',
        userId: user.id,
        userName: user.name  // Add the user's name here
      });
    } catch (err) {
      console.error('Password comparison error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });
});
app.post('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Failed to destroy session');
    }
    // Clear the session cookie
    res.clearCookie('connect.sid');
    return res.status(200).send('Logged out successfully');
  });
});
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
