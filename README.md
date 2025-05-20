
# Aloha Card Shop Trade-In System

## Overview
This application helps manage card trade-ins for Aloha Card Shop, providing real-time pricing information and trade value calculations.

## Price Calculation Logic
All business logic for calculating cash and trade values is now centralized in the `/api/calculate-value` endpoint. This provides several benefits:

1. **Centralized logic**: All pricing calculations are handled in a single location
2. **Server-side control**: Pricing rules can be updated without client-side changes
3. **Security**: Business rules are protected from client-side tampering
4. **Consistency**: All parts of the application use the same calculation logic

### How Values Are Set

Card trade values are determined based on the `trade_value_settings` table in the Supabase database, which contains:

- **Game type** (pokemon, magic, japanese-pokemon, etc.)
- **Value ranges** (min_value and max_value)
- **Percentage rules** (cash_percentage and trade_percentage)
- **Fixed values** (fixed_cash_value and fixed_trade_value for special cases)

For each card, the system:
1. Identifies the appropriate game type and value range
2. Applies either percentage-based calculations or fixed values
3. Returns both cash and trade credit values

### Fallback Behavior

If the API cannot determine correct values (due to database issues, missing settings, etc.), it uses fallback percentages defined in `src/constants/fallbackValues.ts`.

## Features

- Real-time market price lookup
- Condition-based price adjustments
- Trade-in list management
- Customer association
- Print receipt functionality
- Admin dashboard for trade value configuration

## Architecture

- Frontend: React + Vite + Tailwind CSS
- Backend: Supabase + Edge Functions
- Data storage: PostgreSQL (via Supabase)
- API Layer: RESTful endpoints for value calculations
