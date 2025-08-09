import nodemailer from 'nodemailer'; 


export const sendVerificationEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const mailOptions = {
        from: '"Way Together" <no-reply@waytogether.com>',
        to: email,
        subject: "Verify your Email - Way Together",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Welcome to Way Together!</h2>
                <p>Use the following OTP to verify your email:</p>
                <h1 style="color: #4CAF50;">${otp}</h1>
                <p>This OTP will expire in 10 minutes.</p>
            </div>
        `,
        text: `Your OTP for verifying Way Together is: ${otp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
};