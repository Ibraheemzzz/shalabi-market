const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { successResponse, errorResponse, notFoundResponse, createdResponse, serverErrorResponse } = require('../../utils/response');
const logger = require('../../config/logger');

/**
 * Get all addresses for the logged-in user
 * GET /api/addresses
 */
const getUserAddresses = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const addresses = await prisma.address.findMany({
            where: { user_id },
            orderBy: [
                { is_default: 'desc' },
                { created_at: 'desc' }
            ]
        });
        return successResponse(res, addresses, 'Addresses retrieved successfully');
    } catch (error) {
        logger.error('Get user addresses error:', { error: error.message, stack: error.stack });
        return serverErrorResponse(res, 'Failed to get addresses');
    }
};

/**
 * Add a new address
 * POST /api/addresses
 */
const addAddress = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { first_name, last_name, phone_number, region, street, is_default } = req.body;

        // Use a transaction if this address is set as default, to unset others
        const result = await prisma.$transaction(async (tx) => {
            // If setting as default, unset existing default addresses for this user
            if (is_default) {
                await tx.address.updateMany({
                    where: { user_id, is_default: true },
                    data: { is_default: false }
                });
            }

            // If this is the user's first address, automatically make it default
            const addressCount = await tx.address.count({ where: { user_id } });
            const makeDefault = is_default || addressCount === 0;

            const newAddress = await tx.address.create({
                data: {
                    user_id,
                    first_name,
                    last_name: last_name || '',
                    phone_number,
                    city: 'طولكرم', // Explicitly setting, even though it's default in schema
                    region,
                    street,
                    is_default: makeDefault
                }
            });

            return newAddress;
        });

        return createdResponse(res, result, 'Address added successfully');
    } catch (error) {
        logger.error('Add address error:', { error: error.message, stack: error.stack });
        return serverErrorResponse(res, 'Failed to add address');
    }
};

/**
 * Update an existing address
 * PUT /api/addresses/:id
 */
const updateAddress = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const address_id = parseInt(req.params.id);
        const { first_name, last_name, phone_number, region, street, is_default } = req.body;

        // Check ownership
        const existing = await prisma.address.findUnique({ where: { address_id } });
        if (!existing || existing.user_id !== user_id) {
            return notFoundResponse(res, 'Address');
        }

        const result = await prisma.$transaction(async (tx) => {
            // If setting as default, unset others first
            if (is_default && !existing.is_default) {
                await tx.address.updateMany({
                    where: { user_id, is_default: true, address_id: { not: address_id } },
                    data: { is_default: false }
                });
            }

            // We don't allow unsetting default if there are no other defaults (handled gracefully)
            // For simplicity, just update the target address
            return await tx.address.update({
                where: { address_id },
                data: {
                    first_name,
                    last_name: last_name || '',
                    phone_number,
                    region,
                    street,
                    is_default: is_default !== undefined ? is_default : undefined
                }
            });
        });

        return successResponse(res, result, 'Address updated successfully');
    } catch (error) {
        logger.error('Update address error:', { error: error.message, stack: error.stack });
        return serverErrorResponse(res, 'Failed to update address');
    }
};

/**
 * Delete an address
 * DELETE /api/addresses/:id
 */
const deleteAddress = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const address_id = parseInt(req.params.id);

        // Check ownership
        const existing = await prisma.address.findUnique({ where: { address_id } });
        if (!existing || existing.user_id !== user_id) {
            return notFoundResponse(res, 'Address');
        }

        await prisma.$transaction(async (tx) => {
            await tx.address.delete({ where: { address_id } });

            // If we deleted the default address, and the user still has other addresses,
            // make the most recently created one the new default.
            if (existing.is_default) {
                const remainingAddress = await tx.address.findFirst({
                    where: { user_id },
                    orderBy: { created_at: 'desc' }
                });

                if (remainingAddress) {
                    await tx.address.update({
                        where: { address_id: remainingAddress.address_id },
                        data: { is_default: true }
                    });
                }
            }
        });

        return successResponse(res, null, 'Address deleted successfully');
    } catch (error) {
        logger.error('Delete address error:', { error: error.message, stack: error.stack });
        return serverErrorResponse(res, 'Failed to delete address');
    }
};

/**
 * Set an address as default
 * PUT /api/addresses/:id/default
 */
const setDefaultAddress = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const address_id = parseInt(req.params.id);

        // Check ownership
        const existing = await prisma.address.findUnique({ where: { address_id } });
        if (!existing || existing.user_id !== user_id) {
            return notFoundResponse(res, 'Address');
        }

        if (existing.is_default) {
            return successResponse(res, existing, 'Address is already the default');
        }

        const updated = await prisma.$transaction(async (tx) => {
            // Unset current default
            await tx.address.updateMany({
                where: { user_id, is_default: true },
                data: { is_default: false }
            });

            // Set new default
            return await tx.address.update({
                where: { address_id },
                data: { is_default: true }
            });
        });

        return successResponse(res, updated, 'Default address updated');
    } catch (error) {
        logger.error('Set default address error:', { error: error.message, stack: error.stack });
        return serverErrorResponse(res, 'Failed to set default address');
    }
};

module.exports = {
    getUserAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};
