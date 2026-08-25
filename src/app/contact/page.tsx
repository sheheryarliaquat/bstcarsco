"use client";

import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";

const CONTACT_INFO = [
  {
    icon: Phone,
    title: "Phone",
    details: ["0800 123 456", "Mon – Fri: 8am – 8pm", "Sat – Sun: 9am – 6pm"],
  },
  {
    icon: Mail,
    title: "Email",
    details: ["support@bstcars.co", "corporate@bstcars.co", "We respond within 24 hours"],
  },
  {
    icon: MapPin,
    title: "Address",
    details: ["Blue Star Airport Transfers LTD", "10 Downing Street", "London, SW1A 2AA"],
  },
  {
    icon: Clock,
    title: "Support Hours",
    details: ["Monday – Friday: 8am – 8pm", "Saturday: 9am – 6pm", "Sunday: 9am – 5pm"],
  },
];

export default function ContactPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            We&apos;re here to help. Get in touch with our team.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-[#172F52]">
                Send Us a Message
              </h2>
              <p className="mt-4 text-gray-600">
                Fill out the form below and we&apos;ll get back to you as soon as
                possible.
              </p>
              <form className="mt-8 flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#172033]">
                      Full Name
                    </label>
                    <Input placeholder="John Smith" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#172033]">
                      Email Address
                    </label>
                    <Input placeholder="john@example.co.uk" type="email" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#172033]">
                    Phone Number (optional)
                  </label>
                  <Input placeholder="07700 900000" type="tel" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#172033]">
                    Subject
                  </label>
                  <Input placeholder="How can we help?" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#172033]">
                    Message
                  </label>
                  <Textarea placeholder="Tell us more..." className="min-h-32" />
                </div>
                <Button
                  type="submit"
                  className="self-start bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {CONTACT_INFO.map((info) => (
                <Card key={info.title}>
                  <CardContent className="flex gap-4 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FCE7EF]">
                      <info.icon className="h-6 w-6 text-[#D4145A]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#172F52]">
                        {info.title}
                      </h3>
                      <div className="mt-1 space-y-1">
                        {info.details.map((d) => (
                          <p key={d} className="text-sm text-gray-600">
                            {d}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">Find Us</h2>
          </div>
          <div className="mt-8 flex h-80 items-center justify-center rounded-xl bg-[#D9E0E8] text-gray-500">
            <div className="text-center">
              <MapPin className="mx-auto h-12 w-12 text-[#D4145A]" />
              <p className="mt-4 text-sm">Map integration coming soon</p>
              <p className="text-xs text-gray-400">
                10 Downing Street, London, SW1A 2AA
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
