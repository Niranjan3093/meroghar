// Generate HTML receipt for payments
export const generatePaymentReceipt = (payment, leaseRequest) => {
  const receiptDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const paymentDate = new Date(payment.paidAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt - ${payment._id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f5f5f5;
          padding: 20px;
        }
        
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .receipt-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        
        .receipt-header h1 {
          font-size: 32px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        
        .receipt-header p {
          font-size: 16px;
          opacity: 0.9;
        }
        
        .receipt-body {
          padding: 40px 30px;
        }
        
        .receipt-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
          padding-bottom: 30px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .info-section h3 {
          color: #667eea;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
          font-weight: 600;
        }
        
        .info-section p {
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .info-section strong {
          font-weight: 600;
          color: #1f2937;
        }
        
        .payment-details {
          background: #f9fafb;
          padding: 25px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .payment-details h2 {
          color: #1f2937;
          font-size: 20px;
          margin-bottom: 20px;
          font-weight: 600;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-row label {
          color: #6b7280;
          font-size: 14px;
        }
        
        .detail-row span {
          color: #1f2937;
          font-weight: 500;
          font-size: 14px;
        }
        
        .amount-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 30px;
        }
        
        .amount-section h3 {
          font-size: 16px;
          margin-bottom: 10px;
          opacity: 0.9;
          letter-spacing: 1px;
        }
        
        .amount-section .amount {
          font-size: 42px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .status-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-top: 10px;
        }
        
        .receipt-footer {
          text-align: center;
          padding: 30px;
          background: #f9fafb;
          border-top: 2px solid #e5e7eb;
        }
        
        .receipt-footer p {
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 8px;
        }
        
        .receipt-footer strong {
          color: #1f2937;
        }
        
        .notes {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin-top: 20px;
          border-radius: 4px;
        }
        
        .notes h4 {
          color: #92400e;
          font-size: 14px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .notes p {
          color: #78350f;
          font-size: 13px;
          line-height: 1.5;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .receipt-container {
            box-shadow: none;
            max-width: 100%;
          }
          
          .no-print {
            display: none;
          }
        }
        
        @media (max-width: 768px) {
          .receipt-info {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .amount-section .amount {
            font-size: 32px;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="receipt-header">
          <h1>🏠 MeroGhar</h1>
          <p>Payment Receipt</p>
        </div>
        
        <div class="receipt-body">
          <div class="receipt-info">
            <div class="info-section">
              <h3>Receipt Information</h3>
              <p><strong>Receipt No:</strong> ${payment._id.toString().toUpperCase().substring(0, 12)}</p>
              <p><strong>Receipt Date:</strong> ${receiptDate}</p>
              <p><strong>Payment Date:</strong> ${paymentDate}</p>
              <p><strong>Transaction ID:</strong> ${payment.transactionId || 'N/A'}</p>
            </div>
            
            <div class="info-section">
              <h3>Property Details</h3>
              <p><strong>Property:</strong> ${leaseRequest.property.title}</p>
              <p><strong>Address:</strong> ${leaseRequest.property.address?.street || ''}, ${leaseRequest.property.address?.city || ''}</p>
              <p><strong>Move-in Date:</strong> ${new Date(leaseRequest.proposedMoveIn).toLocaleDateString('en-US')}</p>
            </div>
          </div>
          
          <div class="amount-section">
            <h3>AMOUNT PAID</h3>
            <div class="amount">NPR ${payment.amount.toLocaleString()}</div>
            <div class="status-badge">✓ PAID</div>
          </div>
          
          <div class="payment-details">
            <h2>Payment Details</h2>
            <div class="detail-row">
              <label>Payment Type:</label>
              <span>${payment.paymentType === 'security-deposit' ? 'Security Deposit' : payment.paymentType}</span>
            </div>
            <div class="detail-row">
              <label>Payment Method:</label>
              <span>${payment.paymentMethod === 'khalti' ? 'Khalti' : payment.paymentMethod === 'esewa' ? 'eSewa' : payment.paymentMethod}</span>
            </div>
            <div class="detail-row">
              <label>Status:</label>
              <span style="color: #10b981; font-weight: bold;">Completed</span>
            </div>
            <div class="detail-row">
              <label>Paid By:</label>
              <span>${payment.payer?.name || 'Tenant'}</span>
            </div>
            <div class="detail-row">
              <label>Received By:</label>
              <span>${payment.receiver?.name || 'Host'}</span>
            </div>
          </div>
          
          <div class="notes">
            <h4>📌 Important Notes:</h4>
            <p>This receipt confirms the payment of security deposit for the lease agreement. Please keep this receipt for your records. The security deposit will be refunded at the end of the lease term, subject to property inspection and lease terms.</p>
          </div>
        </div>
        
        <div class="receipt-footer">
          <p><strong>MeroGhar Rental Management System</strong></p>
          <p>For any queries regarding this payment, please contact support.</p>
          <p style="margin-top: 15px; font-size: 12px;">This is a computer-generated receipt and does not require a signature.</p>
        </div>
      </div>
      
      <script>
        // Auto print functionality
        window.onload = function() {
          // Uncomment the line below to auto-print when opened
          // window.print();
        }
      </script>
    </body>
    </html>
  `;
};
