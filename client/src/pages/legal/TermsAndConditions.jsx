import { useAppSettingsStore } from '../../store/appSettingsStore'

function TermsAndConditions() {
  const lastUpdated = 'April 13, 2026'
  const { settings } = useAppSettingsStore()

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-slate-50 via-white to-primary-50 min-h-[70vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-6 md:p-10">
          <p className="text-primary-600 text-sm font-semibold uppercase tracking-wide mb-2">Legal</p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Terms and Conditions</h1>
          <p className="text-slate-600 mb-8">Last updated: {lastUpdated}</p>

          <div className="space-y-8 text-slate-700 leading-relaxed">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using {settings.platformName}, you agree to these Terms and Conditions. If you do not agree, please do not use the app.
                These terms apply to all users, including tenants, hosts, and admins.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Platform Purpose</h2>
              <p>
                {settings.platformName} is a rental management platform that helps users discover properties, schedule visits, exchange messages,
                request leases, make deposit or rent payments, and manage maintenance and notifications. {settings.platformName} provides the platform,
                but lease decisions and final agreements remain between the involved users.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Account Registration and Security</h2>
              <p>
                You must provide accurate information at signup and keep your account credentials confidential. You are responsible for
                activities carried out through your account. {settings.platformName} may suspend or restrict accounts involved in fraud, abuse,
                impersonation, or policy violations.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Roles and Responsibilities</h2>
              <p>
                Tenants are responsible for reviewing property details and lease terms carefully before making requests or payments.
                Hosts are responsible for posting truthful property information, lawful rental terms, and timely responses.
                Admins may review reports, user activity, and verification status to keep the platform safe and reliable.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Property Listings and Visit Scheduling</h2>
              <p>
                Hosts must only list properties they are authorized to rent and keep listing details current. Visit requests should be
                handled respectfully and in good faith. Users agree not to misuse visit scheduling features, spam other users,
                or share misleading information.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Lease Requests and Agreements</h2>
              <p>
                Lease workflows in {settings.platformName} are digital tools for managing rental processes. Users are responsible for understanding
                lease duration, rent amount, security deposit, and other obligations before confirming. Where e-signatures or digital
                acceptance are used, users agree that such confirmation is intended to be legally binding under applicable law.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Payments and Transaction Providers</h2>
              <p>
                Payments may be processed through third-party providers such as eSewa and Khalti. {settings.platformName} does not store full payment
                instrument details and is not responsible for downtime, failures, or delays caused by external payment systems.
                Refund eligibility, reversals, and disputes may depend on platform policy, host terms, and payment provider rules.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Messaging, Reviews, and User Conduct</h2>
              <p>
                Users must communicate respectfully and lawfully. Harassment, threats, hate speech, scams, and deceptive behavior are
                prohibited. Reviews should be honest and based on genuine experience. {settings.platformName} may remove content or limit accounts
                that violate community or legal standards.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Maintenance and Notifications</h2>
              <p>
                Maintenance tools and notifications are provided to improve coordination. Delivery of reminders or alerts is not
                guaranteed in all cases due to network, device, or third-party service limitations. Users should still monitor
                important deadlines directly in the app.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Suspension, Termination, and Reporting</h2>
              <p>
                {settings.platformName} may suspend, restrict, or terminate access for policy breaches, misuse, suspected fraud, or legal
                requirements. Users can report abusive behavior or suspicious activity through available reporting channels in the app.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Limitation of Liability</h2>
              <p>
                To the maximum extent allowed by law, {settings.platformName} is not liable for indirect, incidental, or consequential losses arising
                from property disputes, user behavior, off-platform arrangements, payment gateway outages, or force majeure events.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">12. Changes to Terms</h2>
              <p>
                We may update these Terms and Conditions as the platform evolves. Material changes will be reflected by revising the
                last updated date and, where appropriate, by in-app notice. Continued use of {settings.platformName} after changes indicates
                acceptance of the updated terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">13. Contact</h2>
              <p>
                For questions related to these terms, contact us at {settings.supportEmail} or +977 9702004193.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TermsAndConditions
