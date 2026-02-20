# ZKWhistle — Anonymous Whistleblower Reports on Aleo

> **Speak Truth. Stay Hidden.**
>
> ZKWhistle is a zero-knowledge whistleblower protocol built on Aleo. Organization members can submit anonymous reports with cryptographic proof of membership — without ever revealing their identity.

---

## The Problem

Whistleblowers face retaliation, job loss, and legal threats. Existing reporting systems (hotlines, web forms, email) rely on trust — the platform operator, the company, or a third party can always trace the reporter. Even "anonymous" tip lines often log IP addresses, metadata, or require identifying information.

There is no way to simultaneously prove you are a legitimate member of an organization **and** remain completely anonymous — until now.

## The Solution

ZKWhistle uses Aleo's zero-knowledge proof system to solve this. A member proves they belong to an organization **without revealing which member they are**. The report appears on-chain with only a content hash, severity level, and status. No address, no identity, no metadata links back to the reporter.

### How It Works

```
┌─────────────┐      ┌──────────────────┐      ┌────────────────┐
│  Admin       │      │  Member          │      │  On-Chain       │
│  registers   │─────▶│  receives secret │      │  (public)       │
│  org + adds  │      │  hash added to   │      │                 │
│  member hash │      │  membership list  │      │                 │
└─────────────┘      └────────┬─────────┘      │                 │
                              │                 │                 │
                    ┌─────────▼─────────┐      │  ┌────────────┐ │
                    │  Member submits   │      │  │ report_id  │ │
                    │  report with      │─────▶│  │ org_id     │ │
                    │  PRIVATE secret   │  ZK  │  │ content_hash│ │
                    │  (never revealed) │ proof│  │ severity   │ │
                    └───────────────────┘      │  │ status     │ │
                                               │  └────────────┘ │
                         Identity: HIDDEN       │  Reporter: ???   │
                                               └────────────────┘
```

1. **Admin registers** an organization on-chain
2. **Member generates** a private secret and computes its BHP256 hash
3. **Admin adds** the hash to the organization's membership list (never the secret)
4. **Member submits** a report using their private secret. The ZK circuit hashes it inside the proof, verifies it matches a registered member hash, and publishes the report — with zero link to the reporter's identity
5. **Admin reviews** reports and updates status (Open → Reviewing → Resolved)

### Privacy Guarantees

| Data | Visibility |
|------|-----------|
| Member's secret | Never leaves the device — private input to ZK circuit |
| Member's address | Never stored or linked to membership |
| Member's identity | Impossible to determine from on-chain data |
| Report content | Only a hash is stored on-chain |
| Report severity | Public (for triage) |
| Report status | Public (for tracking) |
| Organization info | Public (name hash, member count, report count) |

**Even the admin cannot identify who filed a report.** The ZK proof only confirms "a valid member submitted this" — not which member.

---

## Deployed Program

- **Program ID:** `zkwhistle_kumar_v1.aleo`
- **Network:** Aleo Testnet
- **Deployment TX:** `at1uccgepy604u5t0jnnmq96gzaa4dmc2tgash37rtghe7shat8gqgslyua44`

### On-Chain Mappings

| Mapping | Key | Value |
|---------|-----|-------|
| `organizations` | `org_id: field` | OrgInfo (name_hash, admin, member_count, report_count, is_active) |
| `members` | `member_hash: field` | `bool` |
| `reports` | `report_id: field` | ReportInfo (org_id, content_hash, severity, status, report_index) |
| `org_count` | `0u8` | Total organizations registered |
| `total_reports` | `0u8` | Total reports submitted |

### Program Transitions

| Transition | Who | Description |
|-----------|-----|-------------|
| `register_org(org_id, name_hash)` | Anyone | Register a new organization |
| `add_member(org_id, member_hash)` | Admin | Add a member by their hash |
| `submit_report(org_id, member_secret, report_id, content_hash, severity)` | Member | Submit anonymous report (secret is private) |
| `update_report_status(org_id, report_id, new_status)` | Admin | Update report status |
| `compute_member_hash(secret)` | Anyone | Compute BHP256 hash of a secret |

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Smart Contract | Leo (Aleo's ZK programming language) |
| Network | Aleo Testnet |
| Frontend | React 18 + Vite |
| Wallet | Leo Wallet / Shield Wallet (via @demox-labs wallet adapters) |
| Styling | Custom CSS — dark investigative theme |
| Fonts | Crimson Pro (serif headings) + Source Code Pro (mono body) |
| API | Provable Explorer API for on-chain mapping queries |

---

## Project Structure

```
zkwhistle/
├── zkwhistle_program/          # Leo smart contract
│   ├── src/
│   │   └── main.leo            # Full program with 5 transitions
│   ├── inputs/
│   │   └── zkwhistle_program.in
│   ├── program.json
│   └── .env                    # Private key config
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Navigation + wallet connect
│   │   ├── Dashboard.jsx       # Hero section + live on-chain stats
│   │   ├── RegisterOrg.jsx     # Organization registration
│   │   ├── AddMember.jsx       # Member management (add + compute hash)
│   │   ├── SubmitReport.jsx    # Anonymous report submission
│   │   ├── ViewReports.jsx     # Report/org lookup + status updates
│   │   ├── ConnectScreen.jsx   # Wallet connection prompt
│   │   └── Footer.jsx
│   ├── utils/
│   │   └── aleo.js             # Provable API helpers + struct parser
│   ├── App.jsx                 # Wallet provider setup
│   ├── main.jsx                # React entry
│   └── index.css               # Full dark theme CSS
├── index.html
├── package.json
└── vite.config.js
```

---

## Setup & Run

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Leo](https://developer.aleo.org/getting_started/) v3.4.0+
- [Leo Wallet](https://www.leo.app/) browser extension

### Install & Run Frontend

```bash
cd zkwhistle
npm install
npm run dev
```

Open `http://localhost:5173` and connect your Leo Wallet.

### Deploy Your Own (Optional)

```bash
cd zkwhistle_program

# Generate a new Aleo account
leo account new

# Update .env with your private key
# PRIVATE_KEY=APrivateKey1zkp...

# Build
leo build

# Deploy
leo deploy --network testnet --broadcast
```

Then update `PROGRAM_ID` in `src/utils/aleo.js` with your program name.

---

## Demo Flow

### 1. Register Organization
Navigate to **Register Org** → enter a name → submit → save the Org ID.

### 2. Generate Member Credentials
Navigate to **Members** → **Compute Hash** tab → generate a secret → run via CLI:
```bash
cd zkwhistle_program
leo run compute_member_hash YOUR_SECRET_field
```
Save both the secret (private) and the hash output (share with admin).

### 3. Add Member
**Members** → **Add Member** tab → enter Org ID + member hash → submit.

### 4. Submit Anonymous Report
**Submit Report** → enter Org ID + your private secret + report text + severity → submit.

The ZK circuit hashes the secret, verifies membership, and publishes the report with zero identity linkage.

### 5. Verify On-Chain
**View Reports** → look up the report by ID → see severity, status, content hash, org ID.

**View Reports** → look up the org → see member count, report count, admin.

**View Reports** → check member hash → verify membership.

### 6. Admin Actions
**View Reports** → **Update Status** → change report status (Open → Reviewing → Resolved → Dismissed).

---

## Verified Testnet Transactions

| Action | Transaction ID |
|--------|---------------|
| Deploy Program | `at1uccgepy604u5t0jnnmq96gzaa4dmc2tgash37rtghe7shat8gqgslyua44` |
| Register Org | Verified — org_count = 1 |
| Add Member | Verified — member hash registered |
| Submit Report | Verified — total_reports = 1 |
| Update Status | Verified — status changed to Reviewing |

### Verify Live Data

```bash
# Check total organizations
curl https://api.explorer.provable.com/v1/testnet/program/zkwhistle_kumar_v1.aleo/mapping/org_count/0u8

# Check total reports
curl https://api.explorer.provable.com/v1/testnet/program/zkwhistle_kumar_v1.aleo/mapping/total_reports/0u8

# Look up a specific report
curl https://api.explorer.provable.com/v1/testnet/program/zkwhistle_kumar_v1.aleo/mapping/reports/205405241field
```

---

## Why Aleo?

ZKWhistle is only possible on Aleo because:

1. **Private inputs to transitions** — the member's secret never appears in the transaction or on-chain. It is a private input that only exists inside the ZK proof.

2. **On-chain verification without exposure** — the BHP256 hash check happens inside the ZK circuit. The network verifies the proof is valid without learning the secret.

3. **No metadata leakage** — unlike Ethereum or Solana, Aleo transactions don't inherently link `msg.sender` to the action. The `submit_report` transition takes `org_id` and `member_secret` as private inputs, so the reporter's address is not part of the public on-chain record.

4. **Programmable privacy** — admins can update report status publicly while the reporter's identity remains permanently hidden. This selective transparency is core to Aleo's design.

---

## Use Cases

- **Corporate whistleblowing** — employees report fraud, harassment, or safety violations without fear of retaliation
- **Government transparency** — civil servants expose corruption with cryptographic proof of insider status
- **Academic integrity** — university members report research misconduct anonymously
- **Healthcare reporting** — medical staff report safety concerns without career risk
- **DAO governance** — token holders raise concerns about leadership without social pressure
- **Journalism** — sources prove organizational membership to reporters without revealing identity

---

## Future Improvements

- Encrypted report content (stored off-chain, hash on-chain)
- Multi-org membership verification
- Time-locked report reveals
- Reward mechanism for verified reports
- IPFS integration for report attachments
- Cross-organization reporting dashboards

---

## Built For

**Aleo Privacy Buildathon — Wave 2**

*Because truth shouldn't require sacrifice.*

---

## License

MIT
