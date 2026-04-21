# Security Specification: NGO Connect

## Data Invariants
1. A user can only register one NGO profile linked to their UID.
2. A user can only create one volunteer profile linked to their UID.
3. Problem submissions must have a valid `submittedById` matching the current user.
4. NGOs cannot change their `submittedById` after creation.
5. Critical NGO fields like `status` (PENDING/VERIFIED) can only be changed by a system admin (mocked as admin collection).

## The Dirty Dozen Payloads

1. **Identity Spoofing**: NGO creation with `submittedById` set to another user's UID.
2. **Privilege Escalation**: User tries to set their own NGO `status` to 'VERIFIED' during registration.
3. **Ghost Field Injection**: Adding `isSystemAdmin: true` to a volunteer profile.
4. **ID Poisoning**: Submitting a problem with a 50KB string as the document ID.
5. **PII Leakage**: Authenticated user trying to list all `ngos` including sensitive contact fields without specific relationship.
6. **Immutable Field Tampering**: Updating an NGO's `createdAt` timestamp.
7. **Orphaned Write**: Creating a problem without a valid user session.
8. **Resource Exhaustion**: Sending a mission description that is 2MB in size.
9. **State Shortcutting**: Updating a problem status from 'UNASSIGNED' directly to 'COMPLETED' without intermediate states (if enforced).
10. **Self-Rating Hack**: User trying to update their own `verification` status in `volunteers` collection.
11. **Relational Sync Bypass**: Updating an NGO without providing the required `submittedById` check.
12. **Timestamp Fraud**: Providing a back-dated `createdAt` instead of using `serverTimestamp()`.

## Test Runner (Logic Definitions)
The rules must reject all of the above payloads.
