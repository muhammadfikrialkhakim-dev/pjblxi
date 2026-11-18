declare module "midtrans-client" {
  interface MidtransClientOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  interface SnapTransactionParameter {
    transaction_details: {
      order_id: string;
      gross_amount: number;
    };
    enabled_payments?: string[];
    customer_details?: {
      first_name?: string;
      email?: string;
      phone?: string;
    };
    item_details?: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
    }>;
    expiry?: {
      unit: "minutes" | "hours" | "days";
      duration: number;
    };
    callbacks?: {
      finish?: string;
    };
  }

  interface SnapTransactionResult {
    token: string;
    redirect_url: string;
  }

  export class Snap {
    constructor(options: MidtransClientOptions);
    createTransaction(parameter: SnapTransactionParameter): Promise<SnapTransactionResult>;
  }

  export class CoreApi {
    constructor(options: MidtransClientOptions);
    transaction: {
      status(orderId: string): Promise<Record<string, unknown>>;
      cancel(orderId: string): Promise<Record<string, unknown>>;
    };
  }

  const midtransClient: { Snap: typeof Snap; CoreApi: typeof CoreApi };
  export default midtransClient;
}
