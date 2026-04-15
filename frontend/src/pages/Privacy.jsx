import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-4">Privacy Policy</h1>
        <p className="mb-4 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
            <p>
              When you use SocialHub, we collect information you provide directly to us, such as when you create or modify your account. When you connect third-party platforms (such as Facebook, Instagram, or TikTok), we access basic profile information, page access tokens, and the ability to publish content on your behalf in accordance with the permissions you grant us through those platforms' authorization screens.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to operate, maintain, and provide the features of SocialHub. This includes scheduling posts, retrieving basic analytics regarding the performance of your posts, and maintaining the secure connection between our platform and your social accounts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Third-Party Services</h2>
            <p>
              Our application utilizes third-party APIs (Facebook Graph API, TikTok API, etc.). We do not sell your personal data or social media data to advertisers. The access we hold is strictly used to process the commands (like creating a post) initiated by you within the dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including securely encrypting your connection and storing API access tokens securely. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at support@himal.cloud.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
