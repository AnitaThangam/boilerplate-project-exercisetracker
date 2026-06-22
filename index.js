const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI);

// Schemas
const userSchema = new mongoose.Schema({
  username: String
});

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create user
app.post('/api/users', async (req, res) => {
  const user = new User({
    username: req.body.username
  });

  await user.save();

  res.json({
    username: user.username,
    _id: user._id
  });
});

// Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find();

  res.json(users);
});

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {

  const user = await User.findById(req.params._id);

  const exerciseDate = req.body.date
    ? new Date(req.body.date)
    : new Date();

  const exercise = new Exercise({
    userId: user._id.toString(),
    description: req.body.description,
    duration: Number(req.body.duration),
    date: exerciseDate
  });

  await exercise.save();

  res.json({
    _id: user._id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString()
  });
});

// Get logs
app.get('/api/users/:_id/logs', async (req, res) => {

  const user = await User.findById(req.params._id);

  let query = {
    userId: req.params._id
  };

  if (req.query.from || req.query.to) {
    query.date = {};

    if (req.query.from) {
      query.date.$gte = new Date(req.query.from);
    }

    if (req.query.to) {
      query.date.$lte = new Date(req.query.to);
    }
  }

  let logs = await Exercise.find(query);

  if (req.query.limit) {
    logs = logs.slice(0, Number(req.query.limit));
  }

  const formattedLogs = logs.map(log => ({
    description: log.description,
    duration: log.duration,
    date: log.date.toDateString()
  }));

  res.json({
    username: user.username,
    count: formattedLogs.length,
    _id: user._id,
    log: formattedLogs
  });
});

// Start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});