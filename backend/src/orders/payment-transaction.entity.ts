import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import type { PaymentStatus } from './order.entity';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.paymentTransactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ default: 'PAYTR' })
  provider: string;

  @Column({ name: 'merchant_oid', unique: true })
  merchantOid: string;

  @Column({ default: 'PENDING' })
  status: PaymentStatus;

  @Column({ name: 'request_amount', type: 'numeric', precision: 10, scale: 2 })
  requestAmount: string;

  @Column({
    name: 'paid_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  paidAmount: string | null;

  @Column({ default: 'TRY' })
  currency: string;

  @Column({ name: 'iframe_token', type: 'text', nullable: true })
  iframeToken: string | null;

  @Column({ name: 'payment_type', type: 'text', nullable: true })
  paymentType: string | null;

  @Column({ name: 'provider_transaction_id', type: 'text', nullable: true })
  providerTransactionId: string | null;

  @Column({ name: 'failure_code', type: 'text', nullable: true })
  failureCode: string | null;

  @Column({ name: 'failure_message', type: 'text', nullable: true })
  failureMessage: string | null;

  @Column({ name: 'callback_count', type: 'int', default: 0 })
  callbackCount: number;

  @Column({ name: 'is_test', default: false })
  isTest: boolean;

  @Column({ name: 'raw_request', type: 'jsonb', default: () => "'{}'" })
  rawRequest: Record<string, unknown>;

  @Column({ name: 'raw_response', type: 'jsonb', default: () => "'{}'" })
  rawResponse: Record<string, unknown>;

  @Column({ name: 'raw_callback', type: 'jsonb', default: () => "'{}'" })
  rawCallback: Record<string, unknown>;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
