"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PenTool, ArrowLeft } from "lucide-react"

export default function TermsOfServicePage() {
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
                <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
                <div className="text-sm text-muted-foreground">
                  <p>Effective Date: July 2025</p>
                  <p>Last Updated: July 2025</p>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="mb-6">
                  Welcome to Nesta Education ("Nesta," "we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of our website, applications, and services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy (the "Agreement").
                </p>
                
                <p className="mb-6">
                  If you do not agree with these Terms, you may not use our Services.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">1. Eligibility</h2>
                <p className="mb-4">
                  By using the Services, you represent that you are:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>At least 13 years of age, or the age of digital consent in your country; or</li>
                  <li>Using the platform under the supervision and consent of a parent, guardian, or authorized school representative</li>
                </ul>
                <p className="mb-6">
                  Nesta Education may suspend or terminate your account if we reasonably believe you do not meet eligibility requirements.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">2. User Accounts</h2>
                <p className="mb-4">
                  To access certain features of the Services, you may need to create an account. You agree to:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Provide accurate and complete information during registration</li>
                  <li>Keep your login credentials secure</li>
                  <li>Be responsible for all activities that occur under your account</li>
                  <li>Notify us immediately of any unauthorized access or use</li>
                </ul>
                <p className="mb-6">
                  You may not share your account or use another person's account without permission.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">3. Use of Services</h2>
                <p className="mb-4">
                  You agree to use the Services only for lawful, personal, educational purposes. You agree not to:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Access or attempt to access the accounts of other users</li>
                  <li>Use the platform for any commercial, harmful, or misleading purposes</li>
                  <li>Upload or distribute viruses, malware, or harmful code</li>
                  <li>Violate the intellectual property rights of Nesta or others</li>
                  <li>Use automated systems to scrape, crawl, or extract data</li>
                  <li>Harass, threaten, or abuse any user or employee</li>
                </ul>
                <p className="mb-6">
                  We reserve the right to monitor use and take action if any terms are violated.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">4. Payments and Subscriptions</h2>
                <p className="mb-4">
                  Some features of the Services may require payment or subscription. By purchasing a paid feature, you agree to:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Pay all applicable fees</li>
                  <li>Provide accurate billing information</li>
                  <li>Allow us to charge your payment method on a recurring basis (if applicable)</li>
                </ul>
                <p className="mb-6">
                  Unless otherwise stated, all payments are non-refundable. You may cancel your subscription at any time, but cancellation will not retroactively refund previous charges.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
                <p className="mb-4">
                  All content, software, trademarks, logos, and materials available on Nesta Education are owned by us or licensed to us and are protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p className="mb-4">
                  You are granted a limited, non-exclusive, non-transferable license to access and use the Services for educational purposes only. You may not copy, modify, sell, distribute, or create derivative works without express written consent.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">6. User Content</h2>
                <p className="mb-4">
                  You may upload or submit content (such as assignments, answers, or messages) as part of your use of the Services ("User Content").
                </p>
                <p className="mb-4">
                  By submitting User Content, you grant Nesta a worldwide, royalty-free license to use, host, display, and analyze the content solely for the purpose of providing and improving the Services. You retain all ownership rights to your content.
                </p>
                <p className="mb-6">
                  You are solely responsible for your User Content and must ensure it does not violate any laws or third-party rights.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">7. Third-Party Services</h2>
                <p className="mb-6">
                  Our Services may integrate with or link to third-party tools and platforms (e.g., Zoom, Google Classroom, Stripe). We are not responsible for the availability, content, or privacy practices of third parties. Use of third-party services is subject to their own terms and conditions.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">8. Termination</h2>
                <p className="mb-4">
                  We reserve the right to suspend or terminate your access to the Services at any time, with or without notice, if we believe you have violated these Terms or pose a risk to the platform or its users.
                </p>
                <p className="mb-4">
                  You may terminate your account at any time by contacting support.
                </p>
                <p className="mb-6">
                  Upon termination, you lose access to your account and associated data, unless retention is required by law or permitted under our Privacy Policy.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">9. Disclaimers</h2>
                <p className="mb-4">
                  The Services are provided "as is" and "as available." We do not guarantee that:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>The Services will be uninterrupted, timely, secure, or error-free</li>
                  <li>The educational results will meet your expectations or goals</li>
                  <li>All information provided is accurate, complete, or current</li>
                </ul>
                <p className="mb-6">
                  We disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">10. Limitation of Liability</h2>
                <p className="mb-4">
                  To the fullest extent permitted by law, Nesta Education and its affiliates, officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data, arising out of your use or inability to use the Services.
                </p>
                <p className="mb-6">
                  Our total liability to you for any claim arising out of or relating to these Terms or the Services is limited to the amount paid by you (if any) in the 12 months prior to the claim.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4">11. Indemnification</h2>
                <p className="mb-4">
                  You agree to defend, indemnify, and hold harmless Nesta Education and its affiliates from any claims, liabilities, damages, losses, and expenses (including legal fees) arising from:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Your violation of these Terms</li>
                  <li>Your use or misuse of the Services</li>
                  <li>Your violation of any rights of another</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-4">12. Changes to the Terms</h2>
                <p className="mb-6">
                  We may update these Terms from time to time. If we make significant changes, we will notify you by email or through the Services. Your continued use of the Services after changes become effective constitutes your acceptance of the new Terms.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 