import Footer from '../components/Footer';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-lime-600 uppercase tracking-widest mb-4">
            <i className="fas fa-shield-alt"></i>
            Legal Document
          </div>
          <h1 className="text-4xl font-display font-black text-gray-900 uppercase tracking-tight mb-3">
            Privacy Policy
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
            <span><i className="fas fa-calendar-alt mr-1.5"></i> Last Updated: May 28, 2026</span>
            <span className="text-gray-300">|</span>
            <span className="text-amber-600 text-xs font-bold bg-amber-50 border border-amber-200 px-2 py-1 rounded-sm uppercase tracking-wider">
              <i className="fas fa-exclamation-triangle mr-1"></i> For Informational Purposes Only
            </span>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-white border border-gray-200 rounded-sm p-6 mb-6 shadow-sm">
          <p className="text-sm text-gray-700 leading-relaxed font-medium">
            Mayjay Concepts ("we", "our", "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website{' '}
            <a href="https://www.mayjay-electronics.com.ng" className="text-lime-600 hover:underline font-bold">https://www.mayjay-electronics.com.ng</a>{' '}
            and make purchases from us.
          </p>
          <p className="text-sm text-gray-700 font-medium mt-3">
            This policy is aligned with the Nigeria Data Protection Regulation (NDPR) issued by NITDA.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              number: '1',
              icon: 'fa-database',
              title: 'Information We Collect',
              content: (
                <>
                  <p className="mb-3 font-semibold text-gray-800">We may collect the following personal information:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: 'fa-user', label: 'Identity Data', desc: 'First name, last name' },
                      { icon: 'fa-envelope', label: 'Contact Data', desc: 'Email address, phone number' },
                      { icon: 'fa-map-marker-alt', label: 'Delivery Data', desc: 'Delivery address, state, LGA, landmark' },
                      { icon: 'fa-credit-card', label: 'Payment Data', desc: 'Processed securely by Korapay — we do not store card details' },
                      { icon: 'fa-mouse-pointer', label: 'Technical Data', desc: 'IP address, browser type, and device data' },
                      { icon: 'fa-shopping-cart', label: 'Transaction Data', desc: 'Details of products purchased and payment records' },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-sm p-3">
                        <div className="w-8 h-8 bg-zeal-dark rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className={`fas ${item.icon} text-white text-xs`}></i>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs uppercase tracking-wider">{item.label}</p>
                          <p className="text-gray-600 text-xs font-medium mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            },
            {
              number: '2',
              icon: 'fa-cogs',
              title: 'How We Use Your Information',
              content: (
                <>
                  <p className="mb-3">We use the information we collect to:</p>
                  <ul className="space-y-2">
                    {[
                      'Process and fulfill your orders and payments.',
                      'Communicate with you via email and WhatsApp about order status and delivery updates.',
                      'Send you your OTP verification codes during account creation and phone verification.',
                      'Improve our website and personalize your shopping experience.',
                      'Comply with legal obligations under Nigerian law.',
                      'Detect and prevent fraudulent transactions.',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <i className="fas fa-check-circle text-green-500 mt-0.5 flex-shrink-0"></i>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )
            },
            {
              number: '3',
              icon: 'fa-share-alt',
              title: 'Sharing Your Information',
              content: (
                <>
                  <p className="mb-3">We do <strong className="text-red-600">not sell</strong> your personal data to third parties. We may share your information with:</p>
                  <ul className="space-y-2">
                    {[
                      'Korapay — to securely process your payments.',
                      'Logistics and courier partners — to fulfill your delivery.',
                      'WhatsApp Business (Meta) — to send you order and OTP notifications.',
                      'Firebase (Google) — for secure data storage and authentication.',
                      'Law enforcement or regulatory bodies (e.g., FCCPC, NITDA) — if required by law.',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <i className="fas fa-angle-right text-lime-600 mt-0.5 flex-shrink-0"></i>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )
            },
            {
              number: '4',
              icon: 'fa-lock',
              title: 'Data Security',
              content: (
                <p>We implement appropriate technical and organisational security measures to protect your personal data against accidental loss, unauthorised access, and disclosure. Your account password is hashed and never stored in plain text. Payment data is processed entirely through Korapay's PCI-DSS compliant infrastructure — Mayjay Concepts does not store your card details on our servers.</p>
              )
            },
            {
              number: '5',
              icon: 'fa-user-shield',
              title: 'Your Rights Under Nigerian Law (NDPR)',
              content: (
                <>
                  <p className="mb-3">Under the Nigeria Data Protection Regulation (NDPR), you have the right to:</p>
                  <ul className="space-y-2">
                    {[
                      'Request access to the personal data we hold about you.',
                      'Request correction of inaccurate or incomplete data.',
                      'Request erasure of your personal data (subject to legal retention requirements).',
                      'Object to or restrict how we process your data.',
                      'Lodge a complaint with NITDA if you believe your data rights have been violated.',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <i className="fas fa-check-circle text-blue-500 mt-0.5 flex-shrink-0"></i>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm">To exercise any of these rights, message us on WhatsApp: <a href="https://wa.me/2347066514355" target="_blank" rel="noreferrer" className="text-green-600 hover:underline font-bold">07066514355</a> or call <strong>09116763595</strong>.</p>
                </>
              )
            },
            {
              number: '6',
              icon: 'fa-cookie',
              title: 'Cookies',
              content: (
                <p>Our website may use session-based storage and local storage (not traditional cookies) to maintain your shopping cart and login state. We do not use tracking cookies for advertising purposes.</p>
              )
            },
            {
              number: '7',
              icon: 'fa-child',
              title: "Children's Privacy",
              content: (
                <p>Our Site is not directed at children under 18. We do not knowingly collect personal information from minors. If you believe a child has provided us with personal data, please contact us immediately so we can delete it.</p>
              )
            },
            {
              number: '8',
              icon: 'fa-sync-alt',
              title: 'Changes to This Policy',
              content: (
                <p>We may update this Privacy Policy from time to time. The "Last Updated" date at the top of this page reflects the most recent revision. Continued use of the Site after any changes signifies your acceptance of the updated policy.</p>
              )
            },
            {
              number: '9',
              icon: 'fa-envelope',
              title: 'Contact Us',
              content: (
                <>
                  <p className="mb-3">For any questions about this Privacy Policy or your personal data, contact our Data Protection Officer:</p>
                  <ul className="space-y-1.5 text-sm font-medium">
                    <li><i className="fab fa-whatsapp mr-2 text-green-500"></i><strong>WhatsApp:</strong> <a href="https://wa.me/2347066514355" target="_blank" rel="noreferrer" className="text-green-600 hover:underline font-bold">07066514355</a> | <span className="font-medium">09116763595</span></li>
                    <li><i className="fas fa-map-marker-alt mr-2 text-lime-600"></i><strong>Address:</strong> Shop 3, Aboderin Shopping Complex, beside California Luxury Hotel and Suites, Agbaje-Orita Challenge, Ibadan.</li>
                  </ul>
                </>
              )
            },
          ].map(section => (
            <div key={section.number} className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-lime-600 flex items-center justify-center text-xs font-black flex-shrink-0 text-white">
                  {section.number}
                </span>
                <div className="flex items-center gap-2">
                  <i className={`fas ${section.icon} text-lime-600 text-xs`}></i>
                  <h2 className="font-black text-gray-900 uppercase tracking-wider text-sm">{section.title}</h2>
                </div>
              </div>
              <div className="p-6 text-sm text-gray-700 leading-relaxed font-medium">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
