// Fictional, deterministic teaching scenarios. No authentication requests are made.
export const attacks = {
  brute: {
    title: 'A lot of guesses. One account.', description: 'Enumerate combinations until one matches.', pattern: 'MANY GUESSES → ONE ACCOUNT', candidateLabel: 'CANDIDATE PINs', accountLabel: 'TARGET ACCOUNT', source: 'Toy space: 000–999 · correct PIN: 004',
    candidates: ['000', '001', '002', '003', '004'], accounts: [{ name: 'Maya', username: 'maya', secret: '004' }],
    attempts: ['000','001','002','003','004'].map((password, candidate) => ({ candidate, account: 0, password })),
    insight: 'This tiny PIN space makes enumeration visible. It is not a real-world cracking estimate. Real passwords can have a much larger search space.'
  },
  dictionary: {
    title: 'Try the likely passwords first.', description: 'Use a list of common or predictable passwords instead of every combination.', pattern: 'COMMON WORDS → ONE ACCOUNT', candidateLabel: 'COMMON PASSWORD LIST', accountLabel: 'TARGET ACCOUNT', source: 'Small, fixed teaching list',
    candidates: ['123456','password','Maya123','Maya20261014'], accounts: [{ name: 'Maya', username: 'maya', secret: 'Maya20261014' }],
    attempts: ['123456','password','Maya123','Maya20261014'].map((password, candidate) => ({ candidate, account: 0, password })),
    insight: 'A dictionary attack prioritizes likely choices. Adding a predictable number or symbol does not necessarily make a common password hard to guess.'
  },
  stuffing: {
    title: 'One stolen login. Three other websites.', description: 'The attacker has Maya’s username and password from Website A.',
    candidates: ['maya / maya_happyhappy'],
    stolen: { username: 'maya', password: 'maya_happyhappy' },
    accounts: [
      { name: 'Website B', letter: 'B', username: 'maya', secret: 'different-password-b' },
      { name: 'Website C', letter: 'C', username: 'maya', secret: 'different-password-c' },
      { name: 'Website D', letter: 'D', username: 'maya', secret: 'maya_happyhappy' }
    ],
    attempts: [0,1,2].map(account => ({ candidate: 0, account, username: 'maya', password: 'maya_happyhappy' })),
    insight: 'The same stolen pair fails on Websites B and C. Website D reused it, so the attacker gets in.'
  },
  spraying: {
    title: 'One common password. Many accounts.', description: 'Spread a common password guess across a group of users.', pattern: 'ONE PASSWORD → MANY ACCOUNTS', candidateLabel: 'ONE COMMON PASSWORD', accountLabel: 'MULTIPLE ACCOUNTS', source: 'Same candidate, different usernames',
    candidates: ['Welcome1!'], accounts: [{name:'Maya',username:'maya',secret:'not-a-match'},{name:'Noah',username:'noah',secret:'Welcome1!'},{name:'Alex',username:'alex',secret:'different-password'},{name:'Sam',username:'sam',secret:'Welcome1!'}],
    attempts: [0,1,2,3].map(account => ({candidate:0,account,password:'Welcome1!'})),
    insight: 'The same guess fans out across accounts. Low attempts per account can avoid simple per-account thresholds, which is why rate limiting alone is not enough.'
  }
};
export function attackResult(scenario, attempt) { const account = scenario.accounts[attempt.account]; return account.secret === attempt.password && (!attempt.username || account.username === attempt.username); }
const state = (status, kind, description) => ({ status, kind, description });
const ready = text => state('READY', 'neutral', text);
const rejected = text => state('NO MATCH', 'rejected', text);
const exposed = text => state('LOGGED IN', 'success', text);
const wait = text => state('COOLDOWN', 'waiting', text);
export const defenses = {
  rate: {
    title: 'Slow down repeated guesses.', description: 'Both systems receive the same attempts. Only one limits the rate.', before: 'Unlimited attempts', after: 'Rate limiting',
    insight: 'Teaching rule: 3 failed attempts trigger a simulated cooldown. The real threshold depends on the system. Rate limiting slows guessing; it does not make a known password invalid.',
    frames: [
      {input:'Attacker starts guessing · correct toy PIN: 004',left:ready('Every request will be checked.'),right:ready('After 3 failures, a cooldown begins.'),note:'Step through the same requests on both systems. This is simulated time, not a live login.'},
      {input:'Attempt 1 → PIN 000',left:rejected('Wrong PIN. Another attempt is allowed.'),right:rejected('Wrong PIN. Failure 1 of 3.'),note:'Both systems reject the wrong PIN.'},
      {input:'Attempt 2 → PIN 001',left:rejected('Wrong PIN. Another attempt is allowed.'),right:rejected('Wrong PIN. Failure 2 of 3.'),note:'The rate-limited system tracks consecutive failures.'},
      {input:'Attempt 3 → PIN 002',left:rejected('Wrong PIN. Keep trying.'),right:wait('Failure 3 of 3. Further attempts must wait.'),note:'After the third failure, a temporary cooldown begins on the right.'},
      {input:'Attempt 4 → PIN 003 · during cooldown',left:rejected('Wrong PIN. The request was checked.'),right:wait('Request delayed. PIN not checked.'),note:'The unprotected system keeps checking guesses. The protected one pauses them.'},
      {input:'Attempt 5 → PIN 004 · during cooldown',left:exposed('The guessed PIN matches. Access granted.'),right:wait('Even this request must wait. No login yet.'),note:'At this point, the attacker is in on the left, but still waiting on the right.'},
      {input:'Simulated time advances → cooldown ends',left:exposed('The earlier login remains active.'),right:ready('The cooldown is over. Requests can resume.'),note:'A temporary delay is not a permanent block. We advance simulated time instead of making you wait.'},
      {input:'New attempt → PIN 004 · after cooldown',left:exposed('The attacker was already logged in.'),right:exposed('Correct PIN after the delay. Access granted.'),note:'The limit bought time; it did not guarantee safety. Add other controls, such as MFA and stronger secrets.'}
    ]
  },
  unique: {
    title: 'Use a different password on each site.',description:'The attacker has a valid password from fictional Site A.',before:'Reused on Site B',after:'Unique on Site B',
    insight:'Unique passwords reduce cross-site reuse risk. A password manager can generate and store a different, strong password for each account.',
    frames:[
      {input:'Site A credentials: maya / cedar!42',left:ready('Site B uses the same password as Site A.'),right:ready('Site B uses a different password.'),note:'The two versions of Site B differ in one thing: whether the password was reused.'},
      {input:'Site A suffers a fictional credential leak',left:ready('The attacker now knows the reused secret.'),right:ready('The attacker still does not know Site B’s secret.'),note:'This attack starts with stolen credentials, not random guessing.'},
      {input:'Try maya / cedar!42 on Site B',left:exposed('The leaked pair matches on both sites.'),right:rejected('The leaked Site A password does not match.'),note:'One leak became two compromised accounts only where the password was reused.'},
      {input:'Same leaked credentials. Different outcome.',left:exposed('Password complexity cannot undo reuse.'),right:rejected('This particular leaked pair cannot log in.'),note:'Unique does not mean invulnerable. It means a stolen password from another site is not automatically useful here.'}
    ]
  },
  mfa: {
    title: 'Add a second check.',description:'The attacker already has the right password. Add an independent factor.',before:'Password only',after:'Password + MFA',
    insight:'Here, the attacker lacks the second factor. MFA needs different factor types, not just two steps. It reduces risk, but some forms can still be phished or otherwise compromised.',
    frames:[
      {input:'Attacker possesses the correct password',left:ready('One secret is the entire login check.'),right:ready('A separate possession factor is also required.'),note:'Assume the password has been stolen. Can the attacker finish logging in?'},
      {input:'Submit the stolen, correct password',left:exposed('Password accepted. Access granted.'),right:state('SECOND FACTOR NEEDED','waiting','Password accepted. Login is not complete.'),note:'On the right, passing the password check does not create an authenticated session.'},
      {input:'Attacker cannot provide the second factor',left:exposed('No additional identity check exists.'),right:state('NO ACCESS','rejected','Second factor missing. No session issued.'),note:'This attack is blocked by an independent check, not by changing whether the password matches.'},
      {input:'Outcome → password accepted ≠ login completed',left:exposed('The stolen password was enough.'),right:state('NO ACCESS','rejected','The password alone was not enough.'),note:'Now try the legitimate-user button: someone with both factors can complete the login.'}
    ],
    legitimate:{input:'Legitimate owner supplies password + possession factor',left:state('LOGGED IN','success','The owner also knows the password.'),right:state('LOGGED IN','success','Both independent checks pass. Access granted.'),note:'The extra check is designed to admit the legitimate owner, not to lock everyone out.'}
  }
};
export function defenseFrame(mode, step, legitimate = false) { const s = defenses[mode]; return legitimate && s.legitimate ? s.legitimate : s.frames[Math.max(0,Math.min(step,s.frames.length-1))]; }
