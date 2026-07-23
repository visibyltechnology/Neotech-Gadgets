import { useState, useRef, useEffect, useCallback } from 'react';

const TERMS_CONTENT = (
  <div className="space-y-6 text-sm text-gray-700 leading-relaxed font-medium">
    <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-sm p-4">
      <p className="text-amber-800 font-medium text-xs">
        <strong className="font-black">Disclaimer:</strong> This document is tailored to Nigerian consumer and cyber laws for informational purposes and does not constitute formal legal advice. E-commerce in Nigeria is governed by agencies like the <strong>FCCPC</strong> and <strong>NITDA</strong>.
      </p>
    </div>

    <p>Welcome to <strong className="text-gray-900">Mayjay Concepts!</strong> These Terms and Conditions ("Terms") govern your use of our website at <strong>https://www.mayjay-electronics.com.ng</strong> and the purchase of any electronics or products from us. By accessing the Site or purchasing a product, you agree to be bound by these Terms.</p>

    {[
      {
        n: '1', title: 'Eligibility & Account Security',
        body: 'By using this Site, you represent that you are at least 18 years of age or accessing the Site under the supervision of a parent or legal guardian. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.'
      },
      {
        n: '2', title: 'Product Information and Pricing',
        body: 'We strive to be as accurate as possible with product descriptions, technical specifications, and images. However, Mayjay Concepts does not warrant that product descriptions are 100% accurate. In the event of a pricing error, Mayjay Concepts reserves the right to refuse or cancel orders, and if payment has been processed, a full refund will be issued.'
      },
      {
        n: '3', title: 'Payments and Billing',
        body: 'All payments are securely processed through Korapay. We accept Naira debit cards (Visa, MasterCard, Verve), bank transfers, and pay-with-bank options. By submitting an order, you authorize Mayjay Concepts (via Korapay) to charge your designated payment method for the full order amount.'
      },
      {
        n: '4', title: 'Shipping, Delivery, and Risk of Loss',
        body: 'Delivery dates given at checkout are estimates only and cannot be guaranteed. Mayjay Concepts is not liable for delays caused by local dispatch services or factors beyond our control. Risk of loss and title for items pass to you upon our delivery to the courier/logistics partner.'
      },
    ].map(s => (
      <div key={s.n}>
        <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
          <span className="w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">{s.n}</span>
          {s.title}
        </h3>
        <p>{s.body}</p>
      </div>
    ))}

    {/* Highlighted No-Return Section */}
    <div className="border-2 border-red-400 rounded-sm overflow-hidden">
      <div className="bg-red-600 px-4 py-2.5 flex items-center gap-2">
        <i className="fas fa-exclamation-triangle text-white text-sm"></i>
        <h3 className="font-black text-white uppercase tracking-wider text-xs">5. Strict No-Return and No-Refund Policy</h3>
      </div>
      <div className="p-4 bg-red-50 space-y-2">
        <p className="font-bold text-red-800"><strong>Final Sale:</strong> All sales on Mayjay Concepts are final. We enforce a strict No-Return and No-Refund policy once an item has been purchased and successfully dispatched or delivered.</p>
        <p className="text-red-700"><strong>Inspection Upon Delivery:</strong> Customers are strongly advised to inspect their electronics thoroughly at the point of delivery before signing off with the courier.</p>
        <p className="text-red-700"><strong>Manufacturer Warranties:</strong> Mayjay Concepts itself does not provide additional store warranties. For any technical faults discovered after delivery, your sole remedy is to contact the manufacturer's authorized service center in Nigeria.</p>
      </div>
    </div>

    {[
      {
        n: '6', title: 'Intellectual Property',
        body: 'All content on this Site — including text, graphics, logos, images, and software — is the property of Mayjay Concepts or its content suppliers and is protected by Nigerian and international copyright, trademark, and intellectual property laws.'
      },
      {
        n: '7', title: 'Limitation of Liability',
        body: 'To the maximum extent permitted by applicable Nigerian law, Mayjay Concepts shall not be liable for any indirect, incidental, special, consequential, or punitive damages including loss of profits, data, product failure, electrical surges, battery degradation, or personal injury resulting from the use or misuse of electronics purchased through the Site. Our total liability shall not exceed the amount you paid for the specific product in question.'
      },
      {
        n: '8', title: 'User Conduct & Prohibited Uses',
        body: 'You agree not to use the Site for any unlawful purpose, to infringe upon our intellectual property rights, to upload viruses or malicious code, or to engage in fraudulent chargeback schemes via Korapay.'
      },
      {
        n: '9', title: 'Governing Law',
        body: 'These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any legal actions must be brought before courts of competent jurisdiction in Nigeria.'
      },
      {
        n: '10', title: 'Changes to These Terms',
        body: 'Mayjay Concepts reserves the right to update or modify these Terms at any time without prior notice. Your continued use of the Site following any changes constitutes your acceptance of the new Terms.'
      },
    ].map(s => (
      <div key={s.n}>
        <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
          <span className="w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">{s.n}</span>
          {s.title}
        </h3>
        <p>{s.body}</p>
      </div>
    ))}

    <div>
      <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
        <span className="w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">11</span>
        Contact Information
      </h3>
      <p>WhatsApp: <a href="https://wa.me/2347066514355" target="_blank" rel="noreferrer">07066514355</a> | Phone: 09116763595 | Address: Shop 3, Aboderin Shopping Complex, beside California Luxury Hotel and Suites, Agbaje-Orita Challenge, Ibadan.</p>
    </div>

    <div className="bg-gray-100 border border-gray-200 rounded-sm p-4 text-center">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">End of Terms &amp; Conditions — Last Updated May 28, 2026</p>
    </div>
  </div>
);

const PRIVACY_CONTENT = (
  <div className="space-y-6 text-sm text-gray-700 leading-relaxed font-medium">
    <p>Mayjay Concepts ("we", "our", "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information. This policy is aligned with the <strong className="text-gray-900">Nigeria Data Protection Regulation (NDPR)</strong> issued by NITDA.</p>

    {[
      {
        n: '1', title: 'Information We Collect', icon: 'fa-database',
        body: 'We may collect: Identity Data (first name, last name), Contact Data (email address, phone number), Delivery Data (address, state, LGA, landmark), Payment Data (processed securely by Korapay — we do not store card details), Technical Data (IP address, browser type, device data), and Transaction Data (products purchased and payment records).'
      },
      {
        n: '2', title: 'How We Use Your Information', icon: 'fa-cogs',
        body: 'We use your information to: process and fulfill your orders and payments, communicate with you via email and WhatsApp about order status and delivery updates, send OTP verification codes during account creation and phone verification, improve our website and personalize your shopping experience, comply with legal obligations under Nigerian law, and detect and prevent fraudulent transactions.'
      },
      {
        n: '3', title: 'Sharing Your Information', icon: 'fa-share-alt',
        body: 'We do NOT sell your personal data to third parties. We may share your information only with: Korapay (to process payments), logistics and courier partners (to fulfill delivery), WhatsApp Business/Meta (to send order and OTP notifications), Firebase/Google (for secure data storage and authentication), and law enforcement or regulatory bodies (FCCPC, NITDA) if required by law.'
      },
      {
        n: '4', title: 'Data Security', icon: 'fa-lock',
        body: 'We implement appropriate technical and organisational security measures to protect your personal data against accidental loss, unauthorised access, and disclosure. Your account password is hashed and never stored in plain text. Payment data is processed entirely through Korapay\'s PCI-DSS compliant infrastructure — Mayjay Concepts does not store your card details on our servers.'
      },
      {
        n: '5', title: 'Your Rights Under Nigerian Law (NDPR)', icon: 'fa-user-shield',
        body: 'Under the NDPR, you have the right to: request access to the personal data we hold about you, request correction of inaccurate or incomplete data, request erasure of your personal data (subject to legal retention requirements), object to or restrict how we process your data, and lodge a complaint with NITDA if you believe your data rights have been violated. To exercise these rights, contact us at support@mayjay-electronics.com.ng.'
      },
      {
        n: '6', title: 'Cookies', icon: 'fa-cookie',
        body: 'Our website uses session-based storage and local storage (not traditional cookies) to maintain your shopping cart and login state. We do not use tracking cookies for advertising purposes.'
      },
      {
        n: '7', title: "Children's Privacy", icon: 'fa-child',
        body: 'Our Site is not directed at children under 18. We do not knowingly collect personal information from minors. If you believe a child has provided us with personal data, please contact us immediately so we can delete it.'
      },
      {
        n: '8', title: 'Changes to This Policy', icon: 'fa-sync-alt',
        body: 'We may update this Privacy Policy from time to time. The "Last Updated" date at the top of this page reflects the most recent revision. Continued use of the Site after any changes signifies your acceptance of the updated policy.'
      },
    ].map(s => (
      <div key={s.n}>
        <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
          <span className="w-5 h-5 bg-lime-600 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">{s.n}</span>
          <i className={`fas ${s.icon} text-lime-600`}></i>
          {s.title}
        </h3>
        <p>{s.body}</p>
      </div>
    ))}

    <div className="bg-gray-100 border border-gray-200 rounded-sm p-4 text-center">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">End of Privacy Policy — Last Updated May 28, 2026</p>
    </div>
  </div>
);

export default function LegalModal({ type, onClose, onAccept }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef(null);

  const isTerms = type === 'terms';
  const title = isTerms ? 'Terms & Conditions' : 'Privacy Policy';
  const content = isTerms ? TERMS_CONTENT : PRIVACY_CONTENT;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const progress = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
    setScrollProgress(progress);
    if (progress >= 95) {
      setHasScrolledToBottom(true);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', handleScroll, { passive: true });
    return () => { if (el) el.removeEventListener('scroll', handleScroll); };
  }, [handleScroll]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-sm w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-gray-200 ${isTerms ? 'bg-gray-900' : 'bg-lime-600'}`}>
          <div className="flex items-center gap-3">
            <i className={`fas ${isTerms ? 'fa-file-contract' : 'fa-shield-alt'} text-white text-lg`}></i>
            <div>
              <h2 className="text-white font-black uppercase tracking-wider text-sm">{title}</h2>
              <p className="text-gray-300 text-xs font-medium">Last Updated: May 28, 2026</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Scroll Progress Bar */}
        <div className="h-1 bg-gray-100 flex-shrink-0">
          <div
            className={`h-full transition-all duration-300 ${hasScrolledToBottom ? 'bg-green-500' : isTerms ? 'bg-gray-700' : 'bg-lime-600'}`}
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Scroll hint */}
        {!hasScrolledToBottom && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-6 py-2 flex-shrink-0">
            <i className="fas fa-arrow-down text-amber-600 text-xs animate-bounce"></i>
            <span className="text-amber-700 text-xs font-bold uppercase tracking-wider">Please scroll to the bottom to accept</span>
            <i className="fas fa-arrow-down text-amber-600 text-xs animate-bounce"></i>
          </div>
        )}

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          className="flex-grow overflow-y-auto px-6 py-6"
          style={{ overscrollBehavior: 'contain' }}
        >
          {content}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            {hasScrolledToBottom ? (
              <>
                <i className="fas fa-check-circle text-green-500"></i>
                <span className="text-green-700 font-bold">You've read the full document</span>
              </>
            ) : (
              <>
                <i className="fas fa-info-circle text-gray-400"></i>
                <span>{scrollProgress}% read — scroll to the bottom to accept</span>
              </>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-gray-100 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={() => { onAccept(type); onClose(); }}
              disabled={!hasScrolledToBottom}
              className={`flex-1 sm:flex-none px-6 py-2.5 font-black text-xs uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-2 ${
                hasScrolledToBottom
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-md cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <i className={`fas ${hasScrolledToBottom ? 'fa-check-circle' : 'fa-lock'} text-xs`}></i>
              {hasScrolledToBottom ? `I Accept — ${title}` : 'Scroll to Accept'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
