const productsService = require('./products.service');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  createdResponse,
  serverErrorResponse
} = require('../../utils/response');
const logger = require('../../config/logger');

/**
 * Products Controller
 * Handles HTTP request and response for product endpoints
 */
const SALE_TYPES = ['kg', 'piece'];

const withController = ({ context, fallbackMessage, mapError }, handler) => async (req, res) => {
  try {
    return await handler(req, res);
  } catch (error) {
    const mappedError = mapError ? mapError(error) : null;

    if (mappedError) {
      if (mappedError.type === 'not_found') {
        return notFoundResponse(res, mappedError.resource);
      }

      return errorResponse(
        res,
        mappedError.message,
        mappedError.status,
        mappedError.data ?? null
      );
    }

    logger.error(`${context} error:`, { error: error.message, stack: error.stack });
    return serverErrorResponse(res, fallbackMessage);
  }
};

const parseId = (rawId) => {
  const parsedId = Number.parseInt(rawId, 10);
  return Number.isNaN(parsedId) ? null : parsedId;
};

const getPagination = ({ page, limit }) => ({
  page: page || 1,
  limit: limit || 20
});

/**
 * Get all products
 * GET /api/products
 * Public route
 */
const getProducts = withController(
  {
    context: 'Get products',
    fallbackMessage: 'Failed to get products'
  },
  async (req, res) => {
    const { search, category_id, sale_type, sort, order, page, limit } = req.query;

    if (sale_type && !SALE_TYPES.includes(sale_type)) {
      return errorResponse(res, 'Invalid sale_type. Must be "kg" or "piece"', 400);
    }

    const result = await productsService.getProducts({
      search,
      category_id,
      sale_type,
      sort,
      order,
      ...getPagination({ page, limit })
    });

    return successResponse(res, result, 'Products retrieved successfully');
  }
);

/**
 * Get product by ID
 * GET /api/products/:id
 * Public route
 */
const getProductById = withController(
  {
    context: 'Get product',
    fallbackMessage: 'Failed to get product',
    mapError: (error) => {
      if (error.message === 'Product not found') {
        return { type: 'not_found', resource: 'Product' };
      }
      return null;
    }
  },
  async (req, res) => {
    const productId = parseId(req.params.id);

    if (productId === null) {
      return errorResponse(res, 'Invalid product ID', 400);
    }

    const product = await productsService.getProductById(productId);

    return successResponse(res, product, 'Product retrieved successfully');
  }
);

/**
 * Create product (admin only)
 * POST /api/admin/products
 */
const createProduct = withController(
  {
    context: 'Create product',
    fallbackMessage: 'Failed to create product',
    mapError: (error) => {
      if (error.message === 'Category not found') {
        return { status: 404, message: error.message };
      }
      return null;
    }
  },
  async (req, res) => {
    const { name, description, price, cost_price, sale_type, stock_quantity, category_id } = req.body;

    if (!name || !price || !sale_type || !category_id) {
      return errorResponse(res, 'Name, price, sale_type, and category_id are required', 400);
    }

    if (!SALE_TYPES.includes(sale_type)) {
      return errorResponse(res, 'sale_type must be "kg" or "piece"', 400);
    }

    if (Number.parseFloat(price) < 0) {
      return errorResponse(res, 'Price cannot be negative', 400);
    }

    if (stock_quantity !== undefined && Number.parseFloat(stock_quantity) < 0) {
      return errorResponse(res, 'stock_quantity cannot be negative', 400);
    }

    const image_url = req.file ? `/uploads/products/${req.file.filename}` : null;

    const product = await productsService.createProduct({
      name: name.trim(),
      description,
      price: Number.parseFloat(price),
      cost_price: cost_price ? Number.parseFloat(cost_price) : 0,
      sale_type,
      stock_quantity: stock_quantity ? Number.parseFloat(stock_quantity) : 0,
      category_id: Number.parseInt(category_id, 10),
      image_url
    });

    return createdResponse(res, product, 'Product created successfully');
  }
);

/**
 * Update product (admin only)
 * PUT /api/admin/products/:id
 */
const updateProduct = withController(
  {
    context: 'Update product',
    fallbackMessage: 'Failed to update product',
    mapError: (error) => {
      if (error.message === 'Product not found') {
        return { type: 'not_found', resource: 'Product' };
      }
      if (error.message === 'Category not found') {
        return { status: 404, message: error.message };
      }
      if (error.message === 'At least one field must be provided to update') {
        return { status: 400, message: error.message };
      }
      return null;
    }
  },
  async (req, res) => {
    const productId = parseId(req.params.id);
    const { name, description, price, cost_price, sale_type, category_id } = req.body;

    if (productId === null) {
      return errorResponse(res, 'Invalid product ID', 400);
    }

    if (sale_type && !SALE_TYPES.includes(sale_type)) {
      return errorResponse(res, 'sale_type must be "kg" or "piece"', 400);
    }

    if (price !== undefined && Number.parseFloat(price) < 0) {
      return errorResponse(res, 'Price cannot be negative', 400);
    }

    const image_url = req.file ? `/uploads/products/${req.file.filename}` : undefined;

    const product = await productsService.updateProduct(productId, {
      name: name ? name.trim() : undefined,
      description,
      price: price ? Number.parseFloat(price) : undefined,
      cost_price: cost_price !== undefined ? Number.parseFloat(cost_price) : undefined,
      sale_type,
      category_id: category_id ? Number.parseInt(category_id, 10) : undefined,
      image_url
    });

    return successResponse(res, product, 'Product updated successfully');
  }
);

/**
 * Delete product (soft delete, admin only)
 * DELETE /api/admin/products/:id
 */
const deleteProduct = withController(
  {
    context: 'Delete product',
    fallbackMessage: 'Failed to delete product',
    mapError: (error) => {
      if (error.message === 'Product not found or already deleted') {
        return { type: 'not_found', resource: 'Product' };
      }
      return null;
    }
  },
  async (req, res) => {
    const productId = parseId(req.params.id);

    if (productId === null) {
      return errorResponse(res, 'Invalid product ID', 400);
    }

    const product = await productsService.deleteProduct(productId);

    return successResponse(res, product, 'Product deleted successfully');
  }
);

/**
 * Adjust stock quantity (admin only)
 * POST /api/admin/products/:id/stock
 */
const adjustStock = withController(
  {
    context: 'Adjust stock',
    fallbackMessage: 'Failed to adjust stock',
    mapError: (error) => {
      if (error.message === 'Product not found') {
        return { type: 'not_found', resource: 'Product' };
      }
      if (error.message === 'Invalid reason. Must be admin_add or admin_remove') {
        return { status: 400, message: error.message };
      }
      if (error.message.startsWith('Insufficient stock')) {
        return { status: 400, message: error.message };
      }
      return null;
    }
  },
  async (req, res) => {
    const productId = parseId(req.params.id);
    const { quantity_change, reason } = req.body;

    if (productId === null) {
      return errorResponse(res, 'Invalid product ID', 400);
    }

    if (quantity_change === undefined || !reason) {
      return errorResponse(res, 'quantity_change and reason are required', 400);
    }

    if (Number.isNaN(Number.parseFloat(quantity_change))) {
      return errorResponse(res, 'quantity_change must be a number', 400);
    }

    if (Number.parseFloat(quantity_change) === 0) {
      return errorResponse(res, 'quantity_change cannot be zero', 400);
    }

    const result = await productsService.adjustStock(productId, {
      quantity_change: Number.parseFloat(quantity_change),
      reason
    });

    return successResponse(res, result, 'Stock adjusted successfully');
  }
);

/**
 * Get stock history (admin only)
 * GET /api/admin/products/:id/stock-history
 */
const getStockHistory = withController(
  {
    context: 'Get stock history',
    fallbackMessage: 'Failed to get stock history',
    mapError: (error) => {
      if (error.message === 'Product not found') {
        return { type: 'not_found', resource: 'Product' };
      }
      return null;
    }
  },
  async (req, res) => {
    const productId = parseId(req.params.id);
    const { page, limit } = req.query;

    if (productId === null) {
      return errorResponse(res, 'Invalid product ID', 400);
    }

    const result = await productsService.getStockHistory(productId, getPagination({ page, limit }));

    return successResponse(res, result, 'Stock history retrieved successfully');
  }
);

/**
 * Get all products for admin (including inactive)
 * GET /api/admin/products
 */
const getAllProductsAdmin = withController(
  {
    context: 'Get all products admin',
    fallbackMessage: 'Failed to get products'
  },
  async (req, res) => {
    const { search, category_id, sale_type, is_active, sort, order, page, limit } = req.query;

    const result = await productsService.getAllProductsAdmin({
      search,
      category_id,
      sale_type,
      is_active,
      sort,
      order,
      ...getPagination({ page, limit })
    });

    return successResponse(res, result, 'Products retrieved successfully');
  }
);

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getStockHistory,
  getAllProductsAdmin
};
