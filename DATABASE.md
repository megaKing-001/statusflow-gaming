# STATUSFLOW GAMING — DATABASE

## 1. Purpose

This document describes the database architecture for StatusFlow Gaming.

The database is hosted in Supabase/PostgreSQL.

The database is responsible for storing authoritative application state.

The browser must never be treated as the authority for wallet balances, rewards, game results, or ownership.

IMPORTANT:

This document initially records the intended database architecture.

The actual Supabase schema must be audited and documented before treating any table, column, function, trigger, or policy as confirmed.

---

# 2. Supabase Project

Supabase project reference:

ogzouyydansuttpmmkcg

The same Supabase ecosystem is used by the broader StatusFlow platform.

StatusFlow Gaming should integrate with the existing StatusFlow identity and reward architecture where appropriate.

Do not create duplicate user accounts or duplicate wallet systems without a specific architectural reason.

---

# 3. Database Technology

Database:

PostgreSQL

Platform:

Supabase

Important Supabase capabilities used or intended for the project include:

- PostgreSQL tables
- PostgreSQL functions
- database constraints
- indexes
- Row Level Security
- Supabase Auth
- Realtime where required

---

# 4. Database Authority

The database should be considered authoritative for persistent state.

Examples:

- user profiles
- game sessions
- wallet records
- ledger transactions
- purchases
- tournament participation
- match state
- reward settlement
- daily reward claims

Client-side state is temporary and must not be treated as authoritative.

---

# 5. Authentication

Supabase Auth identifies users.

The authenticated user's identity should be obtained from the trusted authentication context.

Do not trust a client-provided user ID when the server can obtain the authenticated user directly.

Conceptually:

```text
Supabase Auth
      |
      v
Authenticated User
      |
      v
Application Database Records
6. User/Profile Data
The system is expected to maintain user-related information.
Possible categories include:
user identity
profile information
account status
membership/level information
timestamps
preferences
The exact table and column names must be confirmed from the real database.
DO NOT assume a table exists merely because application code references it.

7. Wallet Architecture
SFP is the internal StatusFlow Points currency.
Wallet data must be protected.
The database should support:
User
  |
  v
Wallet Account
  |
  v
Ledger Transactions

A wallet balance must never be changed merely because a browser sends a new balance value.

8. Wallet Account
The application currently references wallet account concepts.
The actual schema must be verified.
A wallet account is expected to represent the user's current SFP balance or provide access to the user's balance.
Potential information may include:
user ID
SFP balance
created timestamp
updated timestamp
Exact names and types must be confirmed from Supabase.

9. SFP Ledger
The ledger is the authoritative history of balance-changing events.
Examples:
+50 SFP   Game reward
+20 SFP   Daily reward
+100 SFP  Referral reward
-100 SFP  Store purchase

Every balance-changing event should be traceable.
A ledger transaction should ideally identify:
user
amount
transaction type
reason
source
related game/session/purchase where applicable
timestamp
unique reference/idempotency key
metadata where appropriate
Exact schema must be verified.

10. Ledger Principles
The ledger must be append-oriented wherever possible.
Do not silently overwrite transaction history.
If an administrative correction is required, it should create a traceable adjustment rather than deleting evidence of the original transaction.
Transactions should be immutable after settlement unless there is a controlled administrative correction mechanism.

11. Reward Settlement
A game reward should follow a trusted flow:
Game Session
     |
     v
Server Validation
     |
     v
Reward Calculation
     |
     v
Ledger Transaction
     |
     v
Wallet Balance

The client should not determine the final reward.
For example, the client must not be allowed to submit:
reward = 100000

and have the database blindly add that amount.

12. Idempotency
Reward settlement must be idempotent.
A repeated request for the same completed session must not create another reward.
Example:
Session: SESSION123

First settlement:
+50 SFP

Repeated settlement:
No additional reward

This should be enforced through appropriate server/database logic.
Possible protections include:
unique session settlement records
unique transaction references
database unique constraints
transactional functions
status/state checks
The actual implementation must be audited.

13. Game Sessions
Games should use sessions to track individual plays.
A session may contain information such as:
session ID
user ID
game ID
start time
completion time
current state
result
reward status
suspicious/anti-cheat state
The exact schema must be confirmed.

14. Session State
A game session should have controlled state transitions.
Example:
CREATED
   |
   v
STARTED
   |
   v
IN_PROGRESS
   |
   v
COMPLETED
   |
   v
SETTLED

Invalid transitions must be rejected.
For example:
SETTLED
   |
   X
   v
SETTLED AGAIN

must not create another reward.

15. Game Records
The system contains multiple games.
Known game categories include:
StatusQuiz
StatusCrash
StatusWheel
StatusCards
StatusFootball
The repository also contains a game Registry.
The database may contain a games table or equivalent structure.
The actual database must be inspected to confirm:
table name
columns
game identifiers
enabled/disabled state
configuration
reward settings
Do not create duplicate game records without checking the existing database.

16. Quiz Data
StatusQuiz may require database records for:
questions
answer options
correct answers
game sessions
submissions
results
rewards
The application repository contains:
lib/actions/quiz.ts
lib/actions/quiz-submission.ts
and:
lib/engine/games/StatusQuizEngine.ts
The exact database implementation must be audited.
Correct answers should not be unnecessarily exposed to the client.

17. Crash Game Data
StatusCrash may require records for:
game sessions
generated outcomes
player actions
settlement
reward information
The server must prevent clients from determining or changing the final crash result.
The exact implementation must be audited.

18. Wheel Game Data
StatusWheel may require records for:
spins
sessions
outcomes
rewards
settlement
The client should not be allowed to select a winning reward and submit it as if it were generated by the server.
The exact implementation must be audited.

19. Cards Game Data
StatusCards may require records for:
game sessions
cards/actions
outcomes
rewards
settlement
The exact implementation must be audited.

20. StatusFootball Data
StatusFootball may require database structures for:
football game sessions
player actions
AI matches
PvP matches
matchmaking
match state
results
rewards
The exact schema must be verified.
Do not assume that the current PvP implementation is secure until the relevant database tables, functions, and RLS policies have been inspected.

21. PvP Match Data
PvP matches should identify the participating users.
Conceptually:
Match
 |
 +-- Player A
 |
 +-- Player B
 |
 +-- Match State
 |
 +-- Result
 |
 +-- Settlement

The database should prevent unauthorized users from modifying a match they do not belong to.
A player must not be able to alter:
opponent identity
match result
reward
settlement status
unless authorized by trusted server logic.

22. Matchmaking
Matchmaking may require records for:
waiting players
match IDs
player IDs
match status
creation time
expiry
game mode
The exact implementation must be audited.
Important requirements:
no duplicate matching
no unauthorized joining
no joining an already settled match
no joining as another player
no manipulating opponent assignment

23. Daily Rewards
Daily rewards require database protection against repeated claims.
The database/server should determine:
whether the user can claim
when the previous claim occurred
current streak
reward amount
whether the claim has already been processed
The client must not be trusted to determine eligibility.

24. Store Purchases
Store purchases should be recorded.
A purchase may contain:
purchase ID
user ID
item ID
price
status
timestamp
transaction reference
The actual schema must be verified.
The purchase process should prevent:
changing item price
negative prices
purchasing without enough SFP
duplicate deductions
duplicate fulfillment

25. Tournaments
Tournament data may include:
tournament
participants
entries
matches
standings
winners
rewards
settlement state
The actual schema must be audited.
Tournament reward settlement must be idempotent.

26. Database Functions
The project may use PostgreSQL/Supabase functions for trusted operations.
Examples of operations that may require database functions include:
wallet settlement
atomic balance updates
reward settlement
purchase transactions
tournament settlement
match settlement
The exact functions currently present in Supabase must be retrieved and documented.
DO NOT invent function names.

27. Atomic Transactions
Wallet operations should be atomic.
For example, a store purchase should not produce:
SFP deducted
but purchase not recorded

or:
Purchase recorded
but SFP not deducted

unless the system intentionally supports a recoverable pending state.
Where appropriate, related operations should occur inside a database transaction.

28. Database Constraints
Constraints should protect data integrity.
Potential examples include:
foreign keys
unique constraints
NOT NULL constraints
CHECK constraints
valid numeric ranges
Examples:
SFP reward should not unexpectedly be negative.
A user should not have two records where only one is allowed.
A transaction reference intended to be unique should actually be unique.
Exact constraints must be documented after database inspection.

29. Indexes
Indexes should support frequently used queries.
Potential areas include:
user ID
session ID
match ID
transaction ID
created timestamp
game ID
tournament ID
Indexes should be based on actual query patterns.
Do not add large numbers of indexes without measuring their usefulness.

30. Row Level Security
RLS is a major security boundary.
Users should only be able to access records they are authorized to access.
Conceptually:
User A
 |
 +--> User A private data
 |
 X--> User B private data

RLS should remain enabled for sensitive tables.
Never disable RLS simply to make a query work.

31. Server vs RLS
RLS and server-side authorization are complementary.
Server code should validate business rules.
RLS should restrict database access.
Sensitive operations may require trusted server/database functions with carefully controlled privileges.
Any elevated database operation must be reviewed carefully.

32. Secrets
Database credentials and service-role credentials are secrets.
Never put a Supabase service-role key in:
client components
browser JavaScript
public GitHub files
screenshots
public documentation
Never expose private keys through NEXT_PUBLIC_ variables.
Only public client-safe Supabase values should use NEXT_PUBLIC_ variables.

33. Database Audit Requirement
The actual Supabase database has not yet been fully audited.
Before finalizing this document, inspect:
Tables
Columns
Primary keys
Foreign keys
Unique constraints
Check constraints
Indexes
Functions
Triggers
RLS status
RLS policies
Realtime configuration where applicable
Wallet logic
Ledger logic
Game/session logic
The results of this audit should replace assumptions in this document.

34. Database Documentation Rule
Whenever a database change is made:
Update the database migration.
Test the change.
Update DATABASE.md.
Verify RLS.
Verify related server actions.
Commit the changes to GitHub.
The database documentation should remain synchronized with the real database.

35. Migration Rule
Database changes should preferably be made through version-controlled migrations.
Avoid making undocumented manual changes in the Supabase dashboard when the change should be part of the project schema.
If a dashboard change is unavoidable:
Record what changed.
Reproduce it in a migration where appropriate.
Update DATABASE.md.
Commit the migration.

36. Data Integrity Priority
Never sacrifice database integrity to make a feature work quickly.
If an operation can produce:
duplicate rewards
negative/invalid balances
orphaned records
unauthorized ownership
inconsistent settlement
the implementation must be fixed before production use.

37. Current Known Database Status
The exact current schema is still being verified.
Therefore, the following are NOT yet considered confirmed merely from application source code:
exact table names
exact column names
exact data types
exact functions
exact triggers
exact RLS policies
exact indexes
exact wallet implementation
exact ledger implementation
These must be retrieved from the actual Supabase project.

38. Database Audit Priority
After the five project documentation files are completed, the database should be inspected before major gameplay changes.
The audit should answer:
What tables actually exist?
What does each table store?
Which tables control SFP?
How are rewards recorded?
Can rewards be duplicated?
Who can modify wallet records?
Which RLS policies exist?
Which database functions can change balances?
Which functions are callable by authenticated users?
Are any dangerous functions exposed to clients?
Are game sessions protected?
Are PvP records protected?

39. Golden Database Rule
The database must never blindly trust the browser.
The browser can request.
The server validates.
The database enforces integrity.
The ledger records the movement.
The wallet reflects the trusted result.
No client request should be able to bypass these protections.

 

