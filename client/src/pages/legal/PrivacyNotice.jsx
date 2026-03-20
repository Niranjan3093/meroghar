function PrivacyNotice() {
  const lastUpdated = 'April 13, 2026'

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-slate-50 via-white to-primary-50 min-h-[70vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-6 md:p-10">
          <p className="text-primary-600 text-sm font-semibold uppercase tracking-wide mb-2">Legal</p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-600 mb-8">Last updated: {lastUpdated}</p>

          <div className="space-y-8 text-slate-700 leading-relaxed">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Information We Collect</h2>
              <p>
                We collect information you provide directly, such as name, email, phone number, account role (tenant, host, or admin),
                profile details, listing content, lease request data, maintenance reports, messages, and support communication.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Rental and Transaction Data</h2>
              <p>
                To support rental workflows, we process data related to property listings, visit scheduling, lease status,
                payment records, notifications, and activity timestamps. For transactions, payment processing is handled by integrated
                providers such as Khalti and eSewa, and we retain only the details required for confirmation, reconciliation,
                and receipts.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">3. How We Use Your Data</h2>
              <p>
                We use data to provide core app functionality, verify accounts and listings, prevent fraud, improve security,
                deliver reminders and service notifications, support customer requests, and analyze platform performance.
                We also use data to enforce policies and legal obligations.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Legal Basis and Consent</h2>
              <p>
                We process personal data based on contract performance, legitimate interests, legal obligations, and your consent,
                depending on the purpose. Where consent is required, you may withdraw it as allowed by law, though some features may
                become unavailable.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Sharing of Information</h2>
              <p>
                We share only necessary data with service providers that support hosting, messaging, payments, notifications,
                analytics, and security operations. We may disclose information when required by law, court order, or to protect
                user safety, rights, and platform integrity.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Messages and Communication</h2>
              <p>
                In-app conversations and communication metadata may be stored to enable chat functionality, dispute handling,
                abuse prevention, and service quality monitoring. Users should avoid sharing unnecessary sensitive data in messages.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Cookies and Technical Data</h2>
              <p>
                We may use session tools and technical logs to authenticate users, maintain secure sessions, diagnose issues,
                and improve reliability. This can include device, browser, and request metadata.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Data Retention</h2>
              <p>
                We keep personal data only as long as needed for operational purposes, legal compliance, dispute resolution,
                fraud prevention, and recordkeeping obligations. Retention periods may vary by data category and local law.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Security Measures</h2>
              <p>
                We implement administrative, technical, and organizational safeguards to protect personal data. While we take
                reasonable steps to secure systems, no online service can guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Your Rights</h2>
              <p>
                Depending on applicable law, you may have rights to access, correct, update, delete, or restrict processing of your
                personal data, and to request a copy of certain information. You may also object to specific processing activities.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Children's Privacy</h2>
              <p>
                MeroGhar is intended for users who are legally permitted to enter rental agreements. We do not knowingly collect
                personal data from children where prohibited by law.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">12. Policy Updates</h2>
              <p>
                We may update this Privacy Policy to reflect legal, technical, or product changes. The last updated date will be
                revised whenever important changes are made.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">13. Contact Us</h2>
              <p>
                For privacy questions or requests, contact us at deuza@meroghar.com, +977 9702004193, or visit us in Itahari, Nepal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PrivacyNotice
