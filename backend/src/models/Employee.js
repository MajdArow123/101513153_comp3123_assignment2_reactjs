// Employee model: every employee belongs to exactly one user (its owner).
const mongoose = require('mongoose');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const employeeSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name must be at most 50 characters'],
    },
    last_name: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name must be at most 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [EMAIL_REGEX, 'Email format is invalid'],
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
      maxlength: [100, 'Position must be at most 100 characters'],
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      validate: {
        validator: (value) => value > 0,
        message: 'Salary must be greater than 0',
      },
    },
    date_of_joining: {
      type: Date,
      required: [true, 'Date of joining is required'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      maxlength: [100, 'Department must be at most 100 characters'],
    },
    // The owner. Always set from the logged-in user's JWT, never from the request body.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner user is required'],
      index: true, // we filter by owner on every query, so an index keeps that fast
      immutable: true, // once created, the owner can never be changed
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// On create, make sure the owner actually exists, so we never store an
// employee that points at a deleted or made-up user.
employeeSchema.pre('validate', async function checkOwnerExists() {
  if (!this.isNew || !this.user) return;

  const ownerExists = await mongoose.model('User').exists({ _id: this.user });
  if (!ownerExists) {
    // invalidate() turns this into a normal Mongoose ValidationError (-> 400).
    this.invalidate('user', 'Referenced user does not exist');
  }
});

employeeSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Employee', employeeSchema);
