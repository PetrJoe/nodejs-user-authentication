const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const User = require('./models/User');
const auth = require('./middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Database connection
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection established successfully');
    await sequelize.sync();
    console.log('Database synchronized');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

initializeDatabase();

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const user = await User.create(req.body);
    const { accessToken, refreshToken } = user.generateTokens();
    
    user.refreshToken = refreshToken;
    await user.save();
    
    res.status(201).json({ user, accessToken, refreshToken });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid login credentials');
    }
    
    const { accessToken, refreshToken } = user.generateTokens();
    user.refreshToken = refreshToken;
    await user.save();
    
    res.json({ user, accessToken, refreshToken });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Request password reset
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) throw new Error('User not found');

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Configure email transport here
    const transporter = nodemailer.createTransport({
      // Add your email service configuration
    });

    await transporter.sendMail({
      to: user.email,
      subject: 'Password Reset',
      text: `Reset your password using this token: ${resetToken}`
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        resetPasswordToken: req.body.token,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) throw new Error('Invalid or expired reset token');

    user.password = req.body.password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Change password (authenticated)
app.post('/api/auth/change-password', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!(await user.comparePassword(req.body.currentPassword))) {
      throw new Error('Current password is incorrect');
    }

    user.password = req.body.newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Refresh token
app.post('/api/auth/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const tokens = user.generateTokens();
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json(tokens);
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Routes
// Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

// Get single user
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  res.json(user);
});

// Create user
app.post('/api/users', async (req, res) => {
  const newUser = await User.create(req.body);
  res.json(newUser);
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  const [updated] = await User.update(req.body, {
    where: { id: req.params.id }
  });
  const updatedUser = await User.findByPk(req.params.id);
  res.json(updatedUser);
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  await User.destroy({
    where: { id: req.params.id }
  });
  res.json({ message: 'User deleted successfully' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});