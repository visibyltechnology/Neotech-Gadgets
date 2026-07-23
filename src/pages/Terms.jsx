import Footer from '../components/Footer';

export default function Terms() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-zeal-red uppercase tracking-widest mb-4">
            <i className="fas fa-file-contract"></i>
            Legal Document
          </div>
          <h1 className="text-4xl font-display font-black text-gray-900 uppercase tracking-tight mb-3">
            Terms & Conditions
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
            <span><i className="fas fa-calendar-alt mr-1.5"></i> Last Updated: May 28, 2026</span>
            <span className="text-gray-300">|</span>
            <span className="text-amber-600 text-xs font-bold bg-amber-50 border border-amber-200 px-2 py-1 rounded-sm uppercase tracking-wider">
              <i className="fas fa-exclamation-triangle mr-1"></i> For Informational Purposes Only — Not Legal Advice
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-sm p-5 mb-10">
          <p className="text-sm text-amber-800 font-medium leading-relaxed">
            <strong className="font-black">Disclaimer:</strong> This document is tailored to Nigerian consumer and cyber laws for informational purposes and does not constitute formal legal advice. E-commerce in Nigeria is governed by agencies like the <strong>FCCPC</strong> (Federal Consumer Protection Commission) and <strong>NITDA</strong> (National Information Technology Development Agency). You should have a legal professional review this final draft to ensure it perfectly aligns with your specific operations.
          </p>
        </div>

        {/* Intro */}
        <div className="bg-white border border-gray-200 rounded-sm p-6 mb-6 shadow-sm">
          <p className="text-sm text-gray-700 leading-relaxed font-medium">
            Welcome to <strong className="text-gray-900">Mayjay Concepts!</strong> These Terms and Conditions ("Terms") govern your use of our website located at{' '}
            <a href="https://www.mayjay-electronics.com.ng" className="text-lime-600 hover:underline font-bold">https://www.mayjay-electronics.com.ng</a>{' '}
            (the "Site") and the purchase of any electronics or products from us.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed font-medium mt-3">
            By accessing the Site or purchasing a product, you agree to be bound by these Terms. If you do not agree, please do not use our Site.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {[
            {
              number: '1',
              title: 'Eligibility & Account Security',
              content: (
                <>
                  <p className="mb-3"><strong className="text-gray-900">Age Requirement:</strong> By using this Site, you represent that you are at least 18 years of age or accessing the Site under the supervision of a parent or legal guardian.</p>
                  <p><strong className="text-gray-900">Account Accuracy:</strong> If you create an account, you are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information.</p>
                </>
              )
            },
            {
              number: '2',
              title: 'Product Information and Pricing',
              content: (
                <>
                  <p className="mb-3"><strong className="text-gray-900">Electronics Specifications:</strong> We strive to be as accurate as possible with product descriptions, technical specifications, and images. However, Mayjay Concepts does not warrant that product descriptions or other content are 100% accurate, complete, or error-free.</p>
                  <p className="mb-3"><strong className="text-gray-900">Pricing Errors:</strong> In the event that a product is listed at an incorrect price due to a typographical or system error, Mayjay Concepts reserves the right to refuse or cancel any orders placed for the product listed at the incorrect price, even if the order has been confirmed and your payment processed. If your payment has been processed, we will issue a full refund.</p>
                  <p><strong className="text-gray-900">Availability:</strong> All products are subject to availability, and we reserve the right to limit quantities or discontinue products at any time without notice.</p>
                </>
              )
            },
            {
              number: '3',
              title: 'Payments and Billing',
              content: (
                <>
                  <p className="mb-3"><strong className="text-gray-900">Payment Methods:</strong> All payments on our platform are securely processed through <strong>Korapay</strong>. We accept Naira debit cards (Visa, MasterCard, Verve), bank transfers, and pay-with-bank options.</p>
                  <p><strong className="text-gray-900">Authorization:</strong> By submitting an order, you authorize Mayjay Concepts (via Korapay) to charge your designated payment method for the total amount of your order, including applicable taxes (such as VAT) and delivery fees.</p>
                </>
              )
            },
            {
              number: '4',
              title: 'Shipping, Delivery, and Risk of Loss',
              content: (
                <>
                  <p className="mb-3"><strong className="text-gray-900">Shipping Estimates:</strong> Delivery dates given at checkout are estimates only and cannot be guaranteed. Mayjay Concepts is not liable for delays caused by local dispatch services, interstate logistics tracking issues, or factors beyond our control.</p>
                  <p><strong className="text-gray-900">Risk of Loss:</strong> All physical items purchased from Mayjay Concepts are made pursuant to a shipment contract. The risk of loss and title for such items pass to you upon our delivery to the courier/logistics partner.</p>
                </>
              )
            },
            {
              number: '5',
              title: 'Strict No-Return and No-Refund Policy',
              highlight: true,
              content: (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-4">
                    <p className="text-red-800 font-bold text-sm"><i className="fas fa-exclamation-circle mr-2"></i>All sales on Mayjay Concepts are final. We enforce a strict No-Return and No-Refund policy once an item has been purchased and successfully dispatched or delivered.</p>
                  </div>
                  <p className="mb-3"><strong className="text-gray-900">Inspection Upon Delivery:</strong> Customers are strongly advised to inspect their electronics thoroughly at the point of delivery before signing off with the courier.</p>
                  <p><strong className="text-gray-900">Manufacturer Warranties:</strong> Many electronics sold on Mayjay Concepts come with an official manufacturer's warranty. Mayjay Concepts itself does not provide additional store warranties. For any technical faults or defects discovered after delivery, your sole remedy is to contact the manufacturer's authorized service center in Nigeria under their warranty terms.</p>
                </>
              )
            },
            {
              number: '6',
              title: 'Intellectual Property',
              content: (
                <p>All content on this Site — including text, graphics, logos, button icons, images, digital downloads, and software — is the property of Mayjay Concepts or its content suppliers and is protected by Nigerian and international copyright, trademark, and intellectual property laws.</p>
              )
            },
            {
              number: '7',
              title: 'Limitation of Liability',
              content: (
                <>
                  <p className="mb-3">To the maximum extent permitted by applicable Nigerian law, Mayjay Concepts, its directors, employees, or affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:</p>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-600 font-medium pl-2 mb-3">
                    <li>Loss of profits, data, use, or goodwill.</li>
                    <li>Product failure, electrical surges, battery degradation, or personal injury resulting from the use or misuse of electronics purchased through the Site.</li>
                  </ul>
                  <p>Our total liability for any claim arising out of these Terms shall not exceed the amount you paid to Mayjay Concepts for the specific product in question.</p>
                </>
              )
            },
            {
              number: '8',
              title: 'User Conduct & Prohibited Uses',
              content: (
                <p>You agree not to use the Site for any unlawful purpose, to infringe upon our intellectual property rights, to upload viruses or malicious code, or to engage in fraudulent chargeback schemes via Korapay.</p>
              )
            },
            {
              number: '9',
              title: 'Governing Law',
              content: (
                <p>These Terms and any dispute arising out of your use of the Site or purchase of products shall be governed by and construed in accordance with the laws of the <strong>Federal Republic of Nigeria</strong>, without regard to its conflict of law principles. Any legal actions must be brought before courts of competent jurisdiction in Nigeria.</p>
              )
            },
            {
              number: '10',
              title: 'Changes to These Terms',
              content: (
                <p>Mayjay Concepts reserves the right to update or modify these Terms at any time without prior notice. The "Last Updated" date at the top of this page will indicate when changes were made. Your continued use of the Site following any changes constitutes your acceptance of the new Terms.</p>
              )
            },
            {
              number: '11',
              title: 'Contact Information',
              content: (
                <>
                  <p className="mb-3">If you have any questions or concerns regarding these Terms, please contact us:</p>
                  <ul className="space-y-1.5 text-sm font-medium">
                    <li><i className="fab fa-whatsapp mr-2 text-green-500"></i><strong>WhatsApp:</strong> <a href="https://wa.me/2347066514355" target="_blank" rel="noreferrer" className="text-green-600 hover:underline font-bold">07066514355</a> | <span className="font-medium">09116763595</span></li>
                    <li><i className="fas fa-map-marker-alt mr-2 text-lime-600"></i><strong>Address:</strong> Shop 3, Aboderin Shopping Complex, beside California Luxury Hotel and Suites, Agbaje-Orita Challenge, Ibadan.</li>
                  </ul>
                </>
              )
            },
          ].map(section => (
            <div key={section.number} className={`bg-white border rounded-sm shadow-sm overflow-hidden ${section.highlight ? 'border-red-200' : 'border-gray-200'}`}>
              <div className={`px-6 py-4 border-b flex items-center gap-3 ${section.highlight ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${section.highlight ? 'bg-red-600 text-white' : 'bg-zeal-dark text-white'}`}>
                  {section.number}
                </span>
                <h2 className="font-black text-gray-900 uppercase tracking-wider text-sm">{section.title}</h2>
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
