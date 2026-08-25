import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const metadata: Metadata = {
  title: "Areas We Cover",
  description:
    "Blue Star Airport Transfers LTD provides taxi services across the entire United Kingdom. Find your area and book a ride today.",
};

const REGIONS = [
  {
    name: "London",
    cities: ["Central London", "Westminster", "Camden", "Islington", "Hackney", "Tower Hamlets", "Southwark", "Lambeth", "Kensington", "Chelsea", "Greenwich", "Hammersmith"],
  },
  {
    name: "South East",
    cities: ["Brighton", "Oxford", "Reading", "Canterbury", "Southampton", "Portsmouth", "Bournemouth", "Bath", "Exeter", "Plymouth"],
  },
  {
    name: "South West",
    cities: ["Bristol", "Swindon", "Gloucester", "Cheltenham", "Salisbury", "Taunton", "Truro", "Dorchester"],
  },
  {
    name: "Midlands",
    cities: ["Birmingham", "Coventry", "Leicester", "Nottingham", "Derby", "Wolverhampton", "Stoke-on-Trent", "Worcester"],
  },
  {
    name: "North West",
    cities: ["Manchester", "Liverpool", "Leeds", "Bradford", "Preston", "Blackpool", "Chester", "Warrington"],
  },
  {
    name: "North East",
    cities: ["Newcastle", "Sunderland", "Durham", "Middlesbrough", "Hartlepool", "Darlington"],
  },
  {
    name: "Yorkshire",
    cities: ["Leeds", "Sheffield", "York", "Harrogate", "Bradford", "Hull", "Doncaster", "Rotherham"],
  },
  {
    name: "East of England",
    cities: ["Cambridge", "Norwich", "Ipswich", "Colchester", "Luton", "St Albans", "Peterborough", "Southend"],
  },
  {
    name: "Scotland",
    cities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Stirling", "Inverness", "Perth", "Fife"],
  },
  {
    name: "Wales",
    cities: ["Cardiff", "Swansea", "Newport", "Wrexham", "Bangor", "Aberystwyth", "Carmarthen"],
  },
  {
    name: "Northern Ireland",
    cities: ["Belfast", "Derry", "Lisburn", "Newry", "Bangor", "Craigavon"],
  },
];

export default function AreasPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Areas We Cover
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Taxi services across the entire United Kingdom
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {REGIONS.map((region) => (
              <Card key={region.name} className="transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4145A] text-white">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-[#172F52]">
                      {region.name}
                    </h2>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {region.cities.map((city) => (
                      <Link
                        key={city}
                        href="/book"
                        className="rounded-full border border-[#D9E0E8] bg-[#F5F7FA] px-3 py-1 text-xs font-medium text-[#172F52] transition-colors hover:border-[#D4145A] hover:bg-[#FCE7EF] hover:text-[#D4145A]"
                      >
                        {city}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-[#172F52]">
            Can&apos;t Find Your Area?
          </h2>
          <p className="mt-4 text-gray-600">
            We&apos;re constantly expanding. Contact us to check if we service your location.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 text-[#D4145A] font-semibold hover:underline"
          >
            Get in Touch
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
