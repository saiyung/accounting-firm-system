const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '请提供姓名'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, '请提供邮箱'],
      unique: true,
      lowercase: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        '请提供有效的邮箱地址',
      ],
    },
    password: {
      type: String,
      required: [true, '请提供密码'],
      minlength: [6, '密码至少需要6个字符'],
      select: false, // 查询时默认不返回密码
    },
    role: {
      type: String,
      enum: ['admin', 'partner', 'manager', 'accountant', 'assistant'],
      default: 'accountant',
    },
    phone: {
      type: String,
      match: [/^1[3-9]\d{9}$/, '请提供有效的手机号码'],
    },
    department: {
      type: String,
      enum: ['审计', '税务', '内控', '资产评估', '管理'],
      default: '审计',
    },
    avatar: {
      type: String,
      default: 'default-avatar.jpg',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// 保存前加密密码
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 比较密码是否匹配
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 生成JWT Token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User; 