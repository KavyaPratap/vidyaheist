const crypto = require('crypto');

const secret = 'e5f1b25a72fb6c73affae426108af8e2';
const url = 'http://localhost:9002/api/razorpay/webhook'; // Match your dev port

const payload = {
  event: 'order.paid',
  payload: {
    order: {
      entity: {
        id: 'order_test_123'
      }
    },
    payment: {
      entity: {
        id: 'pay_test_123'
      }
    }
  }
};

const body = JSON.stringify(payload);
const signature = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

console.log('--- TEST WEBHOOK COMMAND ---');
console.log(`curl -X POST ${url} \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "x-razorpay-signature: ${signature}" \\`);
console.log(`  -d '${body}'`);
console.log('----------------------------');
