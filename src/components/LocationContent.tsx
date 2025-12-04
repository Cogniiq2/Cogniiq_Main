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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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

            <div className="rounded-xl overflow-hidden shadow-md h-[300px] md:h-[400px]">
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2562.8!2d${BUSINESS_INFO.geo.longitude}!3d${BUSINESS_INFO.geo.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDnCsDU2JzUzLjciTiAxMcKwMzQnNDEuOCJF!5e0!3m2!1sde!2sde!4v1234567890`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Standort von ${BUSINESS_INFO.name} in ${BUSINESS_INFO.address.addressLocality}`}
              />
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
