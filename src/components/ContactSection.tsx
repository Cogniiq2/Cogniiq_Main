import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import { CheckCircle2, Video, Target, Clock } from 'lucide-react';

export function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formElement = e.target as HTMLFormElement;
    const industrySelect = formElement.querySelector('[id="industry"] button');
    const timelineSelect = formElement.querySelector('[id="timeline"] button');

    const payload = {
      name: (document.getElementById("name") as HTMLInputElement).value,
      email: (document.getElementById("email") as HTMLInputElement).value,
      company: (document.getElementById("company") as HTMLInputElement).value,
      industry: industrySelect?.getAttribute('data-value') || "",
      interests,
      timeline: timelineSelect?.getAttribute('data-value') || "",
      goal: (document.getElementById("goal") as HTMLTextAreaElement).value,
      preferredTime: (document.getElementById("preferred-time") as HTMLInputElement).value,
    };

    await fetch("https://hook.eu2.make.com/g7kngisz3tnvrju4q3qnidoi8sqxb65m", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setIsSubmitted(true);
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const benefits = [
    { icon: Video, text: '30–45 Minuten Videocall' },
    { icon: Target, text: 'Analyse deines Status Quo' },
    { icon: Clock, text: 'Konkrete Next Steps & grobe Budget-Spanne' },
  ];

  if (isSubmitted) {
    return (
      <section id="kontakt" ref={ref} className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center bg-gray-50 rounded-3xl p-12 border-2 border-[#8b5cf6]/50 shadow-xl"
          >
            <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#22d3ee] mb-6">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>

            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Vielen Dank für deine Anfrage!
            </h3>

            <p className="text-xl text-gray-600 mb-8">
              Wir melden uns in der Regel innerhalb von 24–48 Stunden mit
              Terminvorschlägen.
            </p>

            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="border-gray-300 hover:bg-gray-100 text-gray-900"
            >
              Weitere Anfrage senden
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="kontakt"
      ref={ref}
      className="py-32 bg-white"
      aria-labelledby="contact-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
      <h2
  id="contact-heading"
  className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900"
>
  Lassen Sie uns über Ihr Projekt sprechen
</h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Kostenloses Erstgespräch buchen
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Teilen Sie uns mit, wo Sie aktuell stehen und welche Ziele Sie
                erreichen möchten. Wir melden uns innerhalb von 24-48 Stunden
                mit einem konkreten Vorschlag und passenden Terminen.
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{
                      duration: 0.6,
                      delay: 0.2 + index * 0.1,
                    }}
                    className="flex items-center gap-4"
                  >
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#22d3ee]/20">
                      <Icon className="w-6 h-6 text-[#8b5cf6]" />
                    </div>
                    <span className="text-gray-700 font-medium">
                      {benefit.text}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-gray-50 rounded-2xl p-8 border border-gray-200 shadow-lg space-y-6"
            >
              <div className="space-y-2 group">
                <Label htmlFor="name" className="text-gray-700 font-medium transition-colors group-focus-within:text-[#8b5cf6]">Vollständiger Name</Label>
                <Input
                  id="name"
                  required
                  className="bg-white border-gray-300 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all duration-300 hover:border-gray-400"
                />
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-gray-700 font-medium transition-colors group-focus-within:text-[#8b5cf6]">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  className="bg-white border-gray-300 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all duration-300 hover:border-gray-400"
                />
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="company" className="text-gray-700 font-medium transition-colors group-focus-within:text-[#8b5cf6]">Unternehmen / Projektname</Label>
                <Input
                  id="company"
                  required
                  className="bg-white border-gray-300 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all duration-300 hover:border-gray-400"
                />
              </div>

              <div className="space-y-2 group" id="industry">
                <Label htmlFor="industry" className="text-gray-700 font-medium transition-colors group-focus-within:text-[#8b5cf6]">Branche</Label>
                <Select required onValueChange={(value) => {
                  const trigger = document.querySelector('#industry button');
                  if (trigger) trigger.setAttribute('data-value', value);
                }}>
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all duration-300 hover:border-gray-400">
                    <SelectValue placeholder="Wähle deine Branche" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden">
                    <SelectItem value="medical" className="cursor-pointer hover:bg-gradient-to-r hover:from-[#8b5cf6]/10 hover:to-[#22d3ee]/10 transition-all duration-200">Medizin & Kliniken</SelectItem>
                    <SelectItem value="gastronomy" className="cursor-pointer hover:bg-gradient-to-r hover:from-[#8b5cf6]/10 hover:to-[#22d3ee]/10 transition-all duration-200">Gastronomie</SelectItem>
                    <SelectItem value="sports" className="cursor-pointer hover:bg-gradient-to-r hover:from-[#8b5cf6]/10 hover:to-[#22d3ee]/10 transition-all duration-200">Sport & Fitness</SelectItem>
                    <SelectItem value="realestate" className="cursor-pointer hover:bg-gradient-to-r hover:from-[#8b5cf6]/10 hover:to-[#22d3ee]/10 transition-all duration-200">Immobilien</SelectItem>
                    <SelectItem value="ecommerce" className="cursor-pointer hover:bg-gradient-to-r hover:from-[#8b5cf6]/10 hover:to-[#22d3ee]/10 transition-all duration-200">E-Commerce</SelectItem>
                    <SelectItem value="other" className="cursor-pointer hover:bg-gradient-to-r hover:from-[#8b5cf6]/10 hover:to-[#22d3ee]/10 transition-all duration-200">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-700 font-medium">Interesse</Label>
                {[
                  'Cutting-Edge Webdesign',
                  'AI Automations',
                  'AI Receptionist',
                  'AI Content Creation',
                ].map((interest) => (
                  <div key={interest} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100/50 transition-all duration-200 group cursor-pointer">
                    <Checkbox
                      id={interest}
                      checked={interests.includes(interest)}
                      onCheckedChange={() => toggleInterest(interest)}
                      className="border-gray-300 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#8b5cf6] data-[state=checked]:to-[#22d3ee] transition-all duration-300 data-[state=checked]:scale-110"
                    />
                    <label
                      htmlFor={interest}
                      className="text-sm text-gray-700 cursor-pointer group-hover:text-gray-900 transition-colors"
                    >
                      {interest}
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-2 group" id="timeline">
                <Label htmlFor="timeline" className="text-gray-700 font-medium transition-colors group-focus-within:text-[#8b5cf6]">Wunschzeitraum für Start</Label>
                <Select required onValueChange={(value) => {
                  const trigger = document.querySelector('#timeline button');
                  if (trigger) trigger.setAttribute('data-value', value);
                }}>
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all duration-300 hover:border-gray-400">
                    <SelectValue placeholder="Wähle einen Zeitraum" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden">
                    <SelectItem value="asap" className="cursor-pointer hover:bg-gradient-to-r hover:from-[#8b5cf6]/10 hover:to-[#22d3ee]/10 transition-all duration-200">So schnell wie möglich</SelectItem>
                    <SelectItem value="1-2months" className="cursor-pointer hover:bg-gradient-to-r hover:from-[#8b5cf6]/10 hover:to-[#22d3ee]/10 transition-all duration-200">In 1–2 Monaten</SelectItem>
                    <SelectItem value="3+months" className="cursor-pointer hover:bg-gradient-to-r hover:from-[#8b5cf6]/10 hover:to-[#22d3ee]/10 transition-all duration-200">In 3+ Monaten</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="goal" className="text-gray-700 font-medium transition-colors group-focus-within:text-[#8b5cf6]">
                  Was ist dein Ziel mit diesem Projekt?
                </Label>
                <Textarea
                  id="goal"
                  required
                  rows={4}
                  className="bg-white border-gray-300 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 resize-none transition-all duration-300 hover:border-gray-400"
                />
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="preferred-time" className="text-gray-700 font-medium transition-colors group-focus-within:text-[#8b5cf6]">
                  Bevorzugte Zeit für einen Call (Optional)
                </Label>
                <Input
                  id="preferred-time"
                  placeholder="z.B. Montag–Mittwoch, 14–17 Uhr"
                  className="bg-white border-gray-300 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all duration-300 hover:border-gray-400"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full hover:scale-[1.02] transition-all duration-300 text-lg py-6"
                aria-label="Kostenloses Erstgespräch anfragen"
              >
                Jetzt Erstgespräch anfragen
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
