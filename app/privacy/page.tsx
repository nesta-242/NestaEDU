"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PenTool, ArrowLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex h-screen flex-col border-r bg-background/80 backdrop-blur-sm w-64">
        <div className="p-6 border-b bg-background/90">
          <div className="flex items-center gap-3">
            <PenTool className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Nesta Education</h2>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 bg-background/70">
          <ul className="grid gap-1">
            <li>
              <Link href="/signup">
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-background/80"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Sign Up Page
                </Button>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden bg-background">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b bg-background/90 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PenTool className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Nesta Education</h2>
            </div>
            <Link href="/signup">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign Up
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-background/95 backdrop-blur-sm border-2">
              <CardHeader>
                <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
                <div className="text-sm text-muted-foreground">
                  <p>Effective Date: July 2025</p>
                  <p>Last Updated: July 2025</p>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="mb-6">
                  Nesta Education ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our tutoring services, or otherwise interact with our platform (collectively, the "Services").
                </p>
                
                <p className="mb-6">
                  By accessing or using Nesta Education, you agree to the terms of this Privacy Policy. If you do not agree with the terms of this policy, please do not use our Services.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
                <p className="mb-4">We may collect the following types of information:</p>
                
                <h3 className="text-lg font-semibold mt-6 mb-3">a. Personal Information</h3>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Age or date of birth</li>
                  <li>Billing and payment information (if applicable)</li>
                  <li>School, grade level, or education status</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6 mb-3">b. Educational Information</h3>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>Test scores, grades, or performance data</li>
                  <li>Learning preferences and goals</li>
                  <li>Assignments or responses submitted through the platform</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6 mb-3">c. Technical Information</h3>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>Usage data (e.g., pages viewed, features used)</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6 mb-3">d. Cookies and Tracking Technologies</h3>
                <p className="mb-6">
                  We use cookies and similar technologies to collect information and improve the user experience. You can manage your cookie preferences through your browser settings.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
                <p className="mb-4">We use the information we collect to:</p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Provide and personalize tutoring and educational services</li>
                  <li>Communicate with you (e.g., updates, support, notifications)</li>
                  <li>Improve our platform, features, and content</li>
                  <li>Analyze usage for internal research and development</li>
                  <li>Ensure compliance with legal obligations</li>
                  <li>Process payments and manage billing (if applicable)</li>
                  <li>Prevent fraud, abuse, and other harmful activities</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-4">3. How We Share Your Information</h2>
                <p className="mb-4">
                  We do not sell your personal data. We may share your information with:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Tutors and educators employed or contracted by Nesta Education</li>
                  <li>Third-party service providers (e.g., hosting, analytics, payment processors)</li>
                  <li>Legal or regulatory authorities, when required to comply with applicable law, legal process, or government requests</li>
                  <li>In connection with a merger or acquisition, if Nesta Education is involved in a business transaction, your data may be transferred as part of that transaction</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-4">4. Data Retention</h2>
                <p className="mb-6">
                  We retain personal and educational data for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law. You may request deletion of your data at any time.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">5. Data Security</h2>
                <p className="mb-6">
                  We implement reasonable administrative, technical, and physical safeguards to protect your information. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">6. Children's Privacy</h2>
                <p className="mb-6">
                  Nesta Education is designed for students, including children under 13, with the involvement of a parent, guardian, or school official. We comply with the Children's Online Privacy Protection Act (COPPA). We do not knowingly collect personal information from children without verifiable parental consent.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">7. Your Rights and Choices</h2>
                <p className="mb-4">
                  Depending on your location, you may have the following rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Access and review your data</li>
                  <li>Request correction of inaccurate or incomplete data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of certain communications (e.g., marketing emails)</li>
                  <li>Withdraw consent (where applicable)</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-4">8. International Users</h2>
                <p className="mb-6">
                  If you are accessing our Services from outside the United States, be aware that your information may be transferred to and processed in the United States, where data protection laws may differ from those in your country.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">9. Third-Party Links and Integrations</h2>
                <p className="mb-6">
                  Our Services may contain links to third-party websites or tools (e.g., Zoom, Google Classroom). We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before interacting with them.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">10. Changes to This Policy</h2>
                <p className="mb-6">
                  We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 