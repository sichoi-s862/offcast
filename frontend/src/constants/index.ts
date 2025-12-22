import type { Channel } from '../types';

export const CHANNELS: Channel[] = [
  { id: 'all', name: 'All', minSubs: 0 },
  { id: 'free', name: 'General', minSubs: 0 },
  { id: 'collab', name: 'Collab', minSubs: 0 },
  { id: 'gear', name: 'Gear/Setup', minSubs: 0 },
  { id: 'feedback', name: 'Feedback', minSubs: 0 },
  { id: 'silver', name: '100K+ Lounge', minSubs: 100000 },
  { id: 'gold', name: '500K+ Lounge', minSubs: 500000 },
  { id: 'diamond', name: '1M+ Lounge', minSubs: 1000000 },
];

export const REPORT_REASONS = [
  { label: "Spam / Inappropriate promotion", value: "SPAM" },
  { label: "Harassment / Abusive language", value: "HARASSMENT" },
  { label: "Adult / Sexual content", value: "INAPPROPRIATE" },
  { label: "Hate speech / Misinformation", value: "MISINFORMATION" },
  { label: "Copyright infringement", value: "COPYRIGHT" },
  { label: "Other", value: "OTHER" },
] as const;

export const FAQS = [
  { q: "How do I change my nickname?", a: "Go to My Page > Edit Nickname to change your nickname." },
  { q: "How is my tier calculated?", a: "Your tier is based on the subscriber/follower count from your linked platform." },
  { q: "Will my posts be deleted when I leave?", a: "Your personal data will be removed, but your posts will not be automatically deleted." },
  { q: "Where can I send partnership inquiries?", a: "Use the Contact feature below and select Partnership Inquiry." },
];

export const PRIVACY_POLICY = `Offcast Privacy Policy

Last Updated: December 1, 2024
Effective Date: December 1, 2024

Offcast ("Company") is committed to protecting your personal information in accordance with applicable privacy laws and regulations. This Privacy Policy explains how we collect, use, and protect your information.

Article 1 (Purpose of Processing Personal Information)
The Company processes personal information for the following purposes:

1. Member Registration and Management
   - Identity verification, membership management, prevention of fraudulent use, and various notifications.

2. Service Provision
   - Content delivery, personalized services, and identity verification.

3. Creator Verification
   - Tier calculation based on subscriber count and channel access authorization.

Article 2 (Types of Personal Information Collected)
1. Required Information
   - OAuth Authentication: Platform ID, profile name, profile image URL
   - Creator Information: Subscriber/follower count, channel name
   - Service Usage: Nickname, activity records (posts, comments, likes)

2. Automatically Collected Information
   - IP address, access time, service usage records, device information (browser type, OS)

3. Collection Methods
   - Social login (OAuth 2.0): YouTube, TikTok, Twitter
   - Automatic collection during service use

Article 3 (Retention Period)
1. Personal information is retained for the duration of membership or as required by law.
2. Upon account deletion, all personal data is deleted except as required by law.

Article 4 (Third-Party Disclosure)
The Company does not share personal information with third parties without user consent, except as required by law.

Article 5 (Data Processing Delegation)
Cloud services are provided by Amazon Web Services (AWS) for data storage and server operations.

Article 6 (User Rights)
Users may request access, correction, deletion, or suspension of processing of their personal information at any time.

Article 7 (Data Destruction)
Personal information is destroyed without delay when no longer necessary.

Article 8 (Security Measures)
The Company implements administrative, technical, and physical security measures to protect personal information.

Article 9 (OAuth and Social Login)
1. The Company provides login services through OAuth 2.0 authentication from YouTube, TikTok, and Twitter.
2. Information collected during OAuth:
   - YouTube: Channel ID, channel name, profile image, subscriber count
   - TikTok: User ID, nickname, profile image, follower count
   - Twitter: User ID, nickname, profile image, follower count

3. Users may disconnect the service from their platform account settings at any time.

Article 10 (Cookies)
The Company uses cookies to provide personalized services. Users may configure browser settings to accept or reject cookies.

Article 11 (Privacy Officer)
Contact: privacy@offcast.kr

Article 12 (Policy Changes)
Changes to this Privacy Policy will be announced at least 7 days before taking effect.`;

export const TERMS_OF_SERVICE = `Offcast Terms of Service

Last Updated: December 1, 2024
Effective Date: December 1, 2024

Chapter 1: General Provisions

Article 1 (Purpose)
These Terms of Service govern the conditions and procedures for using the creator community service ("Service") provided by Offcast ("Company"), as well as the rights, obligations, and responsibilities between the Company and its members.

Article 2 (Definitions)
1. "Service" refers to the creator-exclusive community platform and all related services provided by the Company.
2. "Member" refers to any person who agrees to these Terms and enters into a service agreement with the Company.
3. "Creator" refers to any person who creates and publishes content on platforms such as YouTube, TikTok, Twitter, etc.
4. "Post" refers to text, photos, videos, comments, files, links, and other content posted by members on the Service.
5. "Nickname" refers to the combination of letters and numbers set by the member and approved by the Company for member identification and service use.
6. "Channel" refers to bulletin boards within the Service categorized by specific topics or subscriber count criteria.

Article 3 (Posting and Revision of Terms)
1. The Company shall post these Terms in an easily accessible location on the Service.
2. The Company may revise these Terms within the scope permitted by applicable laws.
3. When revising the Terms, the Company shall announce the effective date and reasons for revision at least 7 days prior (30 days for changes unfavorable to members).
4. Members who do not agree to the revised Terms may terminate their service agreement. Continued use of the Service after the effective date constitutes acceptance of the changes.

Article 4 (Interpretation of Terms)
1. Matters not specified in these Terms shall be governed by applicable laws and regulations.
2. The Company may establish separate terms for individual services, which shall take precedence over these Terms in case of conflict.

Chapter 2: Service Agreement

Article 5 (Formation of Agreement)
1. The service agreement is formed when an applicant applies for membership through social login (OAuth) provided by the Company, agrees to these Terms, and the Company accepts the application.
2. The Company generally accepts membership applications but may refuse or terminate the agreement in the following cases:
   a. If the applicant previously lost membership under these Terms
   b. If false information was provided or another person's identity was used
   c. If the Company's membership requirements are not met
   d. If the purpose is fraudulent or commercial exploitation
   e. If the application violates laws or public order
   f. If other application requirements are not satisfied

Article 6 (Social Login and Account)
1. Members join and use the Service through social login (OAuth 2.0) via platforms designated by the Company (YouTube, TikTok, Twitter, etc.).
2. Members consent to the transfer of information (channel info, subscriber count, etc.) from each platform to the Company during social login.
3. Members must manage their account information with due care and may not transfer or lend it to others.
4. Members must immediately notify the Company if they become aware of unauthorized use of their account.

Article 7 (Changes to Member Information)
1. Members may view and modify their personal information through "My Page" in the Service at any time.
2. Members must update any changes to their registration information directly through the Service or by contacting customer support.

Chapter 3: Provision of Service

Article 8 (Service Content)
1. The Services provided by the Company include:
   a. Creator Verification Service: Creator qualification verification through social login
   b. Community Service: Bulletin boards, comments, likes, and other community features
   c. Tier-based Channel Service: Access to exclusive channels based on subscriber count
   d. Other services developed or provided through partnerships

2. The Company may add or modify service content for quality improvement and shall announce such changes.

Article 9 (Service Provision and Interruption)
1. The Service is provided 24 hours a day, 365 days a year in principle.
2. The Company may restrict or suspend all or part of the Service in the following cases:
   a. Unavoidable circumstances due to facility maintenance
   b. When a member interferes with the Company's business
   c. When normal service is disrupted due to power outage, equipment failure, or excessive usage
   d. In cases of force majeure such as natural disasters or national emergencies
3. The Company is not liable for damages caused by temporary service interruption under paragraph 2, unless due to the Company's intentional misconduct or gross negligence.

Article 10 (Channel and Tier System)
1. The Company calculates member tiers based on subscriber count, which may affect channel access.
2. Subscriber counts are based on platform information linked during social login and may be updated periodically.
3. The Company may change channel types and tier criteria with prior notice.

Chapter 4: Member Rights and Obligations

Article 11 (Member Obligations)
Members shall not engage in the following activities:
   a. Using another person's information
   b. Unauthorized modification of Company-posted information
   c. Transmitting or posting unauthorized information (computer programs, etc.)
   d. Infringing on the Company's or third parties' intellectual property rights
   e. Damaging the reputation of or interfering with the Company or third parties
   f. Posting obscene or violent content contrary to public morals
   g. Using the Service for commercial purposes without Company consent
   h. Collecting, storing, or disclosing other members' personal information without consent
   i. Violating applicable laws, these Terms, or other service regulations

Article 12 (Post Management)
1. Rights holders may request suspension or deletion of posts that violate applicable laws, and the Company shall take action accordingly.
2. The Company may take temporary measures against posts even without a rights holder's request if there are grounds for rights infringement or policy violations.
3. The Company may delete, move, or refuse registration of posts without prior notice in the following cases:
   a. Content that defames or damages the reputation of others
   b. Content that violates public order or morals
   c. Content associated with criminal activity
   d. Content that infringes copyrights or other rights
   e. Unauthorized advertising or promotional materials
   f. Disclosure of others' personal information
   g. Repetitive posting of identical content
   h. Content that otherwise violates laws or Company guidelines

Article 13 (Copyright of Posts)
1. Copyright of posts belongs to the respective authors.
2. Posts may be exposed in search results, service promotions, etc., and may be partially modified, reproduced, or edited within the necessary scope. Members may delete or make private their posts at any time.
3. The Company must obtain prior consent from members when using posts in ways other than described in paragraph 2.

Chapter 5: Termination and Restrictions

Article 14 (Termination of Agreement)
1. Members may request termination of the service agreement through the "Account Deletion" feature at any time.
2. Upon termination, all member data is deleted except as required by law or privacy policy.
3. Posts created by members are not automatically deleted upon termination. Members should delete posts before account deletion if desired.

Article 15 (Usage Restrictions)
1. The Company may restrict service usage through warnings, temporary suspension, or permanent suspension when members violate these Terms or interfere with normal service operation.
2. The Company may restrict service usage in the following cases:
   a. Registration with false information
   b. Interfering with other members' service use or misappropriating their information
   c. Activities prohibited by law or these Terms
   d. Other violations of obligations under these Terms
3. The Company shall notify members of the reasons and duration of restrictions, except in urgent cases where notification may follow.

Chapter 6: Damages and Disclaimer

Article 16 (Damages)
1. The Company is liable for damages caused to members through intentional misconduct or gross negligence.
2. Members are liable for damages caused to the Company through violations of these Terms.

Article 17 (Disclaimer)
1. The Company is not liable for inability to provide service due to force majeure including natural disasters, war, or technical difficulties.
2. The Company is not liable for service disruptions caused by member negligence.
3. The Company is not liable for expected profits not realized by members through service use.
4. The Company is not responsible for the reliability or accuracy of information posted by members.
5. The Company is not liable for transactions between members or between members and third parties.
6. The Company is not liable for free services unless otherwise specified by law.

Chapter 7: Miscellaneous

Article 18 (Dispute Resolution)
1. The Company shall prioritize processing complaints and opinions submitted by users. When prompt processing is difficult, the Company shall immediately notify users of the reasons and schedule.
2. Disputes may be resolved through mediation by dispute resolution organizations as requested by relevant authorities.

Article 19 (Jurisdiction and Governing Law)
1. Disputes between the Company and members shall be subject to the exclusive jurisdiction of the court having jurisdiction over the Company's headquarters.
2. The laws of the Republic of Korea shall apply to litigation between the Company and members.

Supplementary Provisions
These Terms are effective from December 1, 2024.`;

// 하위 호환성을 위해 TERMS도 유지
export const TERMS = PRIVACY_POLICY;
