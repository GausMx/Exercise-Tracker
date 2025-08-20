const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
// Add this line to connect to your database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB successfully connected'))
  .catch(err => console.error('MongoDB connection error:', err));
app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' })
});
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
});
const User = mongoose.model('User', userSchema);
app.post('/api/users', async(req, res) => {
  const { username } = req.body;
  try {
    const newUser = new User({
      username: username
    });
    const savedUser = await newUser.save();
    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});
app.get('/api/users', async(req, res) => {
  try{
      const users = await User.find({});
      const formattedUsers = users.map(user => ({
        username: user.username,
        _id: user._id
      }));
      res.json(formattedUsers);
  } catch (err) {
    res.json({error: err.message});
  }
})

const exerciseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: false
  }

});
const Exercise = mongoose.model('Exercise', exerciseSchema);
app.post('/api/users/:_id/exercises', async(req, res) => {
  const userId = req.params._id;
  const {description, duration, date} = req.body;
  try{
    const user = await User.findById(userId);
    if (!user) {
      return res.json({error: "User not found" });
    }
  const newExercise = new Exercise({
    userId: userId,
    description: description,
    duration: Number(duration),
    date: date ? new Date(date) : new Date()
  });
    const savedExercise = await newExercise.save();
    res.json({
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date.toDateString(),
      username: user.username,
      _id: user._id
    });
  }catch (err) {
    res.json({error: err.message});
  }
})
app.get('/api/users/:_id/logs', async(req, res) => {
  const userId = req.params._id;
  const { from, to, limit} = req.query;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.json({error: "User not found"});
    }
    const query = { userId: userId };
    if (from) {
      query.date = { $gte: new Date(from)};
    }
    if (to) {
      query.date = { ...query.date, $lte: new Date(to)};
    };
    const exercises = await Exercise.find(query).limit(parseInt(limit) || 0);
    const formattedExercises = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }));
    res.json({
      _id: user._id,
      username: user.username,
      count: formattedExercises.length,
      log: formattedExercises
    });
  }
  catch (err) {
    res.json({error: err.message});
  }
})
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

