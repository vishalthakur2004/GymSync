import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { 
        type: String,
        required: true,
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
    },
    phone: { 
        type: String, 
        required: true, 
        unique: true,
    },
    password: { 
        type: String, 
        required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'trainer', 'member'],
      default: 'member',
    },
    isVerified: { 
        type: Boolean, 
        default: false,
    },
    subscriptionPlan: {
      type: String,
      enum: ['basic', 'premium', null],
      default: null,
    },
    subscriptionValidTill: { 
        type: Date,
    },
    trainerAssigned: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
    },
    lastLoginAt: { 
        type: Date,
    },
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);