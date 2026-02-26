const { body, param } = require('express-validator');

/**
 * Orders Validation Rules
 */

const { VALID_REGIONS } = require('../addresses/addresses.validators');

/**
 * Place order validation rules
 */
const placeOrder = [
  body('items')
    .notEmpty()
    .withMessage('Items are required')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),

  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid product ID'),

  body('items.*.quantity')
    .isFloat({ min: 0.001 })
    .withMessage('Each item must have a quantity greater than 0'),

  // Validation allows either an address_id OR explicit address fields (for guest checkout)
  body('address_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Valid address ID is required if not providing explicit address details'),

  body('first_name')
    .if(body('address_id').not().exists())
    .notEmpty().withMessage('First name is required if no address_id provided')
    .isLength({ max: 100 }),

  body('last_name')
    .if(body('address_id').not().exists())
    .notEmpty().withMessage('Last name is required if no address_id provided')
    .isLength({ max: 100 }),

  body('region')
    .if(body('address_id').not().exists())
    .notEmpty().withMessage('Region is required if no address_id provided')
    .isIn(VALID_REGIONS).withMessage(`منطقة غير صالحة. الرجاء اختيار منطقة مدعومة`),

  body('street')
    .if(body('address_id').not().exists())
    .notEmpty().withMessage('Shipping street is required if no address_id provided')
    .isLength({ max: 255 }).withMessage('Shipping street must be at most 255 characters'),

  body('phone_number')
    .if(body('address_id').not().exists())
    .notEmpty().withMessage('Phone number is required if no address_id provided')
    .isLength({ min: 9, max: 20 }).withMessage('Phone number must be valid')
];

/**
 * Cancel order validation rules
 */
const cancelOrder = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a positive integer')
];

/**
 * Change order status validation rules (admin)
 */
const changeStatus = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a positive integer'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Confirmed', 'Shipped', 'Delivered', 'Cancelled'])
    .withMessage('Status must be one of: Confirmed, Shipped, Delivered, Cancelled')
];

module.exports = {
  placeOrder,
  cancelOrder,
  changeStatus
};
