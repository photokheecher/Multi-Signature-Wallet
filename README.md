# Multi-Signature-Wallet
# 🏦 Soroban Multi-Signature Wallet

## 📌 Project Description
<img width="1446" height="907" alt="image" src="https://github.com/user-attachments/assets/bb4c8741-5ea6-4770-8205-dd70c52cc35a" />

This project implements a **Multi-Signature Wallet** smart contract on the Stellar Soroban platform.  
It allows a group of predefined owners to collectively manage funds, requiring a minimum number of approvals before executing any transaction.

This enhances security by eliminating single points of failure and enforcing shared control over assets.

---

## ⚙️ What it does

The contract enables:

- Creation of a wallet with multiple owners
- Submission of transactions (e.g., fund transfers)
- Approval of transactions by owners
- Execution of transactions only after reaching a predefined approval threshold

---

## 🚀 Features

### 🔐 Multi-Owner Control
- Wallet is controlled by multiple addresses
- Only registered owners can approve transactions

### ✅ Threshold-Based Approval
- Transactions require a minimum number of approvals before execution
- Threshold is configurable during initialization

### 📤 Transaction Management
- Submit new transactions
- Approve pending transactions
- Execute transactions once approved

### 📜 On-Chain Transparency
- All transactions and approvals are stored on-chain
- Events are emitted for execution

### ⚡ Lightweight & Efficient
- Built using Soroban SDK
- Optimized for minimal storage and compute usage

---

## 🧱 Smart Contract Functions

| Function        | Description |
|----------------|------------|
| `initialize`   | Set owners and approval threshold |
| `submit_tx`    | Create a new transaction |
| `approve_tx`   | Approve a transaction |
| `execute_tx`   | Execute a transaction after approvals |

---

## 🛠️ Tech Stack

- **Rust**
- **Soroban SDK**
- **Stellar Blockchain**

---

## 🔗 Deployed Smart Contract Link
https://stellar.expert/explorer/testnet/contract/CBCWM2VQ7G4SIUTPIGQSSTHD6WS2TNVN5ZBK6I4S7U77AROL74CMMQDG

---

## 📦 Future Improvements

- Add transaction cancellation
- Support token transfers (not just XLM)
- Add owner management (add/remove owners)
- UI dashboard for transaction tracking
- Gas optimization & batching

---

## 🧪 Testing

To test locally:

```bash
soroban contract build
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/multisig.wasm \
  --source <YOUR_ACCOUNT>
  ```

🤝 Contributing
Pull requests and improvements are welcome! Feel free to fork and enhance the wallet with additional features.

📄 License
MIT License
---
