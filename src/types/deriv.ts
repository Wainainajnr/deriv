export interface DerivAccount {
  account_category: 'real' | 'demo';
  account_type: string;
  created_at: number;
  currency: string;
  is_disabled: 0 | 1;
  is_virtual: 0 | 1;
  landing_company_name: string;
  loginid: string;
}

export interface AuthorizeResponse {
  authorize: {
    account_list: DerivAccount[];
    balance: number;
    country: string;
    currency: string;
    email: string;
    fullname: string;
    is_virtual: 0 | 1;
    landing_company_fullname: string;
    landing_company_name: string;
    local_currencies: Record<string, any>;
    loginid: string;
    preferred_language: string;
    scopes: string[];
    trading_hub: any;
    user_id: number;
  };
  echo_req: Record<string, any>;
  msg_type: 'authorize';
}

export interface BalanceResponse {
  balance: {
    balance: number;
    currency: string;
    id: string;
    loginid: string;
    total: {
      deriv: number;
      deriv_demo: number;
      mt5: number;
      mt5_demo: number;
    };
  };
  echo_req: Record<string, any>;
  msg_type: 'balance';
  subscription: {
    id: string;
  };
}

export interface TickResponse {
    tick: {
        ask: number;
        bid: number;
        epoch: number;
        id: string;
        pip_size: number;
        quote: number;
        symbol: string;
    },
    echo_req: Record<string, any>;
    msg_type: 'tick';
    subscription: {
        id: string;
    }
}

export interface ProposalResponse {
    proposal: {
        ask_price: number;
        date_start: number;
        display_value: string;
        id: string;
        longcode: string;
        payout: number;
        spot: number;
        spot_time: number;
    };
    echo_req: Record<string, any>;
    msg_type: 'proposal';
}

export interface BuyResponse {
    buy: {
        balance_after: number;
        buy_price: number;
        contract_id: number;
        longcode: string;
        payout: number;
        purchase_time: number;
        shortcode: string;
        start_time: number;
        transaction_id: number;
    };
    echo_req: Record<string, any>;
    msg_type: 'buy';
}

export interface TransactionResponse {
    transaction: {
        action: 'buy' | 'sell';
        amount: number;
        balance_after: number;
        barrier: string;
        contract_id: number;
        currency: string;
        date_expiry: number;
        display_name: string;
        longcode: string;
        payout: number;
        purchase_time: number;
        shortcode: string;
        symbol: string;
        transaction_id: number;
        transaction_time: number;
    },
    echo_req: Record<string, any>;
    msg_type: 'transaction';
}


export interface OpenContract {
    contract_id: number;
    buy_price: number;
    payout: number;
    contract_type: string;
    currency: string;
    current_spot: number;
    current_spot_time: number;
    entry_spot: number;
    entry_tick_time: number;
    expiry_time: number;
    is_expired: 0 | 1;
    is_settleable: 0 | 1;
    is_sold: 0 | 1;
    is_valid_to_sell: 0 | 1;
    longcode: string;
    profit: number;
    profit_percentage: number;
    purchase_time: number;
    shortcode: string;
    status: 'won' | 'lost' | 'open';
    transaction_ids: { buy: number; sell?: number };
    underlying: string;
    validation_error?: string;
}

export interface PortfolioResponse {
    portfolio: {
        contracts: OpenContract[];
    };
    echo_req: Record<string, any>;
    msg_type: 'portfolio';
}

export type DerivMessage = 
    | AuthorizeResponse
    | BalanceResponse
    | TickResponse
    | ProposalResponse
    | BuyResponse
    | TransactionResponse
    | PortfolioResponse
    | { msg_type: 'ping' }
    | { error: Record<string, any>, msg_type: string };
