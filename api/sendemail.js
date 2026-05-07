const { sendMail } = require('../lib/mailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { name, email, message, phone, companyName, numberOfBottles, numberOfPumps, numberOfCaps, selectedProducts } = req.body;

    let htmlContent = `<h2>New Inquiry Received</h2>`;
    
    if (name) htmlContent += `<p><strong>Name:</strong> ${name}</p>`;
    if (email) htmlContent += `<p><strong>Email:</strong> ${email}</p>`;
    if (phone) htmlContent += `<p><strong>Phone:</strong> ${phone}</p>`;
    if (companyName) htmlContent += `<p><strong>Company:</strong> ${companyName}</p>`;
    if (numberOfBottles) htmlContent += `<p><strong>Bottles Needed:</strong> ${numberOfBottles}</p>`;
    if (numberOfPumps) htmlContent += `<p><strong>Pumps Needed:</strong> ${numberOfPumps}</p>`;
    if (numberOfCaps) htmlContent += `<p><strong>Caps Needed:</strong> ${numberOfCaps}</p>`;
    if (message) htmlContent += `<p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`;
    
    if (selectedProducts) {
      htmlContent += `<h3>Selected Customization Products:</h3><ul>`;
      if (selectedProducts.PerfumeBottles) htmlContent += `<li><strong>Bottle:</strong> ${selectedProducts.PerfumeBottles.name}</li>`;
      if (selectedProducts.Caps) htmlContent += `<li><strong>Cap:</strong> ${selectedProducts.Caps.name}</li>`;
      if (selectedProducts.Pumps) htmlContent += `<li><strong>Pump/Collar:</strong> ${selectedProducts.Pumps.name}</li>`;
      htmlContent += `</ul>`;
    }

    const subject = `New Website Inquiry from ${name || email || 'a visitor'}`;
    const success = await sendMail(subject, htmlContent);

    if (success) {
      res.status(200).json({ success: true, message: 'Email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  } catch (err) {
    console.error('Send mail error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
