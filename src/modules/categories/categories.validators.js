const { body } = require('express-validator');

/**
 * Categories Validation Rules
 */

/**
 * Create category validation rules
 */
const create = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),

  body('parent_id')
    .optional({ nullable: true })   // ← يقبل null و undefined
    .custom(value => {
      if (value === null || value === undefined) return true;
      if (Number.isInteger(value) && value > 0) return true;
      throw new Error('Parent ID must be a positive integer or null');
    })
];

/**
 * Update category validation rules
 */
const update = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),

  body('parent_id')
    .optional({ nullable: true })   // ← يقبل null و undefined
    .custom(value => {
      if (value === null || value === undefined) return true;
      if (Number.isInteger(value) && value > 0) return true;
      throw new Error('Parent ID must be a positive integer or null');
    })
];

module.exports = {
  create,
  update
};
