# ZKWhistle — Anonymous Whistleblower Reports on Aleo

> **Speak Truth. Stay Hidden.**
>
> ZKWhistle is a zero-knowledge whistleblower protocol built on Aleo. Organization members can submit anonymous reports with cryptographic proof of membership — without ever revealing their identity.

**[Live Demo](https://zk-whistle-rouge.vercel.app/)** | **[Demo Video](https://youtu.be/YeccBHXTeww)** | **[Deployed Program](https://explorer.provable.com/program/zkwhistle_kumar_v2.aleo)**

---

## The Problem

Whistleblowers face retaliation, job loss, and legal threats. Existing reporting systems — hotlines, web forms, email — rely on trust. The platform operator, the company, or a third party can always trace the reporter. Even "anonymous" tip lines often log IP addresses, metadata, or require identifying information.

## The Solution

ZKWhistle uses Aleo's zero-knowledge proof system to solve this. A member proves they belong to an organization **without revealing which member they are**. The report appears on-chain with only a content hash, severity level, and status. No address, no identity, no metadata links back to the reporter.

### How It Works

```
┌─────────────┐      ┌──────────────────┐      ┌────────────────┐
│  Admin       │      │  Member          │      │  On-Chain       │
│  registers   │─────▶│  clicks "Join"   │      │  (public)       │
│  org         │      │  with a secret   │      │                 │
└─────────────┘      └────────┬─────────┘      │                 │
                              │  ZK hashes     │                 │
                              │  secret on     │  Only hash      │
                              │  device        │  stored          │
                              │                 │                 │
                    ┌─────────▼─────────┐      │  ┌────────────┐ │
                    │  Member submits   │      │  │ report_id  │ │
                    │  report with      │─────▶│  │ content_hash│ │
                    │  SAME secret      │  ZK  │  │ severity   │ │
                    │  (never revealed) │ proof│  │ status     │ │
                    └───────────────────┘      │  └────────────┘ │
                                               │                 │
                         Identity: HIDDEN       │  Reporter: ???   │
                                               └────────────────┘
```

1. **Admin registers** an organization on-chain
2. **Member clicks "Join"** — enters a private secret, the ZK circuit hashes it with BHP256 and stores only the hash. One click, no terminal needed.
3. **Member submits a report** — enters the same secret. The circuit hashes it again, verifies the hash matches a registered member, and publishes the report with zero identity linkage.
4. **Admin reviews** reports and updates status (Open → Reviewing → Resolved)

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

**Privacy caveat:** The transaction fee payer address is visible (inherent to Aleo). In production, a relayer service would pay fees on behalf of reporters for full anonymity.

---

## Deployed Program

- **Program ID:** `zkwhistle_kumar_v2.aleo`
- **Network:** Aleo Testnet
- **Deployment TX:** `at1uug89x2cqs7dqaznve0dz2wfeyuyyw9q36gul2scz9g5kjql4q8qa32uju`
- **Live Site:** [zk-whistle-rouge.vercel.app](https://zk-whistle-rouge.vercel.app/)

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
| `join_org(org_id, member_secret)` | Anyone | Join org — ZK hashes secret on-chain. One click. |
| `add_member(org_id, member_hash)` | Admin | Add a member by hash (advanced) |
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
| Wallet | Leo Wallet (via @demox-labs wallet adapters) |
| Styling | Custom CSS — dark investigative theme |
| Fonts | Crimson Pro (serif) + Source Code Pro (mono) |
| API | Provable Explorer API for on-chain mapping queries |
| Hosting | Vercel |

---

## Project Structure

```
zkwhistle/
├── zkwhistle_program/          # Leo smart contract
│   ├── src/
│   │   └── main.leo            # Full program with 6 transitions
│   ├── program.json
│   └── .env
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Navigation + wallet connect
│   │   ├── Dashboard.jsx       # Hero + live stats + activity feed + saved data
│   │   ├── RegisterOrg.jsx     # Organization registration
│   │   ├── AddMember.jsx       # Join org (one click) + admin add member
│   │   ├── SubmitReport.jsx    # Anonymous report submission
│   │   ├── ViewReports.jsx     # Report/org lookup + status updates
│   │   ├── ConnectScreen.jsx   # Wallet connection prompt
│   │   └── Footer.jsx
│   ├── utils/
│   │   ├── aleo.js             # Provable API helpers + struct parser
│   │   ├── storage.js          # localStorage auto-save for IDs/secrets
│   │   └── TxPoll.jsx          # Transaction status polling
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

---

## Setup & Run

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Leo](https://developer.aleo.org/getting_started/) v3.4.0+ (for contract deployment only)
- [Leo Wallet](https://www.leo.app/) browser extension

### Run Frontend

```bash
cd zkwhistle
npm install
npm run dev
```

Open `http://localhost:5173` and connect your Leo Wallet.

### Deploy Your Own (Optional)

```bash
cd zkwhistle_program
leo build
leo deploy --network testnet --broadcast
```

Update `PROGRAM_ID` in `src/utils/aleo.js` with your program name.

---

## UX Features

- **Auto-save** — all Org IDs, Report IDs, member secrets saved to localStorage
- **Quick-fill buttons** — one click to fill any form field from saved data
- **TX status polling** — live progress bar after every transaction
- **Activity feed** — timestamped log of all actions on Dashboard
- **One-click join** — members join with `join_org` transition, no terminal needed
- **Skeleton loading** — animated placeholders while data loads

---

## Demo Flow

1. **Register Org** → enter name → approve → Org ID auto-saved
2. **Join Organization** → quick-fill org → generate secret → approve → ZK hashes secret on-chain
3. **Submit Report** → quick-fill org + secret → type report → select severity → approve → anonymous report published
4. **View Reports** → quick-fill saved report → search → see on-chain data (no reporter address)
5. **Dashboard** → live stats + activity feed + saved data summary

---

## Why Aleo?

1. **Private inputs to transitions** — the member's secret is a private input that only exists inside the ZK proof
2. **On-chain verification without exposure** — BHP256 hash check happens inside the ZK circuit
3. **No metadata leakage** — reporter's address is not part of the report data structure
4. **Programmable privacy** — admins update report status publicly while reporter identity stays hidden

---

## Use Cases

- **Corporate whistleblowing** — employees report fraud without fear of retaliation
- **Government transparency** — civil servants expose corruption with proof of insider status
- **Academic integrity** — university members report research misconduct anonymously
- **Healthcare reporting** — medical staff report safety concerns without career risk
- **DAO governance** — token holders raise concerns without social pressure

---

## Future Improvements

- Relayer service for fee payment (full address anonymity)
- Encrypted report content (stored off-chain, hash on-chain)
- Time-locked report reveals
- Reward mechanism for verified reports
- IPFS integration for report attachments

---

## Built For

**Aleo Privacy Buildathon — Wave 2**

*Because truth shouldn't require sacrifice.*

---

## License

MIT