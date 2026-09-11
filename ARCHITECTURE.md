# STATUSFLOW GAMING — ARCHITECTURE

## 1. Purpose

This document describes the intended architecture of StatusFlow Gaming.

The goal is to keep the system:

- secure
- modular
- scalable
- easy to maintain
- compatible with the wider StatusFlow platform

The architecture must prevent clients from controlling rewards or other sensitive game outcomes.

---

# 2. High-Level Architecture

The system is divided into several major layers:

```text
User
  |
  v
Browser / Mobile UI
  |
\Next.js Application
  |
  +----------------------+
  |                      |
  v                      v
Game Engine         Server Actions
  |                      |
  +----------+-----------+
             |
             v
        Supabase
             |
      +------+------+
      |             |
      v             v
   Database      Auth/Storage
      |
      v
SFP Wallet / Ledger
