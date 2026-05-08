const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to your preferred service
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

const sendOrderNotification = async (orderData) => {
    try {
        const mailOptions = {
            from: `"PackageCatch Store" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            subject: '🚨 NEW ORDER PLACED!',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #111;">New Order Alert</h2>
                    <p>A customer has just placed a new order.</p>
                    <hr/>
                    <p><strong>Order ID:</strong> #${orderData.id}</p>
                    <p><strong>Total Amount:</strong> ₱${orderData.total_amount.toLocaleString()}</p>
                    <p><strong>Status:</strong> ${orderData.status}</p>
                    <p><strong>Time:</strong> ${new Date(orderData.created_at).toLocaleString()}</p>
                    <hr/>
                    <p>Log in to the Admin Dashboard to start packing!</p>
                    <a href="${process.env.FRONTEND_URL}/admin" style="display: inline-block; padding: 10px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">VIEW DASHBOARD</a>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Email notification failed:', error);
        return false;
    }
};

module.exports = { sendOrderNotification };
