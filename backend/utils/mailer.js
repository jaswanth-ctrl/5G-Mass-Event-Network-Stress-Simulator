require('dotenv').config();
const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const { logEvent } = require('./logger');

let resendClient = null;
let nodemailerTransporter = null;
let emailMode = 'none'; // 'resend', 'gmail', 'ethereal', 'none'

async function initMailer() {
  try {
    // Priority 1: Gmail SMTP (works without a custom domain and is easiest for personal email)
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    if (gmailPass && gmailPass !== 'YOUR_APP_PASSWORD_HERE') {
      nodemailerTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: gmailPass }
      });
      emailMode = 'gmail';
      logEvent('INFO', '✅ Gmail SMTP configured. Real emails will be delivered.');
      return;
    }

    // Priority 2: Resend API (works if you have a verified sender/domain)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && resendKey !== 'YOUR_RESEND_KEY_HERE') {
      resendClient = new Resend(resendKey);
      emailMode = 'resend';
      logEvent('INFO', '✅ Resend email API configured. Real emails will be delivered.');
      return;
    }

    // Priority 3: Ethereal test (fallback — viewable via URL only)
    const testAccount = await nodemailer.createTestAccount();
    nodemailerTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
    emailMode = 'ethereal';
    logEvent('WARN', '⚠️ No email API key set. Using Ethereal test email. Set RESEND_API_KEY in .env for real delivery.');
  } catch (err) {
    logEvent('WARN', 'Email init failed: ' + err.message);
    emailMode = 'none';
  }
}

function buildEmailHTML(venueData, metrics) {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:18px;letter-spacing:2px;">🚨 CRITICAL INCIDENT DISPATCH</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:12px;">5G Mass Event Network — NOC Automated Alert</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;">
        <h2 style="color:#dc2626;margin:0 0 8px;font-size:20px;">${venueData.incidentScenario?.title || 'Emergency'}</h2>
        <p style="color:#334155;font-size:14px;line-height:1.6;background:#f8fafc;padding:16px;border-left:4px solid #3b82f6;border-radius:4px;margin:16px 0;">
          ${venueData.incidentScenario?.description || 'No description.'}
        </p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;font-size:13px;">Venue</td><td style="padding:10px 0;color:#0f172a;font-weight:bold;font-size:13px;text-align:right;">${venueData.name}</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;font-size:13px;">Active UEs</td><td style="padding:10px 0;color:#0f172a;font-weight:bold;font-size:13px;text-align:right;">${(metrics?.crowdSize || 0).toLocaleString()}</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;font-size:13px;">Civilian Blocking</td><td style="padding:10px 0;color:#dc2626;font-weight:bold;font-size:13px;text-align:right;">${((metrics?.civilianBlocking || 0) * 100).toFixed(2)}%</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;font-size:13px;">Network Utilization</td><td style="padding:10px 0;color:#f59e0b;font-weight:bold;font-size:13px;text-align:right;">${(metrics?.utilization || 0).toFixed(1)}%</td></tr>
          <tr><td style="padding:10px 0;color:#64748b;font-size:13px;">Emergency Slice</td><td style="padding:10px 0;color:#10b981;font-weight:bold;font-size:13px;text-align:right;">ACTIVATED</td></tr>
        </table>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:16px;">
          <p style="color:#991b1b;font-size:13px;font-weight:bold;margin:0;">⚡ SDN Automated Response Active</p>
          <p style="color:#7f1d1d;font-size:12px;margin:6px 0 0;">eMBB degraded 30% → URLLC preempted → V2X A* pathfinding engaged</p>
        </div>
      </div>
      <div style="background:#f8fafc;padding:12px 24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;text-align:center;">
        <p style="color:#94a3b8;font-size:11px;margin:0;">5G Mass Event Network Simulator • Automated NOC Dispatch • ${new Date().toISOString()}</p>
      </div>
    </div>`;
}

async function sendIncidentAlertEmail(venueData, metrics) {
  const targetEmail = 'userverified8888@gmail.com';
  const subject = `🚨 [CRITICAL] ${venueData.incidentScenario?.title || 'Emergency Alert'}`;
  const html = buildEmailHTML(venueData, metrics);

  try {
    if (emailMode === 'resend' && resendClient) {
      const resendFrom = process.env.RESEND_FROM || 'onboarding@resend.dev';
      const { data, error } = await resendClient.emails.send({
        from: `5G NOC Alert <${resendFrom}>`,
        to: [targetEmail],
        subject,
        html
      });
      if (error) {
        logEvent('WARN', '❌ Resend error: ' + JSON.stringify(error));
        return null;
      }
      logEvent('INFO', `📧 Email delivered to ${targetEmail} via Resend (ID: ${data.id})`);
      return { type: 'resend', id: data.id };
    }
    
    if (emailMode === 'gmail' && nodemailerTransporter) {
      const info = await nodemailerTransporter.sendMail({
        from: `"5G NOC Alert" <${process.env.GMAIL_USER}>`,
        to: targetEmail, subject, html
      });
      logEvent('INFO', `📧 Email delivered to ${targetEmail} via Gmail (${info.messageId})`);
      return { type: 'gmail', messageId: info.messageId };
    }

    if (emailMode === 'ethereal' && nodemailerTransporter) {
      const info = await nodemailerTransporter.sendMail({
        from: '"5G NOC Alert" <noc@5g-simulator.local>',
        to: targetEmail, subject, html
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logEvent('INFO', `📧 Test email sent. View: ${previewUrl}`);
      return { type: 'ethereal', previewUrl };
    }

    logEvent('WARN', '⚠️ No email provider configured.');
    return null;
  } catch (error) {
    logEvent('WARN', '❌ Email failed: ' + error.message);
    return null;
  }
}

module.exports = { initMailer, sendIncidentAlertEmail };
