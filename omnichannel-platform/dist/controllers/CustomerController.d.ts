import { Request, Response } from 'express';
interface CustomerData {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    document: string;
    status: 'ACTIVE' | 'INACTIVE' | 'DEFAULTER';
    address?: {
        street: string;
        number: string;
        city: string;
        state: string;
        zipCode: string;
    };
    lastInvoice?: {
        id: string;
        amount: number;
        dueDate: string;
        status: 'PAID' | 'PENDING' | 'OVERDUE';
    };
    totalDebt?: number;
    registrationDate: string;
}
interface ERPCustomerResponse {
    success: boolean;
    customer?: CustomerData;
    error?: string;
    message: string;
}
export declare class CustomerController {
    static getCustomerByConversation(req: Request, res: Response): Promise<void>;
    static searchCustomer(req: Request, res: Response): Promise<void>;
    static fetchCustomerFromERP(identifier: string): Promise<ERPCustomerResponse>;
    static getCustomerInvoices(req: Request, res: Response): Promise<void>;
    static getCustomerHistory(req: Request, res: Response): Promise<void>;
    static mapERPStatus(status: string): 'ACTIVE' | 'INACTIVE' | 'DEFAULTER';
    static mapInvoiceStatus(status: string): 'PAID' | 'PENDING' | 'OVERDUE';
}
export {};
//# sourceMappingURL=CustomerController.d.ts.map