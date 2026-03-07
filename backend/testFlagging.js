/**
 * ============================================================
 *  ReliefLedger — Transaction Flagging Verification Script
 * ============================================================
 *
 *  Usage:   node testFlagging.js
 *
 *  This script runs through 6 tests end-to-end:
 *    1. Register & login a donor, recipient, and admin
 *    2. Donor makes a donation
 *    3. Admin approves a recipient application & disburses funds
 *    4. Admin flags the completed disbursement transaction
 *       → verifies reversal, user freeze, ON_HOLD, audit logs
 *    5. Frozen donor tries to donate → expects 403
 *    6. Frozen recipient tries to apply → expects 403
 *
 *  The script cleans up test users at the end.
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE = 'http://localhost:5000/api';
const DIVIDER = '═'.repeat(60);
const SUB_DIVIDER = '─'.repeat(40);

// Unique emails so reruns don't clash
const TS = Date.now();
const DONOR_EMAIL = `testdonor_${TS}@test.com`;
const RECIPIENT_EMAIL = `testrecipient_${TS}@test.com`;
const ADMIN_EMAIL = `testadmin_${TS}@test.com`;
const PASSWORD = 'Test@12345';

let donorToken, recipientToken, adminToken;
let donorId, recipientId, adminId;
let donationTransactionId, disbursementTransactionId;
let applicationId;

// ─── Helper ────────────────────────────────────────────────
function log(icon, msg) {
    console.log(`  ${icon}  ${msg}`);
}

function header(title) {
    console.log(`\n${DIVIDER}`);
    console.log(`  ${title}`);
    console.log(DIVIDER);
}

function subheader(title) {
    console.log(`\n  ${SUB_DIVIDER}`);
    console.log(`  ${title}`);
    console.log(`  ${SUB_DIVIDER}`);
}

async function api(method, url, data = null, token = null) {
    const headers = {};
    if (token) headers['x-auth-token'] = token;
    try {
        const res = await axios({ method, url: `${BASE}${url}`, data, headers });
        return { status: res.status, data: res.data };
    } catch (err) {
        return {
            status: err.response?.status || 500,
            data: err.response?.data || { msg: err.message }
        };
    }
}

// ─── Tests ─────────────────────────────────────────────────

async function test1_RegisterAndLogin() {
    header('TEST 1: Register & Login Users');

    // Register
    let res = await api('post', '/auth/register', { name: 'Test Donor', email: DONOR_EMAIL, password: PASSWORD, role: 'DONOR' });
    log(res.status === 200 ? '✅' : '❌', `Register Donor: ${res.status} — ${res.data.msg}`);

    res = await api('post', '/auth/register', { name: 'Test Recipient', email: RECIPIENT_EMAIL, password: PASSWORD, role: 'RECIPIENT' });
    log(res.status === 200 ? '✅' : '❌', `Register Recipient: ${res.status} — ${res.data.msg}`);

    res = await api('post', '/auth/register', { name: 'Test Admin', email: ADMIN_EMAIL, password: PASSWORD, role: 'ADMIN' });
    log(res.status === 200 ? '✅' : '❌', `Register Admin: ${res.status} — ${res.data.msg}`);

    // Login
    res = await api('post', '/auth/login', { email: DONOR_EMAIL, password: PASSWORD });
    donorToken = res.data.token;
    log(donorToken ? '✅' : '❌', `Login Donor: got token=${!!donorToken}`);

    res = await api('post', '/auth/login', { email: RECIPIENT_EMAIL, password: PASSWORD });
    recipientToken = res.data.token;
    log(recipientToken ? '✅' : '❌', `Login Recipient: got token=${!!recipientToken}`);

    res = await api('post', '/auth/login', { email: ADMIN_EMAIL, password: PASSWORD });
    adminToken = res.data.token;
    log(adminToken ? '✅' : '❌', `Login Admin: got token=${!!adminToken}`);

    // Decode tokens to get user IDs
    const jwt = require('jsonwebtoken');
    donorId = jwt.decode(donorToken).userId;
    recipientId = jwt.decode(recipientToken).userId;
    adminId = jwt.decode(adminToken).userId;
    log('ℹ️', `Donor ID: ${donorId}`);
    log('ℹ️', `Recipient ID: ${recipientId}`);
    log('ℹ️', `Admin ID: ${adminId}`);
}

async function test2_DonorDonates() {
    header('TEST 2: Donor Makes a Donation ($500)');

    const res = await api('post', '/donor/donate', { amount: 500, message: 'Test donation' }, donorToken);
    log(res.status === 200 ? '✅' : '❌', `Donate: ${res.status} — ${res.data.msg}`);
    if (res.data.donation) {
        log('ℹ️', `Donation ID: ${res.data.donation.id}, Receipt: ${res.data.donation.receipt_id}`);
    }

    // Find the donation transaction in the ledger
    const ledger = await api('get', '/admin/ledger?limit=5', null, adminToken);
    const donationTx = ledger.data.transactions?.find(t => t.type === 'DONATION' && t.amount === 500);
    if (donationTx) {
        donationTransactionId = donationTx.id;
        log('✅', `Found donation transaction: ${donationTx.transaction_id}`);
    } else {
        log('❌', 'Could not find donation transaction in ledger');
    }
}

async function test3_ApproveAndDisburse() {
    header('TEST 3: Recipient Applies → Admin Approves → Admin Disburses ($200)');

    // Recipient submits application
    subheader('3a. Recipient submits application');
    let res = await api('post', '/recipient/apply', { amount_requested: 200, reason: 'Emergency medical expenses for the test' }, recipientToken);
    log(res.status === 200 ? '✅' : '❌', `Apply: ${res.status} — ${res.data.msg}`);
    applicationId = res.data.application?.id;
    log('ℹ️', `Application ID: ${applicationId}`);

    // Admin approves
    subheader('3b. Admin approves the application');
    res = await api('put', `/admin/application/${applicationId}/review`, { approved: true, verification_notes: 'Looks good' }, adminToken);
    log(res.status === 200 ? '✅' : '❌', `Approve: ${res.status} — ${res.data.msg}`);

    // Admin disburses
    subheader('3c. Admin disburses $200');
    res = await api('put', `/admin/application/${applicationId}/disburse`, { amount_to_disburse: 200 }, adminToken);
    log(res.status === 200 ? '✅' : '❌', `Disburse: ${res.status} — ${res.data.msg}`);
    if (res.data.transaction) {
        disbursementTransactionId = res.data.transaction.id;
        log('✅', `Disbursement Transaction ID: ${disbursementTransactionId}`);
    }

    // Check recipient wallet
    subheader('3d. Verify recipient wallet');
    res = await api('get', '/recipient/wallet', null, recipientToken);
    log('ℹ️', `Wallet balance: $${res.data.balance} (expected $200)`);
    log(res.data.balance === 200 ? '✅' : '⚠️', `Wallet balance correct: ${res.data.balance === 200}`);
}

async function test4_FlagCompletedTransaction() {
    header('TEST 4: Flag the COMPLETED Disbursement Transaction');

    if (!disbursementTransactionId) {
        log('❌', 'No disbursement transaction ID — skipping');
        return;
    }

    subheader('4a. Flag the transaction');
    const res = await api('put', `/admin/transaction/${disbursementTransactionId}/flag`, { reason: 'Suspicious disbursement activity detected' }, adminToken);
    log(res.status === 200 ? '✅' : '❌', `Flag: ${res.status} — ${res.data.msg}`);

    if (res.data.transaction) {
        log('ℹ️', `Status: ${res.data.transaction.status}`);
        log('ℹ️', `Flagged: ${res.data.transaction.flagged}`);
        log('ℹ️', `FlaggedAt: ${res.data.transaction.flaggedAt}`);
        log('ℹ️', `FlaggedBy: ${res.data.transaction.flaggedBy}`);
        log('ℹ️', `FlagReason: ${res.data.transaction.flagReason}`);
    }

    subheader('4b. Verify reversal details');
    if (res.data.reversal) {
        log('✅', `Reversed: ${res.data.reversal.reversed}`);
        log('ℹ️', `Reversal TX ID: ${res.data.reversal.reversal_transaction_id}`);
        log('ℹ️', `Amount reversed: $${res.data.reversal.amount}`);
        log('ℹ️', `Wallet discrepancy: ${res.data.reversal.walletDiscrepancy}`);
    } else {
        log('❌', 'No reversal details in response');
    }

    subheader('4c. Verify frozen users');
    log('ℹ️', `Frozen user IDs: ${JSON.stringify(res.data.frozenUsers)}`);
    log('ℹ️', `Applications put ON_HOLD: ${res.data.applicationsOnHold}`);

    subheader('4d. Verify recipient wallet after reversal');
    const wallet = await api('get', '/recipient/wallet', null, recipientToken);
    log('ℹ️', `Wallet balance after reversal: $${wallet.data.balance} (expected $0)`);
    log(wallet.data.balance === 0 ? '✅' : '⚠️', `Wallet correctly zeroed: ${wallet.data.balance === 0}`);

    subheader('4e. Verify reversal transaction in ledger');
    const ledger = await api('get', '/admin/ledger?limit=10', null, adminToken);
    const reversalTx = ledger.data.transactions?.find(t => t.type === 'REVERSAL');
    if (reversalTx) {
        log('✅', `Reversal TX found: ${reversalTx.transaction_id}, amount=$${reversalTx.amount}, status=${reversalTx.status}`);
    } else {
        log('❌', 'No REVERSAL transaction found in ledger');
    }

    subheader('4f. Verify audit logs in DB');
    // Connect directly to check audit logs
    const AuditLog = require('./models/AuditLog');
    const flagLogs = await AuditLog.find({ targetId: disbursementTransactionId }).sort({ timestamp: -1 });
    log('ℹ️', `Audit log entries for this transaction: ${flagLogs.length}`);
    flagLogs.forEach(l => {
        log('📋', `${l.action} | by: ${l.performedBy} | reason: ${l.reason?.substring(0, 60)}...`);
    });

    const allLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(10);
    log('ℹ️', `Total recent audit log entries: ${allLogs.length}`);
    allLogs.forEach(l => {
        log('📋', `${l.action} | target: ${l.targetId} | amount: $${l.amount || '-'}`);
    });
}

async function test5_FrozenDonorBlocked() {
    header('TEST 5: Frozen Donor Tries to Donate → Expect 403');

    const res = await api('post', '/donor/donate', { amount: 100, message: 'Should be blocked' }, donorToken);
    log(res.status === 403 ? '✅' : '❌', `Donate while frozen: ${res.status} — ${res.data.msg}`);
    log('ℹ️', `Expected 403, Got ${res.status}`);
}

async function test6_FrozenRecipientBlocked() {
    header('TEST 6: Frozen Recipient Tries to Apply → Expect 403');

    const res = await api('post', '/recipient/apply', { amount_requested: 100, reason: 'This should be blocked by frozen check' }, recipientToken);
    log(res.status === 403 ? '✅' : '❌', `Apply while frozen: ${res.status} — ${res.data.msg}`);
    log('ℹ️', `Expected 403, Got ${res.status}`);
}

async function test7_AlreadyFlaggedBlocked() {
    header('TEST 7: Try to Flag an Already-Flagged Transaction → Expect 400');

    if (!disbursementTransactionId) {
        log('❌', 'No transaction to re-flag — skipping');
        return;
    }

    const res = await api('put', `/admin/transaction/${disbursementTransactionId}/flag`, { reason: 'Double flag attempt' }, adminToken);
    log(res.status === 400 ? '✅' : '❌', `Double flag: ${res.status} — ${res.data.msg}`);
    log('ℹ️', `Expected 400, Got ${res.status}`);
}

// ─── Cleanup ───────────────────────────────────────────────

async function cleanup() {
    header('CLEANUP: Removing Test Data');

    const User = require('./models/User');
    const Application = require('./models/Application');
    const Transaction = require('./models/Transaction');
    const Donation = require('./models/Donation');
    const AuditLog = require('./models/AuditLog');

    const testUserIds = [donorId, recipientId, adminId].filter(Boolean);

    if (testUserIds.length > 0) {
        const delUsers = await User.deleteMany({ _id: { $in: testUserIds } });
        log('🗑️', `Deleted ${delUsers.deletedCount} test users`);

        const delApps = await Application.deleteMany({ recipient_id: { $in: testUserIds } });
        log('🗑️', `Deleted ${delApps.deletedCount} test applications`);

        const delTx = await Transaction.deleteMany({
            $or: [
                { from_user: { $in: testUserIds } },
                { to_user: { $in: testUserIds } }
            ]
        });
        log('🗑️', `Deleted ${delTx.deletedCount} test transactions`);

        const delDon = await Donation.deleteMany({ donor_id: { $in: testUserIds } });
        log('🗑️', `Deleted ${delDon.deletedCount} test donations`);

        const delAudit = await AuditLog.deleteMany({ performedBy: { $in: testUserIds } });
        log('🗑️', `Deleted ${delAudit.deletedCount} test audit logs`);
    }
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
    console.log('\n🚀 ReliefLedger — Transaction Flagging Test Suite\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!\n');

    try {
        await test1_RegisterAndLogin();
        await test2_DonorDonates();
        await test3_ApproveAndDisburse();
        await test4_FlagCompletedTransaction();
        await test5_FrozenDonorBlocked();
        await test6_FrozenRecipientBlocked();
        await test7_AlreadyFlaggedBlocked();
    } catch (err) {
        console.error('\n❌ UNEXPECTED ERROR:', err.message);
        console.error(err.stack);
    } finally {
        await cleanup();
        await mongoose.disconnect();
        console.log(`\n${DIVIDER}`);
        console.log('  ✅ All tests finished. MongoDB disconnected.');
        console.log(DIVIDER + '\n');
    }
}

main();
