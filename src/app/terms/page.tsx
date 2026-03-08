
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { APP_NAME } from "@/lib/constants";
import { Mail, Phone } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Introduction",
      content: `${APP_NAME} provides educational services including personalized courses, test series, mentorship programs, and college counselling designed to help students pursue careers in research and higher education. By using the ${APP_NAME} website or services, you acknowledge that you have read, understood, and accepted these Terms and Conditions.`
    },
    {
      title: "2. Use of the Platform",
      content: "Users of the Vidyaheist platform agree to use the website and services responsibly and for educational purposes only. You agree that you will not: Use the website for unlawful activities; Attempt to disrupt or damage the functioning of the platform; Gain unauthorized access to any part of the website or its systems. Vidyaheist reserves the right to suspend or terminate access to the platform if any misuse is detected."
    },
    {
      title: "3. User Registration and Information",
      content: "To access certain services such as courses or test series, users may be required to provide personal details including name, email address, and phone number. By registering, you agree that information provided is accurate, you are responsible for maintaining credential confidentiality, and any activity occurring through your account is your responsibility."
    },
    {
      title: "4. Educational Services",
      content: "Vidyaheist provides various academic services including online courses, test series, performance analysis, mentorship, and college counselling. These are designed to support students in their academic preparation. However, Vidyaheist does not guarantee specific academic outcomes, exam results, or admissions."
    },
    {
      title: "5. Intellectual Property",
      content: "All content available on the Vidyaheist platform including study materials, videos, lectures, test questions, graphics, and design are the intellectual property of Vidyaheist. Users are strictly prohibited from copying, redistributing, sharing login credentials, or uploading material to other platforms."
    },
    {
      title: "6. Payments and Access",
      content: "Some services require payment. By purchasing, you agree to the listed price and terms. Access to digital content is provided after successful payment verification. Course access duration may vary. Vidyaheist reserves the right to modify pricing or services at any time."
    },
    {
      title: "7. Communication Policy",
      content: "By submitting contact details, you consent to receive communication regarding courses, test series, mentorship, and academic updates via phone, SMS, email, or WhatsApp. This may occur even if your number is registered under DND (Do Not Disturb)."
    },
    {
      title: "8. Third-Party Links",
      content: "The website may contain links to external websites. Vidyaheist is not responsible for the content, privacy practices, or accuracy of third-party platforms. Users access these at their own risk."
    },
    {
      title: "9. Limitation of Liability",
      content: "Vidyaheist will not be liable for any direct, indirect, incidental, or consequential damages arising from use or inability to use the website, technical errors, or unauthorized access. All services are provided on an 'as available' basis."
    },
    {
      title: "10. Changes to Terms",
      content: "Vidyaheist reserves the right to update or modify these Terms and Conditions at any time. Continued use of the website after changes indicates acceptance of the revised terms."
    },
    {
      title: "11. Governing Law",
      content: "These Terms and Conditions are governed by the laws of India. Any disputes shall be subject to the jurisdiction of the appropriate courts in India."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">Terms and Conditions</h1>
        <p className="text-muted-foreground">Welcome to {APP_NAME}. Please read these terms carefully.</p>
      </div>

      <Card className="shadow-xl">
        <CardContent className="p-8">
          <div className="space-y-8">
            {sections.map((section, idx) => (
              <section key={idx} className="space-y-3">
                <h2 className="text-xl font-bold text-primary">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </section>
            ))}

            <section className="space-y-4 pt-6 border-t">
              <h2 className="text-xl font-bold text-primary">12. Contact Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Email Us</p>
                    <p className="font-medium">team.vidyaheist@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Call Us</p>
                    <p className="font-medium">+91 7206150973</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    