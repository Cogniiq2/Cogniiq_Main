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
import { CheckCircle2, Sparkles, Zap, Target, ArrowRight, Mail, Building2, Globe, Calendar } from 'lucide-react';
import { PremiumCalendar } from './PremiumCalendar';

export function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [selectedDateTime, setSelectedDateTime] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
      preferredTime: selectedDateTime || "Keine Angabe",
    };

    try {
      await fetch("https://n8n.cogniiq.co/webhook/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const benefits = [
    {
      icon: Sparkles,
      title: 'Premium-Beratung',
      text: '30–45 Min. persönlicher Videocall',
      gradient: 'from-slate-700 via-slate-600 to-slate-700',
      accent: 'from-amber-200/20 to-yellow-200/20'
    },
    {
      icon: Target,
      title: 'Maßgeschneidert',
      text: 'Detaillierte Analyse Ihres Status Quo',
      gradient: 'from-slate-700 via-slate-600 to-slate-700',
      accent: 'from-blue-200/20 to-cyan-200/20'
    },
    {
      icon: Zap,
      title: 'Sofort umsetzbar',
      text: 'Konkrete Roadmap & Budget-Transparenz',
      gradient: 'from-slate-700 via-slate-600 to-slate-700',
      accent: 'from-emerald-200/20 to-teal-200/20'
    },
  ];

  const interestOptions = [
    { value: 'Cutting-Edge Webdesign', icon: Globe, gradient: 'from-slate-800 to-slate-700', glow: 'shadow-slate-500/50' },
    { value: 'AI Automations', icon: Zap, gradient: 'from-slate-800 to-slate-700', glow: 'shadow-blue-500/50' },
    { value: 'AI Receptionist', icon: Mail, gradient: 'from-slate-800 to-slate-700', glow: 'shadow-cyan-500/50' },
    { value: 'AI Content Creation', icon: Sparkles, gradient: 'from-slate-800 to-slate-700', glow: 'shadow-amber-500/50' },
  ];

  if (isSubmitted) {
    return (
      <section id="kontakt" ref={ref} className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/30 via-transparent to-transparent" />

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
            className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl rounded-3xl p-12 lg:p-16 shadow-2xl border border-slate-700/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-slate-400 to-transparent" />

            <div className="relative z-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center mb-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-slate-400/30 rounded-full blur-3xl opacity-50 animate-pulse" />
                  <div className="relative p-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 shadow-2xl shadow-amber-500/20 border border-slate-600/50">
                    <CheckCircle2 className="w-16 h-16 text-amber-300" strokeWidth={2.5} />
                  </div>
                </div>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-clip-text text-transparent"
              >
                Vielen Dank!
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl lg:text-2xl text-slate-300 mb-8 leading-relaxed"
              >
                Ihre Anfrage wurde erfolgreich übermittelt.
                <br />
                <span className="text-amber-300 font-medium">Wir melden uns innerhalb von 24–48 Stunden.</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  size="lg"
                  className="group border-2 border-slate-600 hover:border-amber-500/50 hover:bg-slate-800/50 text-slate-200 hover:text-amber-300 px-8 py-6 text-lg font-medium transition-all duration-300 backdrop-blur-sm"
                >
                  <span>Weitere Anfrage senden</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="kontakt"
      ref={ref}
      className="relative py-32 overflow-hidden"
      aria-labelledby="contact-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/30 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 mb-6"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-slate-300">Premium-Erstberatung</span>
          </motion.div>

          <h2
            id="contact-heading"
            className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-clip-text text-transparent"
          >
            Lassen Sie uns über
            <br />
            Ihr Projekt sprechen
          </h2>

          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Starten Sie Ihre digitale Transformation mit einer persönlichen Beratung
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="space-y-6">
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
                    className="group relative overflow-hidden bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl hover:shadow-amber-900/20 hover:border-slate-600/80 transition-all duration-500"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${benefit.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <div className="relative flex items-start gap-4">
                      <div className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-br ${benefit.gradient} shadow-lg border border-slate-600/50`}>
                        <Icon className="w-6 h-6 text-amber-300" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-100 mb-1">
                          {benefit.title}
                        </h3>
                        <p className="text-slate-400">
                          {benefit.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-8 border border-amber-900/30 shadow-2xl shadow-amber-900/20"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">
                    Exklusiver Vorteil
                  </h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Als einer unserer ersten Kunden profitieren Sie von unserem Launch-Angebot mit{' '}
                  <span className="text-amber-400 font-semibold">bis zu 30% Rabatt</span> auf Ihr Projekt.
                </p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="lg:col-span-3"
          >
            <form
              onSubmit={handleSubmit}
              className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 lg:p-10 border border-slate-700/50 shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] via-transparent to-blue-500/[0.02]" />
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-slate-400 to-transparent" />

              <div className="relative space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Vollständiger Name
                    </Label>
                    <Input
                      id="name"
                      required
                      placeholder="Max Mustermann"
                      className="h-12 bg-slate-800/50 backdrop-blur-sm border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all duration-300 hover:border-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      E-Mail-Adresse
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="max@unternehmen.de"
                      className="h-12 bg-slate-800/50 backdrop-blur-sm border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 hover:border-slate-600"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      Unternehmen / Projekt
                    </Label>
                    <Input
                      id="company"
                      required
                      placeholder="Ihr Unternehmensname"
                      className="h-12 bg-slate-800/50 backdrop-blur-sm border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all duration-300 hover:border-slate-600"
                    />
                  </div>

                  <div className="space-y-2" id="industry">
                    <Label htmlFor="industry" className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Branche
                    </Label>
                    <Select
                      required
                      onValueChange={(value) => {
                        const trigger = document.querySelector('#industry button');
                        if (trigger) trigger.setAttribute('data-value', value);
                      }}
                    >
                      <SelectTrigger className="h-12 bg-slate-800/50 backdrop-blur-sm border-slate-700 text-slate-100 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 hover:border-slate-600">
                        <SelectValue placeholder="Wählen Sie Ihre Branche" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl">
                        <SelectItem value="medical" className="cursor-pointer text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition-all duration-200 py-3">
                          Medizin & Kliniken
                        </SelectItem>
                        <SelectItem value="gastronomy" className="cursor-pointer text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition-all duration-200 py-3">
                          Gastronomie
                        </SelectItem>
                        <SelectItem value="sports" className="cursor-pointer text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition-all duration-200 py-3">
                          Sport & Fitness
                        </SelectItem>
                        <SelectItem value="realestate" className="cursor-pointer text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition-all duration-200 py-3">
                          Immobilien
                        </SelectItem>
                        <SelectItem value="ecommerce" className="cursor-pointer text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition-all duration-200 py-3">
                          E-Commerce
                        </SelectItem>
                        <SelectItem value="other" className="cursor-pointer text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition-all duration-200 py-3">
                          Sonstiges
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    Ihre Interessen
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {interestOptions.map((option) => {
                      const Icon = option.icon;
                      const isChecked = interests.includes(option.value);

                      return (
                        <div
                          key={option.value}
                          className={`
                            relative overflow-hidden flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-500 border-2
                            ${isChecked
                              ? `border-slate-600 bg-gradient-to-br ${option.gradient} shadow-xl ${option.glow}`
                              : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50 hover:shadow-lg'
                            }
                          `}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleInterest(option.value);
                          }}
                        >
                          <div className="relative z-10 flex items-center gap-3 w-full">
                            <div
                              className={`
                                h-4 w-4 shrink-0 rounded-sm border-2 transition-all duration-300 flex items-center justify-center
                                ${isChecked
                                  ? 'border-amber-400 bg-amber-400'
                                  : 'border-slate-600 bg-slate-800/50'
                                }
                              `}
                            >
                              {isChecked && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="w-3 h-3 text-slate-900"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                              <Icon className={`w-4 h-4 ${isChecked ? 'text-slate-100' : 'text-slate-400'}`} />
                              <span className={`text-sm font-medium ${isChecked ? 'text-slate-100' : 'text-slate-400'}`}>
                                {option.value}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2" id="timeline">
                  <Label htmlFor="timeline" className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Wunschzeitraum für Start
                  </Label>
                  <Select
                    required
                    onValueChange={(value) => {
                      const trigger = document.querySelector('#timeline button');
                      if (trigger) trigger.setAttribute('data-value', value);
                    }}
                  >
                    <SelectTrigger className="h-12 bg-slate-800/50 backdrop-blur-sm border-slate-700 text-slate-100 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300 hover:border-slate-600">
                      <SelectValue placeholder="Wählen Sie einen Zeitraum" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl">
                      <SelectItem value="asap" className="cursor-pointer text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition-all duration-200 py-3">
                        So schnell wie möglich
                      </SelectItem>
                      <SelectItem value="1-2months" className="cursor-pointer text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition-all duration-200 py-3">
                        In 1–2 Monaten
                      </SelectItem>
                      <SelectItem value="3+months" className="cursor-pointer text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition-all duration-200 py-3">
                        In 3+ Monaten
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal" className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    Was ist Ihr Ziel mit diesem Projekt?
                  </Label>
                  <Textarea
                    id="goal"
                    required
                    rows={4}
                    placeholder="Beschreiben Sie Ihre Vision und Ziele..."
                    className="bg-slate-800/50 backdrop-blur-sm border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 resize-none transition-all duration-300 hover:border-slate-600"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    Bevorzugter Termin für Erstgespräch (Optional)
                  </Label>
                  <PremiumCalendar
                    onSelect={(dateTime) => setSelectedDateTime(dateTime)}
                    selectedDateTime={selectedDateTime}
                  />
                </div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="group relative w-full h-14 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 hover:shadow-2xl hover:shadow-amber-900/30 transition-all duration-500 text-slate-100 font-semibold text-lg overflow-hidden border border-slate-600/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 via-amber-500/20 to-amber-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="relative flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full"
                          />
                          Wird gesendet...
                        </>
                      ) : (
                        <>
                          Jetzt Premium-Beratung anfragen
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform group-hover:text-amber-300" />
                        </>
                      )}
                    </span>
                  </Button>
                </motion.div>

                <p className="text-center text-sm text-slate-500">
                  Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
