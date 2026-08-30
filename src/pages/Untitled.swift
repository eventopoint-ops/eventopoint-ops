//
//  Untitled.swift
//  
//
//  Created by Elizaveta Konoshenko on 8/30/26.
//

export default function Privacy() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 20px', fontFamily: 'Barlow, sans-serif', lineHeight: '1.6' }}>
      <h1>Privacy Policy</h1>
      <p><strong>EVENToPOINT.ops</strong></p>
      <p>Last Updated: August 26, 2026</p>
      
      <h2>1. Overview</h2>
      <p>EVENToPOINT.ops ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and otherwise process personal information in connection with our event operations management platform (the "Service").</p>
      
      <h2>2. Information We Collect</h2>
      <h3>A. Information You Provide Directly</h3>
      <ul>
        <li><strong>Account Information:</strong> Name, email address, phone number, organization name, password</li>
        <li><strong>Event Data:</strong> Event details, schedules, vendor information, team member assignments, task lists, notes</li>
        <li><strong>Team Member Data:</strong> Names, email addresses, phone numbers, roles, permissions, assigned tasks</li>
        <li><strong>Vendor Information:</strong> Vendor names, contact details, service descriptions, files, agreements</li>
        <li><strong>Media & Documentation:</strong> Photos, videos, notes, and files uploaded during event operations</li>
      </ul>
      
      <h3>B. Information Collected Automatically</h3>
      <ul>
        <li><strong>Device Information:</strong> Device type, operating system, app version, device identifiers</li>
        <li><strong>Usage Data:</strong> Features accessed, actions taken, time spent, error logs</li>
        <li><strong>Location Data:</strong> If location permissions are enabled, real-time GPS coordinates for on-site logistics and staff tracking</li>
        <li><strong>Log Data:</strong> IP address, timestamps, referring pages</li>
      </ul>
      
      <h3>C. Third-Party Information</h3>
      <ul>
        <li><strong>Google OAuth:</strong> Basic profile information (email, name) if you sign in via Google</li>
        <li><strong>Contact Import:</strong> If you choose to import contacts for team invitations, we access your device contacts temporarily</li>
      </ul>
      
      <h2>3. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li><strong>Deliver the Service:</strong> Create accounts, store events, manage team members, coordinate vendors, track on-site operations</li>
        <li><strong>Improve the Service:</strong> Analyze usage patterns, identify technical issues, develop new features</li>
        <li><strong>Communication:</strong> Send transactional emails (login confirmations, event updates, support responses)</li>
        <li><strong>Compliance:</strong> Enforce our Terms of Service, prevent fraud, protect legal rights</li>
        <li><strong>Location-Based Services:</strong> Enable real-time staff tracking and logistics coordination (with your permission)</li>
        <li><strong>Support:</strong> Respond to customer inquiries and provide technical support</li>
      </ul>
      
      <h2>4. How We Share Your Information</h2>
      <h3>A. Within Your Organization</h3>
      <ul>
        <li><strong>Team Members:</strong> Event organizers and team members can see assigned tasks, roles, and event data</li>
        <li><strong>Shared Access:</strong> Information is visible to users in your organization based on role and permissions</li>
      </ul>
      
      <h3>B. With Service Providers</h3>
      <p>We may share information with third parties who help us operate the Service:</p>
      <ul>
        <li><strong>Supabase:</strong> Our backend database provider (encrypted storage)</li>
        <li><strong>Netlify:</strong> Our hosting and deployment provider</li>
        <li><strong>Google:</strong> If you authenticate via Google OAuth</li>
      </ul>
      
      <h3>C. Legal Requirements</h3>
      <p>We may disclose information if required by law, legal process, or government request.</p>
      
      <h3>D. Business Transfers</h3>
      <p>If we merge, acquire, or sell assets, your information may be transferred as part of that transaction.</p>
      
      <h2>5. Device Permissions</h2>
      <p>EVENToPOINT.ops may request the following permissions:</p>
      
      <h3>A. Camera</h3>
      <p><strong>Purpose:</strong> Allow users to capture photos and videos during events for documentation, media uploads, and real-time event coverage.</p>
      <p><strong>How We Use It:</strong> Photos/videos are stored securely and associated with your event record. Only users with event access can view.</p>
      
      <h3>B. Location</h3>
      <p><strong>Purpose:</strong> Enable real-time GPS tracking of on-site staff and logistics teams for coordination and safety.</p>
      <p><strong>How We Use It:</strong> Location data is used only during active events or when explicitly enabled. Coordinates are stored temporarily and can be accessed by event coordinators.</p>
      
      <h3>C. Contacts</h3>
      <p><strong>Purpose:</strong> Streamline team member invitations by suggesting contacts from your device.</p>
      <p><strong>How We Use It:</strong> Contacts are accessed temporarily for invite suggestions only. We do not store or retain your contact list.</p>
      
      <h2>6. Data Security</h2>
      <ul>
        <li>We use industry-standard encryption (HTTPS/TLS) for data in transit</li>
        <li>Data at rest is encrypted via Supabase's security protocols</li>
        <li>Access to data is restricted by role-based permissions</li>
        <li>We implement authentication, firewalls, and regular security monitoring</li>
        <li><strong>Note:</strong> No system is 100% secure; we cannot guarantee absolute security</li>
      </ul>
      
      <h2>7. Data Retention</h2>
      <ul>
        <li><strong>Active Account Data:</strong> Retained while your account is active</li>
        <li><strong>Event Data:</strong> Retained for 90 days after event completion (or as long as your plan requires)</li>
        <li><strong>Deleted Data:</strong> Permanently deleted within 30 days of account deletion or data removal request</li>
        <li><strong>Log Data:</strong> Retained for 30 days for security and troubleshooting purposes</li>
      </ul>
      
      <h2>8. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of your personal information</li>
        <li><strong>Correction:</strong> Update or correct inaccurate data</li>
        <li><strong>Deletion:</strong> Request deletion of your data (subject to legal obligations)</li>
        <li><strong>Opt-Out:</strong> Disable non-essential permissions (location, camera, contacts) at any time</li>
        <li><strong>Data Portability:</strong> Request your data in a portable format</li>
      </ul>
      <p>To exercise these rights, contact us at <strong>support@eventopoint.app</strong>.</p>
      
      <h2>9. Children's Privacy</h2>
      <p>EVENToPOINT.ops is not intended for users under 18. We do not knowingly collect information from children. If we become aware of such collection, we will delete the information promptly.</p>
      
      <h2>10. International Data Transfers</h2>
      <p>Your data may be processed and stored in the United States (via Supabase/Netlify). By using EVENToPOINT.ops, you consent to such transfers.</p>
      
      <h2>11. Third-Party Links</h2>
      <p>EVENToPOINT.ops may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies separately.</p>
      
      <h2>12. Changes to This Privacy Policy</h2>
      <p>We may update this Privacy Policy periodically. We will notify you of material changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance.</p>
      
      <h2>13. Contact Us</h2>
      <p><strong>For privacy inquiries, requests, or concerns:</strong></p>
      <p>Email: <strong>support@eventopoint.app</strong><br />
      Website: <strong>eventopoint.app</strong><br />
      Company: EVENToPOINT</p>
      
      <p><strong>By using EVENToPOINT.ops, you acknowledge that you have read and understood this Privacy Policy.</strong></p>
    </div>
  );
}›
