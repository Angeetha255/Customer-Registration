/**
 * Session Isolation Tests
 * 
 * These tests verify that Admin and Customer sessions remain completely isolated.
 * Run these tests in the browser console or with a test framework.
 */

import { 
  SESSION_TYPES,
  STORAGE_KEYS,
  getToken,
  getSessionData,
  setSession,
  clearSession,
  clearAllSessions,
  hasSession,
  getActiveSessions,
  assertValidSessionType
} from './sessionIsolation.js'

export const runSessionIsolationTests = () => {
  console.log('🧪 Running Session Isolation Tests...\n')
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  }

  const test = (name, fn) => {
    try {
      fn()
      results.passed++
      results.tests.push({ name, status: 'PASS' })
      console.log(`✅ PASS: ${name}`)
    } catch (error) {
      results.failed++
      results.tests.push({ name, status: 'FAIL', error: error.message })
      console.error(`❌ FAIL: ${name}`)
      console.error(`   Error: ${error.message}`)
    }
  }

  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(message || 'Assertion failed')
    }
  }

  // Cleanup before tests
  clearAllSessions()

  // Test 1: Storage keys are distinct
  test('Storage keys are distinct for admin and customer', () => {
    assert(STORAGE_KEYS.ADMIN.TOKEN === 'adminToken', 'Admin token key should be adminToken')
    assert(STORAGE_KEYS.ADMIN.DATA === 'adminData', 'Admin data key should be adminData')
    assert(STORAGE_KEYS.CUSTOMER.TOKEN === 'userToken', 'Customer token key should be userToken')
    assert(STORAGE_KEYS.CUSTOMER.DATA === 'userData', 'Customer data key should be userData')
    assert(STORAGE_KEYS.ADMIN.TOKEN !== STORAGE_KEYS.CUSTOMER.TOKEN, 'Token keys should be different')
    assert(STORAGE_KEYS.ADMIN.DATA !== STORAGE_KEYS.CUSTOMER.DATA, 'Data keys should be different')
  })

  // Test 2: Setting admin session doesn't affect customer session
  test('Setting admin session does not affect customer session', () => {
    setSession(SESSION_TYPES.ADMIN, 'admin-token-123', { id: 1, name: 'Admin User', type: 'admin' })
    
    const adminToken = getToken(SESSION_TYPES.ADMIN)
    const customerToken = getToken(SESSION_TYPES.CUSTOMER)
    
    assert(adminToken === 'admin-token-123', 'Admin token should be set')
    assert(customerToken === null, 'Customer token should still be null')
  })

  // Test 3: Setting customer session doesn't affect admin session
  test('Setting customer session does not affect admin session', () => {
    setSession(SESSION_TYPES.CUSTOMER, 'customer-token-456', { id: 2, name: 'Customer User', type: 'customer' })
    
    const adminToken = getToken(SESSION_TYPES.ADMIN)
    const customerToken = getToken(SESSION_TYPES.CUSTOMER)
    
    assert(adminToken === 'admin-token-123', 'Admin token should remain unchanged')
    assert(customerToken === 'customer-token-456', 'Customer token should be set')
  })

  // Test 4: Clearing admin session doesn't affect customer session
  test('Clearing admin session does not affect customer session', () => {
    clearSession(SESSION_TYPES.ADMIN)
    
    const adminToken = getToken(SESSION_TYPES.ADMIN)
    const customerToken = getToken(SESSION_TYPES.CUSTOMER)
    const customerData = getSessionData(SESSION_TYPES.CUSTOMER)
    
    assert(adminToken === null, 'Admin token should be cleared')
    assert(customerToken === 'customer-token-456', 'Customer token should remain')
    assert(customerData !== null, 'Customer data should remain')
  })

  // Test 5: Clearing customer session doesn't affect admin session
  test('Clearing customer session does not affect admin session', () => {
    // Reset admin session
    setSession(SESSION_TYPES.ADMIN, 'admin-token-789', { id: 3, name: 'Admin Two', type: 'admin' })
    
    clearSession(SESSION_TYPES.CUSTOMER)
    
    const adminToken = getToken(SESSION_TYPES.ADMIN)
    const customerToken = getToken(SESSION_TYPES.CUSTOMER)
    const adminData = getSessionData(SESSION_TYPES.ADMIN)
    
    assert(adminToken === 'admin-token-789', 'Admin token should remain')
    assert(customerToken === null, 'Customer token should be cleared')
    assert(adminData !== null, 'Admin data should remain')
  })

  // Test 6: hasSession correctly identifies active sessions
  test('hasSession correctly identifies active sessions', () => {
    clearAllSessions()
    
    assert(!hasSession(SESSION_TYPES.ADMIN), 'Admin session should not exist')
    assert(!hasSession(SESSION_TYPES.CUSTOMER), 'Customer session should not exist')
    
    setSession(SESSION_TYPES.ADMIN, 'token', { type: 'admin' })
    assert(hasSession(SESSION_TYPES.ADMIN), 'Admin session should exist')
    assert(!hasSession(SESSION_TYPES.CUSTOMER), 'Customer session should not exist')
    
    setSession(SESSION_TYPES.CUSTOMER, 'token', { type: 'customer' })
    assert(hasSession(SESSION_TYPES.ADMIN), 'Admin session should still exist')
    assert(hasSession(SESSION_TYPES.CUSTOMER), 'Customer session should now exist')
  })

  // Test 7: getActiveSessions returns correct state
  test('getActiveSessions returns correct state', () => {
    clearAllSessions()
    
    let active = getActiveSessions()
    assert(!active.admin && !active.customer, 'No sessions should be active')
    
    setSession(SESSION_TYPES.ADMIN, 'token', { type: 'admin' })
    active = getActiveSessions()
    assert(active.admin && !active.customer, 'Only admin should be active')
    
    setSession(SESSION_TYPES.CUSTOMER, 'token', { type: 'customer' })
    active = getActiveSessions()
    assert(active.admin && active.customer, 'Both should be active')
  })

  // Test 8: assertValidSessionType throws on invalid type
  test('assertValidSessionType throws on invalid type', () => {
    let threw = false
    try {
      assertValidSessionType('invalid')
    } catch (e) {
      threw = true
    }
    assert(threw, 'Should throw on invalid session type')
  })

  // Test 9: assertValidSessionType accepts valid types
  test('assertValidSessionType accepts valid types', () => {
    let threw = false
    try {
      assertValidSessionType('admin')
      assertValidSessionType('customer')
    } catch (e) {
      threw = true
    }
    assert(!threw, 'Should not throw on valid session types')
  })

  // Test 10: Dual session isolation (both can exist simultaneously)
  test('Both sessions can exist simultaneously without interference', () => {
    clearAllSessions()
    
    const adminData = { id: 1, name: 'Admin', type: 'admin', email: 'admin@test.com' }
    const customerData = { id: 2, name: 'Customer', type: 'customer', email: 'customer@test.com' }
    
    setSession(SESSION_TYPES.ADMIN, 'admin-token', adminData)
    setSession(SESSION_TYPES.CUSTOMER, 'customer-token', customerData)
    
    const retrievedAdmin = getSessionData(SESSION_TYPES.ADMIN)
    const retrievedCustomer = getSessionData(SESSION_TYPES.CUSTOMER)
    
    assert(retrievedAdmin.name === 'Admin', 'Admin data should be correct')
    assert(retrievedAdmin.email === 'admin@test.com', 'Admin email should be correct')
    assert(retrievedCustomer.name === 'Customer', 'Customer data should be correct')
    assert(retrievedCustomer.email === 'customer@test.com', 'Customer email should be correct')
    assert(retrievedAdmin !== retrievedCustomer, 'Data objects should be distinct')
  })

  // Test 11: Clearing all sessions works correctly
  test('clearAllSessions removes both sessions', () => {
    setSession(SESSION_TYPES.ADMIN, 'token', { type: 'admin' })
    setSession(SESSION_TYPES.CUSTOMER, 'token', { type: 'customer' })
    
    clearAllSessions()
    
    assert(!hasSession(SESSION_TYPES.ADMIN), 'Admin session should be cleared')
    assert(!hasSession(SESSION_TYPES.CUSTOMER), 'Customer session should be cleared')
  })

  // Test 12: Session data is properly serialized/deserialized
  test('Session data is properly serialized and deserialized', () => {
    const complexData = {
      id: 123,
      name: 'Test User',
      email: 'test@example.com',
      nested: { foo: 'bar', count: 42 },
      array: [1, 2, 3]
    }
    
    setSession(SESSION_TYPES.CUSTOMER, 'token', complexData)
    const retrieved = getSessionData(SESSION_TYPES.CUSTOMER)
    
    assert(retrieved.id === 123, 'ID should match')
    assert(retrieved.name === 'Test User', 'Name should match')
    assert(retrieved.nested.foo === 'bar', 'Nested data should match')
    assert(JSON.stringify(retrieved.array) === JSON.stringify([1, 2, 3]), 'Array should match')
  })

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log(`Test Results: ${results.passed} passed, ${results.failed} failed`)
  console.log('='.repeat(50))
  
  if (results.failed > 0) {
    console.log('\n❌ Some tests failed. Please review the errors above.')
  } else {
    console.log('\n✅ All tests passed! Session isolation is working correctly.')
  }
  
  return results
}

// Auto-run if in development mode
if (import.meta.env.DEV) {
  console.log('💡 Session isolation tests available. Call runSessionIsolationTests() to run.')
}

export default runSessionIsolationTests