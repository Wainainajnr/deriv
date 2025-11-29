# **App Name**: DerivEdge

## Core Features:

- Deriv OAuth Login: Secure OAuth login flow for Deriv, fetching account details and balances upon authentication.
- Real-Time Even/Odd Analysis: Analyze incoming Deriv ticks in real time to calculate and display Even/Odd digit percentages, pattern dominance, visual chart (digit frequency 0–9), and signal strength indicator.
- Automated Trade Execution Tool: Enable automated trades on the Deriv platform for the logged-in user. Based on current trends and LLM, a suggestion is made regarding placing an Even/Odd trade. User can accept or reject suggestion.
- Account Balance Display: Display real and demo account balances, currency, login ID, and account type with real-time updates.
- Trade Execution: Execute trades via the Deriv WebSocket API, supporting Even/Odd digit contracts, stake amount selection, duration (1 tick), and symbol selection, displaying purchase price, contract ID, payout, profit/loss, and contract status.
- Dashboard: Dashboard with a live tick chart, last digit display, digit frequency chart, pattern sequence display, Even vs Odd percentage gauges, entry signal indicator, trade history panel, and active contract status panel.
- Secure Data Handling: Securely store the authentication token and other potentially sensitive information within client-side storage, and make requests using the user-supplied information when necessary.

## Style Guidelines:

- Primary color: Neon green (#39FF14), reflecting the excitement of trading.
- Background color: Dark gray (#222222), for a modern and focused look.
- Accent color: Electric blue (#7DF9FF), complementing the green and adding a high-tech feel.
- Body and headline font: 'Space Grotesk' sans-serif, for a computerized and techy feel.
- Code font: 'Source Code Pro', for displaying any relevant code snippets.
- Use minimalistic icons that provide easy visual cues.
- Smooth, subtle animations with Framer Motion to highlight real-time updates and enhance user experience.