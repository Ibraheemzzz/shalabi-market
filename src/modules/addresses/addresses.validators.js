const { body, param } = require('express-validator');

// These must match exactly the predefined regions in the plan
const VALID_REGIONS = [
    'عتيل - جبل المصرية',
    'عتيل - عتيل',
    'ارتاح',
    'اكتابا',
    'الجاروشية',
    'المسقوفة',
    'النزلة الشرقية',
    'النزلة الغربية',
    'النزلة الوسطى',
    'باقة الشرقية',
    'بلعا',
    'دير الغصون',
    'زيتا',
    'شويكة',
    'صيدا',
    'عزبة الجراد',
    'عزبة الطياح',
    'عزبة شوفة',
    'عزبة ناصر',
    'علار',
    'عنبتا',
    'فرعون',
    'قفين',
    'كفر اللبد',
    'مدينة طولكرم',
    'نزلة عيسى',
    'نور شمس'
];

/**
 * Address Validation Rules
 */

const createAddress = [
    body('first_name')
        .notEmpty().withMessage('First name is required')
        .isLength({ max: 100 }).withMessage('First name must be at most 100 characters'),
    body('last_name')
        .optional({ checkFalsy: true })
        .isLength({ max: 100 }).withMessage('Last name must be at most 100 characters'),
    body('phone_number')
        .notEmpty().withMessage('Phone number is required')
        .isLength({ min: 9, max: 20 }).withMessage('Phone number must be valid'),
    body('region')
        .notEmpty().withMessage('Region is required')
        .isIn(VALID_REGIONS).withMessage(`منطقة غير صالحة. الرجاء اختيار منطقة مدعومة`),
    body('street')
        .notEmpty().withMessage('Street is required')
        .isLength({ max: 255 }).withMessage('Street must be at most 255 characters'),
    body('is_default')
        .optional()
        .isBoolean().withMessage('is_default must be a boolean')
];

const updateAddress = createAddress; // Same rules apply for update

const checkAddressId = [
    param('id').isInt({ min: 1 }).withMessage('Address ID must be a valid integer')
];

module.exports = {
    createAddress,
    updateAddress,
    checkAddressId,
    VALID_REGIONS
};
