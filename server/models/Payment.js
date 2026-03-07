import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  lease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease',
    required: false  // Not required initially for security deposits (linked after lease creation)
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentType: {
    type: String,
    enum: ['rent', 'security-deposit', 'maintenance', 'utilities', 'other'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['khalti', 'esewa', 'cash', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Payment gateway details
  transactionId: String,
  paymentGatewayResponse: mongoose.Schema.Types.Mixed,
  
  // Month/period this payment is for
  paymentFor: {
    month: Date,
    description: String
  },
  
  // Receipt
  receipt: {
    url: String,
    public_id: String,
    receiptNumber: String
  },
  
  // Dates
  dueDate: Date,
  paidAt: Date,
  
  // Late payment
  isLate: {
    type: Boolean,
    default: false
  },
  lateFee: {
    type: Number,
    default: 0
  },
  
  // Refund
  refundReason: String,
  refundedAt: Date,
  
  notes: String
}, {
  timestamps: true
});

// Generate receipt number
paymentSchema.pre('save', function(next) {
  if (!this.receipt.receiptNumber && this.status === 'completed') {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.receipt.receiptNumber = `RCP-${timestamp}-${random}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
