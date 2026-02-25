const logger = require('../config/logger');

/**
 * Mock SMS Service
 * Simulates sending an SMS. In a real environment, this would integrate
 * with Twilio, MessageBird, or a local telecom provider.
 */
const sendOTP = async (phone_number, otp_code) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, you would call the real API here.
    // For now, we just log it aggressively so the developer can see it and test it.
    console.log('\n======================================================');
    console.log(`📱 MOCK SMS SENT TO: ${phone_number}`);
    console.log(`🔐 YOUR VERIFICATION CODE IS: ${otp_code}`);
    console.log('======================================================\n');

    logger.info(`[Mock SMS] OTP ${otp_code} sent to ${phone_number}`);

    return true;
};

module.exports = {
    sendOTP
};
