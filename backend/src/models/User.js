// User model: people who can sign up, log in, and own employees.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Cost factor for bcrypt: higher = slower to hash = much slower to brute-force.
// 12 is a common, safe choice that still hashes in well under a second.
const SALT_ROUNDS = 12;

// Simple email format check (detailed validation also happens in express-validator).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true, // creates a unique index in MongoDB -> duplicates cause error E11000 (409)
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true, // "John@X.com" and "john@x.com" are treated as the same email
      match: [EMAIL_REGEX, 'Email format is invalid'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      // select: false means the hash is NOT returned by queries unless we explicitly ask
      // for it with .select('+password') (only the login code does that).
      select: false,
    },
  },
  {
    // Custom names because the assignment uses snake_case timestamps.
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Hash the password automatically before saving, so a plain-text password
// can never reach the database, no matter which code path creates the user.
userSchema.pre('save', async function hashPassword() {
  // Only hash when the password is new or changed; otherwise we would hash the hash.
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// Compares a login attempt with the stored hash (bcrypt re-hashes and compares safely).
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Whenever a user is converted to JSON (e.g. res.json), strip private fields.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
