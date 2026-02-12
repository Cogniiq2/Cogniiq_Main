import { MapPin, Users, Building2, Zap } from "lucide-react";
import { BUSINESS_INFO, getGoogleMapsUrl } from "@/lib/seo-data";
import { motion } from "framer-motion";

export function LocationContent() {
  const locations = [
    {
      icon: MapPin,
      title: "Bayreuth",
      description: "Unser Hauptsitz im Herzen von Bayreuth. Persönliche Beratung vor Ort möglich.",
      emphasis: "primary",
    },
    {
      icon: Building2,
      title: "Bayern",
      description: "Wir betreuen Unternehmen in ganz Bayern - von München bis Nürnberg.",
      emphasis: "secondary",
    },
    {
      icon: Users,
      title: "Deutschland",
      description: "Remote-Zusammenarbeit mit Kunden in ganz Deutschland.",
      emphasis: "secondary",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ihre AI & Webdesign Agentur in{" "}
            <span className="text-[#515A61]">Bayreuth</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Mit Sitz in Bayreuth betreuen wir Unternehmen in ganz Deutschland.
            Ob persönlich vor Ort oder remote - wir finden die beste Lösung für Ihr Projekt.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {locations.map((location, index) => {
            const Icon = location.icon;
            return (
              <motion.div
                key={location.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-2xl ${
                  location.emphasis === "primary"
                    ? "bg-[#515A61] text-white shadow-lg"
                    : "bg-white border border-gray-200"
                }`}
              >
                <Icon
                  size={32}
                  className={`mb-4 ${
                    location.emphasis === "primary" ? "text-white" : "text-[#515A61]"
                  }`}
                />
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    location.emphasis === "primary" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {location.title}
                </h3>
                <p
                  className={
                    location.emphasis === "primary" ? "text-gray-100" : "text-gray-600"
                  }
                >
                  {location.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={24} className="text-[#515A61]" />
                <h3 className="text-2xl font-bold text-gray-900">
                  Lokal verwurzelt, digital vernetzt
                </h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Als <strong>AI Agentur und Webdesign Agentur in Bayreuth</strong> verstehen
                wir die Bedürfnisse lokaler Unternehmen. Gleichzeitig nutzen wir modernste
                Technologien, um Kunden in ganz Deutschland zu betreuen.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                <strong>Persönliche Termine</strong> sind im Raum Bayreuth, Regensburg und
                München möglich. Für alle anderen Standorte arbeiten wir remote - mit den
                gleichen hohen Standards.
              </p>
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#515A61] hover:text-[#434A51] font-medium transition-colors"
              >
                <MapPin size={18} />
                {BUSINESS_INFO.address.streetAddress}, {BUSINESS_INFO.address.postalCode}{" "}
                {BUSINESS_INFO.address.addressLocality}
              </a>
            </div>

            <div className="relative rounded-xl overflow-hidden shadow-md h-[300px] md:h-[400px] group">
              <div
                className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect fill='%23f5f5f5' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='16' font-weight='600' fill='%23666'%3EBayreuth, Bayern%3C/text%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='12' fill='%23999'%3E${BUSINESS_INFO.address.streetAddress}%3C/text%3E%3C/svg%3E")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-white hover:bg-gray-50 rounded-full shadow-lg font-semibold text-gray-900 text-sm flex items-center gap-2 transition-all hover:scale-105"
                >
                  <MapPin size={18} className="text-[#515A61]" />
                  In Google Maps öffnen
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500">
            Servicing: Bayreuth, München, Nürnberg, Regensburg, Bamberg, Würzburg, Erlangen,
            Fürth, Ingolstadt, Augsburg und ganz Deutschland
          </p>
        </motion.div>
      </div>
    </section>
  );
}
