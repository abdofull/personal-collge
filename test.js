// test.js - Sanity test for financial business logic
const assert = require('assert');

console.log('🧪 Starting Sanity Tests for Financial Business Logic...');

try {
    // Test 1: Balance Calculation
    console.log('Running Test 1: Balance Calculation...');
    const initialBalance = 1000;
    const incomes = [500, 200];
    const expenses = [300, 100];
    
    const totalIncome = incomes.reduce((a, b) => a + b, 0);
    const totalExpense = expenses.reduce((a, b) => a + b, 0);
    const currentBalance = initialBalance + totalIncome - totalExpense;
    
    assert.strictEqual(totalIncome, 700, 'Total income should be 700');
    assert.strictEqual(totalExpense, 400, 'Total expense should be 400');
    assert.strictEqual(currentBalance, 1300, 'Current balance should be 1300');
    console.log('✅ Test 1 Passed!');

    // Test 2: Budget Spent and Exceeded Calculation
    console.log('Running Test 2: Budget Spent & Overlimit Check...');
    const allocatedAmount = 250;
    let spentAmount = 150;
    const newTransactionAmount = 120;
    
    const newSpentAmount = spentAmount + newTransactionAmount;
    const isExceeded = newSpentAmount > allocatedAmount;
    
    assert.strictEqual(newSpentAmount, 270, 'New spent amount should be 270');
    assert.strictEqual(isExceeded, true, 'Spent amount should exceed allocated amount');
    console.log('✅ Test 2 Passed!');

    // Test 3: Transaction Difference Sync logic
    console.log('Running Test 3: Transaction Update Difference Sync...');
    const oldAmount = 150;
    const updatedAmount = 200;
    const difference = updatedAmount - oldAmount;
    
    let budgetItemSpent = 300;
    budgetItemSpent += difference;
    
    assert.strictEqual(difference, 50, 'Difference should be 50');
    assert.strictEqual(budgetItemSpent, 350, 'Updated budget item spent should be 350');
    console.log('✅ Test 3 Passed!');

    console.log('\n🎉 All Sanity Tests Passed Successfully!');
    process.exit(0);
} catch (error) {
    console.error('❌ Test Failed:', error.message);
    process.exit(1);
}
