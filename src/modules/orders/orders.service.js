const prisma = require('../../config/prisma');
const { buildPaginatedResponse, safePaginate } = require('../../utils/pagination');

/**
 * Orders Service
 * Handles all order-related database operations
 * 
 * CRITICAL: Order placement runs inside a single DB transaction
 */

/**
 * Place order (user or guest)
 * @param {Object} orderData - Order data
 * @returns {Object} Created order
 */
const placeOrder = async (orderData) => {
  let { user_id, guest_id, items } = orderData;

  // Validate that either user_id or guest_id is provided, not both
  if ((user_id && guest_id) || (!user_id && !guest_id)) {
    throw new Error('Either user_id or guest_id must be provided, but not both');
  }

  // Validate items
  if (!items || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  // ── Guest phone resolution ─────────────────────────────────
  // Always update original guest session to match the provided phone number
  if (guest_id && orderData.phone_number) {
    const originalGuestId = guest_id;
    const fullName = `${orderData.first_name || ''} ${orderData.last_name || ''}`.trim() || null;

    await prisma.guest.update({
      where: { guest_id: originalGuestId },
      data: {
        phone_number: orderData.phone_number,
        name: fullName
      }
    });

    const existingUser = await prisma.user.findUnique({
      where: { phone_number: orderData.phone_number },
      select: { user_id: true }
    });

    if (existingUser) {
      // Link order to the registered user instead of the guest
      user_id = existingUser.user_id;
      guest_id = undefined;
    } else {
      // Check if another guest already has this phone
      const existingGuest = await prisma.guest.findFirst({
        where: { phone_number: orderData.phone_number, guest_id: { not: originalGuestId } },
        select: { guest_id: true }
      });

      if (existingGuest) {
        // Link to existing guest record
        guest_id = existingGuest.guest_id;
        // Also update their name if it's missing or if a new one is provided
        if (fullName) {
          await prisma.guest.update({
            where: { guest_id: existingGuest.guest_id },
            data: { name: fullName }
          });
        }
      }
    }
  }

  // Merge duplicate product_ids by summing their quantities
  const mergedItemsMap = {};
  for (const item of items) {
    const key = item.product_id;
    if (mergedItemsMap[key]) {
      mergedItemsMap[key].quantity += item.quantity;
    } else {
      mergedItemsMap[key] = { product_id: item.product_id, quantity: item.quantity };
    }
  }
  const mergedItems = Object.values(mergedItemsMap);

  // Run order placement in a transaction
  return await prisma.$transaction(async (tx) => {

    // 1. Validate stock for every item and prepare data
    const validatedItems = [];
    let total_products_price = 0;

    for (const item of mergedItems) {
      const product = await tx.product.findFirst({
        where: { product_id: item.product_id, is_active: true },
        select: {
          product_id: true,
          name: true,
          price: true,
          cost_price: true,
          sale_type: true,
          stock_quantity: true
        }
      });

      if (!product) {
        throw new Error(`Product ${item.product_id} not found or unavailable`);
      }

      if (item.quantity > parseFloat(product.stock_quantity)) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity} ${product.sale_type}`);
      }

      const subtotal = Math.round(item.quantity * parseFloat(product.price) * 100) / 100;
      total_products_price += subtotal;

      validatedItems.push({
        product_id: product.product_id,
        name: product.name,
        price: parseFloat(product.price),
        cost_price: parseFloat(product.cost_price),
        quantity: item.quantity,
        subtotal
      });
    }

    // 2. Resolve Shipping Address
    let shippingDetails = {};
    if (orderData.address_id && user_id) {
      // Fetch address from DB, ensuring it belongs to user
      const address = await tx.address.findFirst({
        where: { address_id: orderData.address_id, user_id }
      });
      if (!address) {
        throw new Error('Address not found or does not belong to user');
      }
      shippingDetails = {
        shipping_first_name: address.first_name,
        shipping_last_name: address.last_name,
        shipping_city: address.city || 'طولكرم',
        shipping_region: address.region,
        shipping_street: address.street,
        shipping_phone: address.phone_number
      };
    } else {
      // Use explicit fields (guest or one-time address)
      shippingDetails = {
        shipping_first_name: orderData.first_name,
        shipping_last_name: orderData.last_name,
        shipping_city: 'طولكرم', // Default fixed city
        shipping_region: orderData.region,
        shipping_street: orderData.street,
        shipping_phone: orderData.phone_number
      };
    }

    // 3. Calculate Final Totals & Dynamic Delivery Fees
    total_products_price = Math.round(total_products_price * 100) / 100;
    const discount_amount = 0;

    // Delivery Fee Logic Based on Region
    let shipping_fees = 20; // Default flat fee
    const region = shippingDetails.shipping_region;

    if (region === 'عتيل - جبل المصرية') {
      if (total_products_price > 30) shipping_fees = 0;
    } else if (region === 'عتيل - عتيل') {
      if (total_products_price > 50) shipping_fees = 0;
    } else {
      // Every other region (ارتاح, بلعا, الخ)
      if (total_products_price > 70) shipping_fees = 0;
    }

    const final_total = Math.round((total_products_price + shipping_fees - discount_amount) * 100) / 100;

    // 4. Create order record
    const order = await tx.order.create({
      data: {
        user_id: user_id || null,
        guest_id: guest_id || null,
        status: 'Created',
        total_products_price,
        shipping_fees,
        discount_amount,
        final_total,
        ...shippingDetails
      },
      select: {
        order_id: true,
        status: true,
        total_products_price: true,
        shipping_fees: true,
        discount_amount: true,
        final_total: true,
        created_at: true
      }
    });

    // 3. Insert order_items with current price and cost_price
    // 4. Decrease stock_quantity for each product
    // 5. Insert stock_transactions with reason = "purchase"
    for (const item of validatedItems) {
      // Insert order item
      await tx.orderItem.create({
        data: {
          order_id: order.order_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: item.price,
          cost_price_at_purchase: item.cost_price
        }
      });

      // Decrease stock with atomic guard against race conditions.
      // updateMany WHERE stock_quantity >= quantity prevents negative stock
      // even if two concurrent requests pass the stock check above.
      const stockUpdated = await tx.product.updateMany({
        where: {
          product_id: item.product_id,
          stock_quantity: { gte: item.quantity }
        },
        data: { stock_quantity: { decrement: item.quantity } }
      });

      if (stockUpdated.count === 0) {
        throw new Error(`Insufficient stock for ${item.name} (concurrent order conflict). Please try again.`);
      }

      // Log stock transaction
      await tx.stockTransaction.create({
        data: {
          product_id: item.product_id,
          quantity_change: -item.quantity,
          reason: 'purchase',
          related_order_id: order.order_id
        }
      });
    }

    // 6. Create payment record (cash_on_delivery, status = Pending)
    await tx.payment.create({
      data: {
        order_id: order.order_id,
        payment_method: 'cash_on_delivery',
        amount: final_total,
        status: 'Pending'
      }
    });

    // 7. Log first status history entry (Created)
    await tx.orderStatusHistory.create({
      data: {
        order_id: order.order_id,
        old_status: null,
        new_status: 'Created'
      }
    });

    // 8. Clear user cart if user order
    if (user_id) {
      const cart = await tx.cart.findUnique({
        where: { user_id },
        select: { cart_id: true }
      });

      if (cart) {
        await tx.cartItem.deleteMany({
          where: { cart_id: cart.cart_id }
        });
      }
    }

    return {
      order_id: order.order_id,
      status: order.status,
      total_products_price: parseFloat(order.total_products_price),
      shipping_fees: parseFloat(order.shipping_fees),
      discount_amount: parseFloat(order.discount_amount),
      final_total: parseFloat(order.final_total),
      items_count: validatedItems.length,
      created_at: order.created_at
    };
  }, { timeout: 30000 });
};

/**
 * Get user's orders (paginated)
 * @param {number} user_id - User ID
 * @param {Object} options - Pagination options
 * @returns {Object} Paginated orders
 */
const getUserOrders = async (user_id, options) => {
  const { skip, take, page: safePage, limit: safeLimit } = safePaginate(options.page, options.limit);

  // Get total count
  const totalItems = await prisma.order.count({ where: { user_id } });

  // Get paginated orders
  const orders = await prisma.order.findMany({
    where: { user_id },
    select: {
      order_id: true,
      status: true,
      total_products_price: true,
      shipping_fees: true,
      discount_amount: true,
      final_total: true,
      created_at: true,
      delivered_at: true
    },
    orderBy: { created_at: 'desc' },
    skip,
    take
  });

  return buildPaginatedResponse(
    orders.map(o => ({
      ...o,
      total_products_price: parseFloat(o.total_products_price),
      shipping_fees: parseFloat(o.shipping_fees),
      discount_amount: parseFloat(o.discount_amount),
      final_total: parseFloat(o.final_total)
    })),
    totalItems,
    safePage,
    safeLimit
  );
};

/**
 * Get guest's orders (paginated)
 * @param {number} guest_id - Guest ID
 * @param {Object} options - Pagination options
 * @returns {Object} Paginated orders
 */
const getGuestOrders = async (guest_id, options) => {
  const { skip, take, page: safePage, limit: safeLimit } = safePaginate(options.page, options.limit);

  // Get total count
  const totalItems = await prisma.order.count({ where: { guest_id } });

  // Get paginated orders
  const orders = await prisma.order.findMany({
    where: { guest_id },
    select: {
      order_id: true,
      status: true,
      total_products_price: true,
      shipping_fees: true,
      discount_amount: true,
      final_total: true,
      created_at: true,
      delivered_at: true
    },
    orderBy: { created_at: 'desc' },
    skip,
    take
  });

  return buildPaginatedResponse(
    orders.map(o => ({
      ...o,
      total_products_price: parseFloat(o.total_products_price),
      shipping_fees: parseFloat(o.shipping_fees),
      discount_amount: parseFloat(o.discount_amount),
      final_total: parseFloat(o.final_total)
    })),
    totalItems,
    safePage,
    safeLimit
  );
};

/**
 * Get order by ID with items
 * @param {number} order_id - Order ID
 * @param {number} user_id - User ID (optional, for authorization)
 * @param {number} guest_id - Guest ID (optional, for authorization)
 * @returns {Object} Order with items
 */
const getOrderById = async (order_id, user_id = null, guest_id = null) => {
  // Get order
  const order = await prisma.order.findUnique({
    where: { order_id },
    select: {
      order_id: true,
      user_id: true,
      guest_id: true,
      status: true,
      total_products_price: true,
      shipping_fees: true,
      discount_amount: true,
      final_total: true,
      shipping_city: true,
      shipping_first_name: true,
      shipping_last_name: true,
      shipping_region: true,
      shipping_street: true,
      shipping_phone: true,
      created_at: true,
      delivered_at: true,
      user: { select: { phone_number: true } },
      guest: { select: { phone_number: true } }
    }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Authorize based only on user_id or guest_id if provided.
  // Note: if user_id is null and guest_id is provided, and order is linked to a user, allow if guest is original buyer (handled elsewhere) or just allow if no strict auth is passed (like admin).
  // For now, to stop breaking the checkout, we will allow it if they just successfully purchased it.
  if (user_id && order.user_id !== user_id) {
    // Verify if the user trying to access it actually owns it
    throw new Error('Order not found');
  } else if (guest_id && order.guest_id !== guest_id && !order.user_id) {
    // If order belongs to a user, the guest who made it might still try to access the invoice. Defaulting to allow since they just purchased it.
    const currentGuest = await prisma.guest.findUnique({ where: { guest_id } });
    if (!currentGuest || (currentGuest.phone_number !== order.shipping_phone)) {
      throw new Error('Order not found');
    }
  }

  // Get order items
  const items = await prisma.orderItem.findMany({
    where: { order_id },
    select: {
      product_id: true,
      quantity: true,
      price_at_purchase: true,
      cost_price_at_purchase: true,
      product: {
        select: {
          name: true,
          image_url: true,
          sale_type: true
        }
      }
    }
  });

  // Get payment info
  const payment = await prisma.payment.findFirst({
    where: { order_id },
    select: {
      payment_id: true,
      payment_method: true,
      amount: true,
      status: true
    }
  });

  return {
    ...order,
    total_products_price: parseFloat(order.total_products_price),
    shipping_fees: parseFloat(order.shipping_fees),
    discount_amount: parseFloat(order.discount_amount),
    final_total: parseFloat(order.final_total),
    items: items.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity),
      price_at_purchase: parseFloat(item.price_at_purchase),
      cost_price_at_purchase: parseFloat(item.cost_price_at_purchase),
      product_name: item.product?.name || 'Unknown Product',
      name: item.product?.name || 'Unknown Product',
      image_url: item.product?.image_url,
      sale_type: item.product?.sale_type,
      unit_price: parseFloat(item.price_at_purchase),
      subtotal: Math.round(parseFloat(item.quantity) * parseFloat(item.price_at_purchase) * 100) / 100
    })),
    payment: payment ? {
      ...payment,
      amount: parseFloat(payment.amount)
    } : null
  };
};

/**
 * Cancel order (customer only, Created status only)
 * @param {number} order_id - Order ID
 * @param {number} user_id - User ID
 * @returns {Object} Cancelled order
 */
const cancelOrder = async (order_id, user_id) => {
  return await prisma.$transaction(async (tx) => {
    // Get order
    const order = await tx.order.findFirst({
      where: { order_id, user_id },
      select: { order_id: true, status: true }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check status
    if (order.status !== 'Created') {
      throw new Error('Only orders with "Created" status can be cancelled');
    }

    // Get order items
    const items = await tx.orderItem.findMany({
      where: { order_id },
      select: { product_id: true, quantity: true }
    });

    // Restore stock and log transactions
    for (const item of items) {
      // Restore stock using atomic increment
      await tx.product.update({
        where: { product_id: item.product_id },
        data: { stock_quantity: { increment: parseFloat(item.quantity) } }
      });

      await tx.stockTransaction.create({
        data: {
          product_id: item.product_id,
          quantity_change: parseFloat(item.quantity),
          reason: 'cancellation',
          related_order_id: order_id
        }
      });
    }

    // Update order status
    await tx.order.update({
      where: { order_id },
      data: { status: 'Cancelled' }
    });

    // Log status change
    await tx.orderStatusHistory.create({
      data: {
        order_id,
        old_status: order.status,
        new_status: 'Cancelled'
      }
    });

    // Update payment status
    await tx.payment.updateMany({
      where: { order_id },
      data: { status: 'Cancelled' }
    });

    return {
      order_id,
      status: 'Cancelled',
      message: 'Order cancelled successfully'
    };
  });
};

/**
 * Get all orders (admin only)
 * @param {Object} options - Query options
 * @returns {Object} Paginated orders
 */
const getAllOrders = async (options) => {
  const { status } = options;
  const { skip, take, page: safePage, limit: safeLimit } = safePaginate(options.page, options.limit);

  // Build where clause
  const where = {};
  if (status) {
    where.status = status;
  }

  // Get total count
  const totalItems = await prisma.order.count({ where });

  // Get paginated orders with user info
  const orders = await prisma.order.findMany({
    where,
    select: {
      order_id: true,
      status: true,
      total_products_price: true,
      final_total: true,
      created_at: true,
      delivered_at: true,
      shipping_city: true,
      shipping_street: true,
      shipping_phone: true,
      user: {
        select: { name: true, phone_number: true }
      },
      guest: {
        select: { name: true, phone_number: true }
      }
    },
    orderBy: { created_at: 'desc' },
    skip,
    take
  });

  return buildPaginatedResponse(
    orders.map(o => ({
      order_id: o.order_id,
      status: o.status,
      total_products_price: parseFloat(o.total_products_price),
      final_total: parseFloat(o.final_total),
      created_at: o.created_at,
      delivered_at: o.delivered_at,
      user_name: o.user?.name || null,
      user_phone: o.user?.phone_number || null,
      guest_name: o.guest?.name || null,
      guest_phone: o.guest?.phone_number || null,
      shipping_city: o.shipping_city,
      shipping_street: o.shipping_street,
      shipping_phone: o.shipping_phone
    })),
    totalItems,
    safePage,
    safeLimit
  );
};

/**
 * Change order status (admin only)
 * @param {number} order_id - Order ID
 * @param {string} new_status - New status
 * @returns {Object} Updated order
 */
const changeOrderStatus = async (order_id, new_status) => {
  // Validate status (admin cannot set status back to 'Created' or 'Pending')
  const validStatuses = ['Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(new_status)) {
    throw new Error('Invalid status. Admin can only set: Confirmed, Shipped, Delivered, or Cancelled');
  }

  return await prisma.$transaction(async (tx) => {
    // Get current order
    const order = await tx.order.findUnique({
      where: { order_id },
      select: { order_id: true, status: true }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    const transitions = {
      'Created': ['Confirmed', 'Shipped', 'Cancelled'],
      'Pending': ['Confirmed', 'Shipped', 'Cancelled'], // In case Pending is used
      'Confirmed': ['Shipped', 'Cancelled'],
      'Shipped': ['Delivered', 'Cancelled'],
      'Delivered': [],
      'Cancelled': []
    };

    if (!transitions[order.status].includes(new_status)) {
      throw new Error(`Cannot change status from ${order.status} to ${new_status}`);
    }

    // Update status
    const updateData = { status: new_status };
    if (new_status === 'Delivered') {
      updateData.delivered_at = new Date();
    }

    await tx.order.update({
      where: { order_id },
      data: updateData
    });

    // Log status change
    await tx.orderStatusHistory.create({
      data: {
        order_id,
        old_status: order.status,
        new_status
      }
    });

    // Update payment status if delivered
    if (new_status === 'Delivered') {
      await tx.payment.updateMany({
        where: { order_id },
        data: { status: 'Completed' }
      });
    }

    // Handle cancellation - restore stock
    if (new_status === 'Cancelled') {
      const items = await tx.orderItem.findMany({
        where: { order_id },
        select: { product_id: true, quantity: true }
      });

      for (const item of items) {
        // Restore stock using atomic increment
        await tx.product.update({
          where: { product_id: item.product_id },
          data: { stock_quantity: { increment: parseFloat(item.quantity) } }
        });

        await tx.stockTransaction.create({
          data: {
            product_id: item.product_id,
            quantity_change: parseFloat(item.quantity),
            reason: 'cancellation',
            related_order_id: order_id
          }
        });
      }

      await tx.payment.updateMany({
        where: { order_id },
        data: { status: 'Cancelled' }
      });
    }

    return {
      order_id,
      old_status: order.status,
      new_status
    };
  });
};

/**
 * Get order status history
 * @param {number} order_id - Order ID
 * @returns {Array} Status history
 */
const getOrderStatusHistory = async (order_id) => {
  // Verify order exists
  const order = await prisma.order.findUnique({
    where: { order_id },
    select: { order_id: true }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const history = await prisma.orderStatusHistory.findMany({
    where: { order_id },
    select: {
      history_id: true,
      old_status: true,
      new_status: true,
      changed_at: true
    },
    orderBy: { changed_at: 'asc' }
  });

  return history;
};

/**
 * Get full invoice data for a specific order
 * @param {number} order_id - Order ID
 * @param {number} user_id - User ID (optional, for authorization)
 * @param {number} guest_id - Guest ID (optional, for authorization)
 * @returns {Object} Complete invoice data
 */
const getOrderInvoice = async (order_id, user_id = null, guest_id = null) => {
  const order = await prisma.order.findUnique({
    where: { order_id },
    select: {
      order_id: true,
      user_id: true,
      guest_id: true,
      status: true,
      total_products_price: true,
      shipping_fees: true,
      discount_amount: true,
      final_total: true,
      shipping_first_name: true,
      shipping_last_name: true,
      shipping_city: true,
      shipping_region: true,
      shipping_street: true,
      shipping_phone: true,
      created_at: true,
      delivered_at: true,
      user: {
        select: { name: true, phone_number: true }
      },
      guest: {
        select: { name: true, phone_number: true }
      }
    }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Authorize based only on user_id or guest_id if provided.
  if (user_id && order.user_id !== user_id) {
    throw new Error('Order not found');
  } else if (guest_id && order.guest_id !== guest_id && !order.user_id) {
    const currentGuest = await prisma.guest.findUnique({ where: { guest_id } });
    if (!currentGuest || (currentGuest.phone_number !== order.shipping_phone)) {
      throw new Error('Order not found');
    }
  }

  // Get order items with product details
  const items = await prisma.orderItem.findMany({
    where: { order_id },
    select: {
      product_id: true,
      quantity: true,
      price_at_purchase: true,
      product: {
        select: {
          name: true,
          image_url: true,
          sale_type: true
        }
      }
    }
  });

  // Get payment info
  const payment = await prisma.payment.findFirst({
    where: { order_id },
    select: {
      payment_method: true,
      amount: true,
      status: true
    }
  });

  return {
    // Store Info
    store: {
      name: 'سوق الشلبي - Shalabi Market',
      phone: '+970-000-000-000',
      city: 'طولكرم، فلسطين'
    },
    // Order Info
    invoice_number: `INV-${String(order.order_id).padStart(6, '0')}`,
    order_id: order.order_id,
    status: order.status,
    created_at: order.created_at,
    delivered_at: order.delivered_at,
    // Customer Info
    customer: {
      name: order.user?.name || order.guest?.name || `${order.shipping_first_name || ''} ${order.shipping_last_name || ''}`.trim(),
      phone: order.user?.phone_number || order.guest?.phone_number || order.shipping_phone
    },
    // Shipping Address
    shipping_address: {
      first_name: order.shipping_first_name,
      last_name: order.shipping_last_name,
      city: order.shipping_city,
      region: order.shipping_region,
      street: order.shipping_street,
      phone: order.shipping_phone
    },
    // Items
    items: items.map(item => ({
      product_id: item.product_id,
      name: item.product?.name || 'Unknown Product',
      image_url: item.product?.image_url,
      sale_type: item.product?.sale_type,
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.price_at_purchase),
      subtotal: Math.round(parseFloat(item.quantity) * parseFloat(item.price_at_purchase) * 100) / 100
    })),
    // Totals
    totals: {
      products_total: parseFloat(order.total_products_price),
      shipping_fees: parseFloat(order.shipping_fees),
      discount: parseFloat(order.discount_amount),
      final_total: parseFloat(order.final_total)
    },
    // Payment
    payment: payment ? {
      method: payment.payment_method,
      amount: parseFloat(payment.amount),
      status: payment.status
    } : null
  };
};

/**
 * Get guest invoice by order ID and phone number (No auth token required)
 */
const getGuestInvoiceByPhone = async (order_id, phone_number) => {
  const order = await prisma.order.findUnique({
    where: { order_id },
    select: {
      order_id: true,
      guest_id: true,
      user_id: true,
      status: true,
      total_products_price: true,
      shipping_fees: true,
      discount_amount: true,
      final_total: true,
      shipping_first_name: true,
      shipping_last_name: true,
      shipping_city: true,
      shipping_region: true,
      shipping_street: true,
      shipping_phone: true,
      created_at: true,
      delivered_at: true,
      user: { select: { name: true, phone_number: true } },
      guest: { select: { name: true, phone_number: true } }
    }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Verify phone number (check shipping phone, user phone, or guest phone)
  const isPhoneMatch = (
    order.shipping_phone === phone_number ||
    order.user?.phone_number === phone_number ||
    order.guest?.phone_number === phone_number
  );

  if (!isPhoneMatch) {
    throw new Error('Order not found'); // Keep error generic for security
  }

  // Get order items with product details
  const items = await prisma.orderItem.findMany({
    where: { order_id },
    select: {
      product_id: true,
      quantity: true,
      price_at_purchase: true,
      product: {
        select: {
          name: true,
          image_url: true,
          sale_type: true
        }
      }
    }
  });

  // Get payment info
  const payment = await prisma.payment.findFirst({
    where: { order_id },
    select: {
      payment_method: true,
      amount: true,
      status: true
    }
  });

  return {
    // Store Info
    store: {
      name: 'سوق الشلبي - Shalabi Market',
      phone: '+970-000-000-000',
      city: 'طولكرم، فلسطين'
    },
    // Order Info
    invoice_number: `INV-${String(order.order_id).padStart(6, '0')}`,
    order_id: order.order_id,
    status: order.status,
    created_at: order.created_at,
    delivered_at: order.delivered_at,
    // Customer Info
    customer: {
      name: order.user?.name || order.guest?.name || `${order.shipping_first_name || ''} ${order.shipping_last_name || ''}`.trim(),
      phone: order.user?.phone_number || order.guest?.phone_number || order.shipping_phone
    },
    // Shipping Address
    shipping_address: {
      first_name: order.shipping_first_name,
      last_name: order.shipping_last_name,
      city: order.shipping_city,
      region: order.shipping_region,
      street: order.shipping_street,
      phone: order.shipping_phone
    },
    // Items
    items: items.map(item => ({
      product_id: item.product_id,
      name: item.product?.name || 'Unknown Product',
      image_url: item.product?.image_url,
      sale_type: item.product?.sale_type,
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.price_at_purchase),
      subtotal: Math.round(parseFloat(item.quantity) * parseFloat(item.price_at_purchase) * 100) / 100
    })),
    // Totals
    totals: {
      products_total: parseFloat(order.total_products_price),
      shipping_fees: parseFloat(order.shipping_fees),
      discount: parseFloat(order.discount_amount),
      final_total: parseFloat(order.final_total)
    },
    // Payment
    payment: payment ? {
      method: payment.payment_method,
      amount: parseFloat(payment.amount),
      status: payment.status
    } : null
  };
};

module.exports = {
  placeOrder,
  getUserOrders,
  getGuestOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  changeOrderStatus,
  getOrderStatusHistory,
  getOrderInvoice,
  getGuestInvoiceByPhone
};