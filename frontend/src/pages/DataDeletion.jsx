import React from 'react';

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-4">User Data Deletion Instructions</h1>
        <p className="mb-4 text-sm text-gray-500">According to the Facebook Platform and TikTok Developer rules, we provide you the ability to completely scrub your data.</p>
        
        <div className="space-y-6 leading-relaxed">
          <p>
            SocialHub respects your privacy and your right to govern your data. If you wish to permanently delete your account and revoke all access our platform has to your social media accounts, you have two options.
          </p>

          <section className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h2 className="text-xl font-semibold mb-3 text-blue-900">Option 1: In-App Deletion</h2>
            <p className="mb-2">You can instantly disconnect any social profile right from your dashboard:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Log into your SocialHub dashboard at himal.cloud.</li>
              <li>Navigate to the <strong>Accounts</strong> page.</li>
              <li>Find the social media account you wish to remove.</li>
              <li>Click the red <strong>Disconnect</strong> button.</li>
            </ul>
            <p className="mt-3 text-sm">This immediately deletes the access tokens and associated metadata from our database.</p>
          </section>

          <section className="bg-gray-100 border-l-4 border-gray-500 p-6 rounded-r-lg mt-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-900">Option 2: Deletion via Social Platform</h2>
            <p className="mb-2">If you cannot access your SocialHub dashboard, you can revoke access directly from Facebook/Instagram/TikTok:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Log into your Facebook/TikTok account.</li>
              <li>Go to <strong>Settings &amp; Privacy</strong> &gt; <strong>Settings</strong>.</li>
              <li>Locate the <strong>Apps and Websites</strong> or <strong>Security and Login</strong> menu.</li>
              <li>Find <strong>SocialHub</strong> in the list of active apps.</li>
              <li>Click <strong>Remove</strong> to revoke our access instantly.</li>
            </ul>
          </section>

          <section className="mt-8 pt-6 border-t">
            <h2 className="text-xl font-semibold mb-2">Complete Account Deletion</h2>
            <p>
              If you wish to delete your entire SocialHub account (including login email, hashed passwords, and local settings), please send an email from your registered email address to <strong>support@himal.cloud</strong> with the subject line "Account Deletion Request". We will process complete data hygiene within 48 hours.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
