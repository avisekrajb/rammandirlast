const crypto = require('crypto');
const Donation = require('../models/Donation');
const AdminSettings = require('../models/AdminSettings');
const User = require('../models/User');
const { sendDonationConfirmation } = require('../services/emailService');

const ESEWA_TEST_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_LIVE_URL = 'https://epay.esewa.com.np/api/epay/main/v2/form';
const KHALTI_TEST_URL = 'https://dev.khalti.com/api/v2';
const KHALTI_LIVE_URL = 'https://khalti.com/api/v2';
const IPS_TEST_URL = 'https://uat.connectips.com/connectipswebgw/loginpage';
const IPS_LIVE_URL = 'https://connectipswebgw.connectips.com/connectipswebgw/loginpage';
const IPS_VALIDATE_TEST_URL = 'https://uat.connectips.com';
const IPS_VALIDATE_LIVE_URL = 'https://connectipswebws.connectips.com';

const isPaymentLive = (mode) => mode === 'live';

const generateTransactionUuid = (prefix = 'TXN') =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

const fetchJson = async (url, options) => {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch (error) {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(json.message || json.detail || json.statusDesc || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
};

const completeDonation = async (donation, transactionId) => {
  donation.status = 'completed';
  if (transactionId) donation.transactionId = transactionId;
  await donation.save();

  try {
    const settings = await AdminSettings.getSettings();
    if (settings.donate) {
      settings.donate.baseCount = (settings.donate.baseCount || 0) + 1;
      await settings.save();
    }
  } catch (error) {
    console.error('Update settings count error:', error);
  }

  try {
    const user = await User.findById(donation.userId);
    if (user) {
      await sendDonationConfirmation(donation, user);
    }
  } catch (error) {
    console.error('Email error:', error);
  }
};

exports.initiateEsewaPayment = async (req, res) => {
  try {
    const { amount, name, email, phone } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const merchantId = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
    const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
    const testMode = !isPaymentLive(process.env.ESEWA_MODE);
    const successUrl = process.env.ESEWA_SUCCESS_URL || 'http://localhost:4000/donate/success';
    const failureUrl = process.env.ESEWA_FAILURE_URL || 'http://localhost:4000/donate/failure';
    const formUrl = testMode
      ? (process.env.ESEWA_TEST_URL || ESEWA_TEST_URL)
      : (process.env.ESEWA_LIVE_URL || ESEWA_LIVE_URL);

    const transactionUuid = generateTransactionUuid('TXN');

    const donation = await Donation.create({
      userId: req.user.id,
      name: name || req.user.name,
      email: email || req.user.email,
      phone: phone || req.user.phone,
      amount: Number(amount),
      transactionId: transactionUuid,
      status: 'pending',
      paymentMethod: 'esewa',
    });

    const formData = {
      amount: amount.toString(),
      transaction_uuid: transactionUuid,
      product_code: merchantId,
      product_service_charge: '0',
      product_delivery_charge: '0',
      tax_amount: '0',
      total_amount: amount.toString(),
      success_url: successUrl,
      failure_url: failureUrl,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
    };

    const signatureString = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${merchantId}`;
    formData.signature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureString)
      .digest('base64');

    res.json({
      success: true,
      data: formData,
      url: formUrl,
      donationId: donation._id,
    });
  } catch (error) {
    console.error('Initiate eSewa payment error:', error);
    res.status(500).json({ message: 'Payment initiation failed: ' + error.message });
  }
};

exports.verifyEsewaPayment = async (req, res) => {
  try {
    const { transaction_uuid, product_code, total_amount, status, donationId, data } = req.body;

    let fields = { transaction_uuid, product_code, total_amount, status };

    if (data) {
      try {
        const normalized = String(data).replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
        fields = { ...fields, ...decoded };
      } catch (error) {
        return res.status(400).json({ message: 'Invalid eSewa response data' });
      }
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (fields.signature && fields.signed_field_names) {
      const names = String(fields.signed_field_names).split(',').filter(Boolean);
      const text = names.map((n) => `${n}=${fields[n] ?? ''}`).join(',');
      const expected = crypto
        .createHmac('sha256', process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q')
        .update(text)
        .digest('base64');
      if (expected !== fields.signature) {
        donation.status = 'failed';
        await donation.save();
        return res.status(400).json({ success: false, message: 'Invalid eSewa signature' });
      }
    }

    const isSuccess = ['success', 'COMPLETE', 'completed'].includes(String(fields.status || ''));

    if (isSuccess) {
      await completeDonation(donation, fields.transaction_uuid || donation.transactionId);
      return res.json({
        success: true,
        message: 'Payment verified successfully',
        donationId,
      });
    }

    donation.status = 'failed';
    await donation.save();
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed',
    });
  } catch (error) {
    console.error('Verify eSewa payment error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

exports.initiateKhaltiPayment = async (req, res) => {
  try {
    const { amount, name, email, phone } = req.body;

    if (!amount || Number(amount) < 1) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const secretKey = process.env.KHALTI_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ message: 'Khalti secret key is not configured in .env' });
    }

    const testMode = !isPaymentLive(process.env.KHALTI_MODE);
    const baseUrl = testMode
      ? (process.env.KHALTI_TEST_URL || KHALTI_TEST_URL)
      : (process.env.KHALTI_LIVE_URL || KHALTI_LIVE_URL);
    const returnUrl = process.env.KHALTI_RETURN_URL || 'http://localhost:4000/donate/success';
    const websiteUrl = process.env.KHALTI_WEBSITE_URL || 'http://localhost:4000';

    const purchaseOrderId = generateTransactionUuid('KHALTI');
    const amountPaisa = Math.round(Number(amount) * 100);

    const donation = await Donation.create({
      userId: req.user.id,
      name: name || req.user.name,
      email: email || req.user.email,
      phone: phone || req.user.phone,
      amount: Number(amount),
      transactionId: purchaseOrderId,
      status: 'pending',
      paymentMethod: 'khalti',
    });

    const payload = {
      return_url: returnUrl,
      website_url: websiteUrl,
      amount: amountPaisa,
      purchase_order_id: purchaseOrderId,
      purchase_order_name: `Donation to Shree Ramchandra Temple - NPR ${Number(amount).toFixed(2)}`,
      customer_info: {
        name: name || req.user.name || 'Anonymous',
        email: email || req.user.email || '',
        phone: phone || req.user.phone || '',
      },
    };

    const json = await fetchJson(`${baseUrl}/epayment/initiate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${secretKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!json.pidx || !json.payment_url) {
      throw new Error('Khalti did not return a payment url');
    }

    res.json({
      success: true,
      data: {
        pidx: json.pidx,
        paymentUrl: json.payment_url,
      },
      donationId: donation._id,
    });
  } catch (error) {
    console.error('Initiate Khalti payment error:', error);
    if (error.data && error.data.detail) {
      return res.status(500).json({ message: 'Khalti error: ' + error.data.detail });
    }
    res.status(500).json({ message: 'Payment initiation failed: ' + error.message });
  }
};

exports.verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx, donationId } = req.body;

    if (!pidx) {
      return res.status(400).json({ message: 'pidx is required' });
    }

    const secretKey = process.env.KHALTI_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ message: 'Khalti secret key is not configured in .env' });
    }

    const testMode = !isPaymentLive(process.env.KHALTI_MODE);
    const baseUrl = testMode
      ? (process.env.KHALTI_TEST_URL || KHALTI_TEST_URL)
      : (process.env.KHALTI_LIVE_URL || KHALTI_LIVE_URL);

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    const json = await fetchJson(`${baseUrl}/epayment/lookup/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${secretKey}`,
      },
      body: JSON.stringify({ pidx }),
    });

    if (String(json.status || '').toLowerCase() === 'completed') {
      await completeDonation(donation, json.transaction_id || donation.transactionId);
      return res.json({
        success: true,
        message: 'Payment verified successfully',
        donationId,
      });
    }

    donation.status = 'failed';
    await donation.save();
    return res.status(400).json({
      success: false,
      message: `Payment is not completed (status: ${json.status || 'unknown'})`,
    });
  } catch (error) {
    console.error('Verify Khalti payment error:', error);
    res.status(500).json({ message: 'Payment verification failed: ' + error.message });
  }
};

const signWithIpsKey = (message) => {
  const raw = (process.env.IPS_PRIVATE_KEY || '').trim();
  if (!raw) {
    throw new Error('IPS_PRIVATE_KEY is not configured in .env');
  }

  const candidates = [];
  if (raw.includes('-----BEGIN')) {
    candidates.push(raw);
  } else {
    const base64 = raw.replace(/\\n/g, '\n').replace(/\s+/g, '');
    candidates.push(`-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----`);
    candidates.push(`-----BEGIN RSA PRIVATE KEY-----\n${base64}\n-----END RSA PRIVATE KEY-----`);
  }

  let lastError = null;
  for (const pem of candidates) {
    try {
      return crypto.sign('sha256', Buffer.from(message, 'utf8'), pem).toString('base64');
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error('IPS_PRIVATE_KEY could not be used to sign the token: ' + (lastError ? lastError.message : 'no key provided'));
};

exports.initiateIpsPayment = async (req, res) => {
  try {
    const { amount, name, email, phone } = req.body;

    if (!amount || Number(amount) < 1) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const merchantId = process.env.IPS_MERCHANT_ID;
    const appId = process.env.IPS_APP_ID;
    if (!merchantId || !appId) {
      return res.status(500).json({ message: 'IPS credentials are not configured in .env' });
    }

    const testMode = !isPaymentLive(process.env.IPS_MODE);
    const loginUrl = testMode
      ? (process.env.IPS_TEST_URL || IPS_TEST_URL)
      : (process.env.IPS_LIVE_URL || IPS_LIVE_URL);

    const txnId = generateTransactionUuid('IPS').replace(/[^A-Z0-9]/g, '').slice(0, 20);
    const now = new Date();
    const txnDate = [
      String(now.getDate()).padStart(2, '0'),
      String(now.getMonth() + 1).padStart(2, '0'),
      now.getFullYear(),
    ].join('-');
    const amountPaisa = Math.round(Number(amount) * 100);
    const remarks = `Donation NPR ${Number(amount).toFixed(2)}`;

    const fields = {
      MERCHANTID: merchantId,
      APPID: appId,
      APPNAME: process.env.IPS_APP_NAME || 'Shree Ramchandra Temple',
      TXNID: txnId,
      TXNDATE: txnDate,
      TXNCRNCY: 'NPR',
      TXNAMT: String(amountPaisa),
      REFERENCEID: txnId,
      REMARKS: remarks,
      PARTICULARS: remarks,
    };

    const message =
      `MERCHANTID=${fields.MERCHANTID},APPID=${fields.APPID},APPNAME=${fields.APPNAME},` +
      `TXNID=${fields.TXNID},TXNDATE=${fields.TXNDATE},TXNCRNCY=${fields.TXNCRNCY},` +
      `TXNAMT=${fields.TXNAMT},REFERENCEID=${fields.REFERENCEID},` +
      `REMARKS=${fields.REMARKS},PARTICULARS=${fields.PARTICULARS},TOKEN=TOKEN`;

    let token;
    try {
      token = signWithIpsKey(message);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }

    const donation = await Donation.create({
      userId: req.user.id,
      name: name || req.user.name,
      email: email || req.user.email,
      phone: phone || req.user.phone,
      amount: Number(amount),
      transactionId: txnId,
      status: 'pending',
      paymentMethod: 'ips',
    });

    res.json({
      success: true,
      data: { ...fields, TOKEN: token },
      url: loginUrl,
      donationId: donation._id,
    });
  } catch (error) {
    console.error('Initiate IPS payment error:', error);
    res.status(500).json({ message: 'Payment initiation failed: ' + error.message });
  }
};

exports.verifyIpsPayment = async (req, res) => {
  try {
    const { donationId } = req.body;

    const merchantId = process.env.IPS_MERCHANT_ID;
    const appId = process.env.IPS_APP_ID;
    const password = process.env.IPS_PASSWORD;
    if (!merchantId || !appId || !password) {
      return res.status(500).json({ message: 'IPS credentials are not configured in .env' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    const testMode = !isPaymentLive(process.env.IPS_MODE);
    const baseUrl = testMode
      ? (process.env.IPS_VALIDATE_TEST_URL || IPS_VALIDATE_TEST_URL)
      : (process.env.IPS_VALIDATE_LIVE_URL || IPS_VALIDATE_LIVE_URL);

    const referenceId = donation.transactionId;
    const txnAmt = Math.round(Number(donation.amount) * 100);
    const message = `MERCHANTID=${merchantId},APPID=${appId},REFERENCEID=${referenceId},TXNAMT=${txnAmt}`;

    let token;
    try {
      token = signWithIpsKey(message);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }

    const json = await fetchJson(`${baseUrl}/connectipswebws/api/creditor/validatetxn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${appId}:${password}`).toString('base64'),
      },
      body: JSON.stringify({
        merchantId,
        appId,
        referenceId,
        txnAmt,
        token,
      }),
    });

    if (String(json.status || '').toUpperCase() === 'SUCCESS') {
      await completeDonation(donation, referenceId);
      return res.json({
        success: true,
        message: 'Payment verified successfully',
        donationId,
      });
    }

    donation.status = 'failed';
    await donation.save();
    return res.status(400).json({
      success: false,
      message: `Payment could not be validated (${json.statusDesc || json.status || 'unknown'})`,
    });
  } catch (error) {
    console.error('Verify IPS payment error:', error);
    res.status(500).json({ message: 'Payment verification failed: ' + error.message });
  }
};

exports.getDonationStatus = async (req, res) => {
  try {
    const { donationId } = req.params;
    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    res.json({
      success: true,
      data: donation,
    });
  } catch (error) {
    console.error('Get donation status error:', error);
    res.status(500).json({ message: 'Failed to get donation status' });
  }
};