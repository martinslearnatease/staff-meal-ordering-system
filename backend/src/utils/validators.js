const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
});

const staffLoginSchema = Joi.object({
  staff_id: Joi.string().alphanum().min(3).max(20).required(),
  password: Joi.string().min(6).required(),
});

const createOrderSchema = Joi.object({
  location: Joi.string().valid('Abuja', 'Lagos').required(),
  meal_category: Joi.string().valid('Rice', 'Swallow').required(),
  rice_type: Joi.string().valid('Jollof Rice', 'Fried Rice', 'White Rice').when('meal_category', {
    is: 'Rice',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  swallow_type: Joi.string().valid('Akpu/Fufu', 'Semo', 'Wheat').when('meal_category', {
    is: 'Swallow',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  soup: Joi.string().valid('Egusi', 'Vegetable', 'Ogbono', 'Oha').when('meal_category', {
    is: 'Swallow',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  protein: Joi.string().required(),
  rice_combination: Joi.string().when('meal_category', {
    is: 'Rice',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});

const createUserSchema = Joi.object({
  staff_id: Joi.string().alphanum().min(3).max(20),
  name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  department: Joi.string().max(100),
  location: Joi.string().valid('Abuja', 'Lagos'),
  role: Joi.string().valid('admin', 'staff', 'chef').required(),
});

const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const messages = error.details.map((detail) => detail.message);
    return { valid: false, messages, errors: error.details };
  }
  return { valid: true, value };
};

module.exports = {
  loginSchema,
  staffLoginSchema,
  createOrderSchema,
  createUserSchema,
  validate,
};
